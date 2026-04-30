const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const path = require("path");
const { exec } = require("child_process");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { initDB, getDb, encrypt, decrypt } = require("./database");
const wgService = require("./wgService");

require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "../frontend/dist")));

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

// Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

function generateWgConfig(privateKey, ip, killSwitch) {
  let config = `[Interface]
PrivateKey = ${privateKey}
Address = ${ip}/32
DNS = 1.1.1.1
`;
  if (killSwitch) {
    config += `PostUp = iptables -I OUTPUT ! -o %i -m mark ! --mark $(wg show %i fwmark) -m addrtype ! --dst-type LOCAL -j REJECT
PreDown = iptables -D OUTPUT ! -o %i -m mark ! --mark $(wg show %i fwmark) -m addrtype ! --dst-type LOCAL -j REJECT
`;
  }
  config += `
[Peer]
PublicKey = ${process.env.SERVER_PUBLIC_KEY || 'SERVER_PUB_KEY_PLACEHOLDER'}
AllowedIPs = 0.0.0.0/0
Endpoint = ${process.env.SERVER_ENDPOINT || 'vpn.example.com:51820'}
PersistentKeepalive = 25`;
  return config;
}

// ── AUTH ROUTES ──

app.post("/api/admin/login", async (req, res) => {
  const { password } = req.body;
  // In a real DB we'd fetch the user's hash. Here we use the env password for MVP.
  // We can simulate a bcrypt check if we stored the hash in env, but for MVP we just compare.
  // Or we could enforce the env to be a hash. Let's just compare plaintext for MVP to save time,
  // or hash the .env password in memory and compare. Let's do simple compare for MVP.
  if (password === ADMIN_PASSWORD) {
    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: "Invalid password" });
  }
});

app.post("/api/admin/logout", authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const clients = await db.all("SELECT id, public_key FROM clients");
    
    for (const client of clients) {
      await wgService.removePeer(client.public_key);
      await db.run("DELETE FROM clients WHERE id = ?", [client.id]);
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('[Logout Error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── CLIENT ROUTES ──

// Get all clients + status
app.get("/api/clients", authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const clients = await db.all("SELECT id, name, public_key, ip_address, created_at, active FROM clients ORDER BY created_at DESC");
    
    // Fetch live stats from WireGuard
    const wgStatus = await wgService.parseWgShow('wg1');

    const clientsWithStatus = clients.map(client => {
      const stats = wgStatus.get(client.public_key) || {
        latestHandshake: 0,
        rx: 0,
        tx: 0,
        online: false
      };
      return { ...client, stats };
    });

    const ephemeralHours = parseInt(process.env.EPHEMERAL_HOURS || 24, 10);
    res.json({ clients: clientsWithStatus, ephemeralHours });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new client
app.post("/api/clients", authenticateToken, async (req, res) => {
  try {
    const { name, killSwitch } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });

    const db = getDb();
    
    await db.exec('BEGIN EXCLUSIVE TRANSACTION');
    
    const existingClients = await db.all("SELECT ip_address FROM clients");
    
    const ip = wgService.allocateIp(existingClients);
    const keys = await wgService.generateKeys();
    const id = crypto.randomUUID();
    const encryptedPrivKey = encrypt(keys.privateKey);
    const isKillSwitch = killSwitch ? 1 : 0;

    await db.run(
      "INSERT INTO clients (id, name, public_key, private_key_enc, ip_address, kill_switch) VALUES (?, ?, ?, ?, ?, ?)",
      [id, name, keys.publicKey, encryptedPrivKey, ip, isKillSwitch]
    );

    await db.exec('COMMIT');

    // Add peer to VPS WireGuard (non-blocking — won't fail the response)
    wgService.addPeer(keys.publicKey, ip);

    // Provide the config to the frontend just this once
    const config = generateWgConfig(keys.privateKey, ip, isKillSwitch);

    res.json({
      id,
      name,
      ip,
      config,
      publicKey: keys.publicKey
    });
  } catch (err) {
    const db = getDb();
    try { await db.exec('ROLLBACK'); } catch(e){}
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET Settings
app.get("/api/settings", authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const settingsRows = await db.all("SELECT key, value FROM settings");
    const settings = {};
    for (const row of settingsRows) {
      settings[row.key] = row.value === 'true';
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Settings
app.post("/api/settings", authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ error: "Key is required" });
    
    await db.run("UPDATE settings SET value = ? WHERE key = ?", [String(value), key]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Re-download client config
app.get("/api/clients/:id/config", authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const client = await db.get("SELECT * FROM clients WHERE id = ?", [req.params.id]);
    if (!client) return res.status(404).json({ error: "Client not found" });

    const privateKey = decrypt(client.private_key_enc);
    
    const config = generateWgConfig(privateKey, client.ip_address, client.kill_switch);

    res.json({ config });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Revoke client
app.delete("/api/clients/:id", authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    // Fetch client first to get its public key for WG removal
    const client = await db.get("SELECT public_key FROM clients WHERE id = ?", [req.params.id]);
    if (!client) return res.status(404).json({ error: "Client not found" });

    await db.run("DELETE FROM clients WHERE id = ?", [req.params.id]);
    
    // Remove peer from VPS WireGuard
    wgService.removePeer(client.public_key);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stats route
app.get("/api/stats", authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const clients = await db.all("SELECT id, public_key FROM clients");
    const wgStatus = await wgService.parseWgShow('wg1');
    
    let activeCount = 0;
    let totalRx = 0;
    let totalTx = 0;

    for (const client of clients) {
      const stats = wgStatus.get(client.public_key);
      if (stats) {
        if (stats.online) activeCount++;
        totalRx += stats.rx;
        totalTx += stats.tx;
      }
    }

    res.json({
      totalClients: clients.length,
      activeClients: activeCount,
      totalRx,
      totalTx,
      timestamp: Date.now(),
      entryNode: process.env.ENTRY_NODE || 'Singapore',
      exitNode: process.env.EXIT_NODE || 'Germany'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// The "catchall" handler: for any request that doesn't match one above, send back React's index.html file.
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

const PORT = process.env.PORT || 5000;

initDB().then(async () => {
  // Auto-fetch server public key from VPS if not already configured
  await wgService.autoFetchServerKey();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Nexus VPN Admin Backend running on http://localhost:${PORT}`);
    
    // Background Task: Automated Key Rotation
    setInterval(() => {
      console.log('[Scheduler] Triggering automated key rotation script...');
      exec('npm run rotate', { cwd: __dirname }, (error, stdout, stderr) => {
        if (error) console.error(`[Scheduler] Rotate script failed: ${error.message}`);
        if (stderr) console.error(`[Scheduler] Rotate stderr: ${stderr}`);
      });
    }, 60 * 60 * 1000); // 1 hour

    // Background Task: Ephemeral Ghost Peer Pruning
    setInterval(() => {
      console.log('[Scheduler] Triggering ephemeral pruning script...');
      exec('npm run clean', { cwd: __dirname }, (error, stdout, stderr) => {
        if (error) console.error(`[Scheduler] Prune script failed: ${error.message}`);
      });
    }, 15 * 60 * 1000); // 15 minutes

  });
}).catch(err => {
  console.error("Failed to initialize DB:", err);
  process.exit(1);
});