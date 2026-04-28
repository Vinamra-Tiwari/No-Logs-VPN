const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const path = require("path");
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

    res.json({ clients: clientsWithStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new client
app.post("/api/clients", authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });

    const db = getDb();
    
    // Ensure serial IP allocation by wrapping in a simple lock or doing it sequentially
    // Since node is single-threaded, if we await the DB fetch and insert, it's fairly safe,
    // but concurrent requests might cause a race condition. Let's use a transaction-like approach.
    await db.exec('BEGIN EXCLUSIVE TRANSACTION');
    
    const existingClients = await db.all("SELECT ip_address FROM clients");
    
    const ip = wgService.allocateIp(existingClients);
    const keys = await wgService.generateKeys();
    const id = crypto.randomUUID();
    const encryptedPrivKey = encrypt(keys.privateKey);

    await db.run(
      "INSERT INTO clients (id, name, public_key, private_key_enc, ip_address) VALUES (?, ?, ?, ?, ?)",
      [id, name, keys.publicKey, encryptedPrivKey, ip]
    );

    const allClients = await db.all("SELECT public_key, ip_address, active FROM clients");
    await db.exec('COMMIT');

    // Sync WG config
    await wgService.syncConfig(allClients);

    // Provide the config to the frontend just this once
    const config = `[Interface]
PrivateKey = ${keys.privateKey}
Address = ${ip}/32
DNS = 1.1.1.1

[Peer]
PublicKey = ${process.env.SERVER_PUBLIC_KEY || 'SERVER_PUB_KEY_PLACEHOLDER'}
AllowedIPs = 0.0.0.0/0
Endpoint = ${process.env.SERVER_ENDPOINT || 'vpn.example.com:51820'}
PersistentKeepalive = 25`;

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

// Re-download client config
app.get("/api/clients/:id/config", authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const client = await db.get("SELECT * FROM clients WHERE id = ?", [req.params.id]);
    if (!client) return res.status(404).json({ error: "Client not found" });

    const privateKey = decrypt(client.private_key_enc);
    
    const config = `[Interface]
PrivateKey = ${privateKey}
Address = ${client.ip_address}/32
DNS = 1.1.1.1

[Peer]
PublicKey = ${process.env.SERVER_PUBLIC_KEY || 'SERVER_PUB_KEY_PLACEHOLDER'}
AllowedIPs = 0.0.0.0/0
Endpoint = ${process.env.SERVER_ENDPOINT || 'vpn.example.com:51820'}
PersistentKeepalive = 25`;

    res.json({ config });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Revoke client
app.delete("/api/clients/:id", authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    // For MVP, we completely remove the client, or we could mark active=0. Let's delete.
    await db.run("DELETE FROM clients WHERE id = ?", [req.params.id]);
    
    const allClients = await db.all("SELECT public_key, ip_address, active FROM clients");
    await wgService.syncConfig(allClients);
    
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
      timestamp: Date.now()
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

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Nexus VPN Admin Backend running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error("Failed to initialize DB:", err);
  process.exit(1);
});