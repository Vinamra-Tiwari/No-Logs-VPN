const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const path = require("path");
const jwt = require("jsonwebtoken");
const { initDB, getDb, encrypt, decrypt } = require("./database");
const wgService = require("./wgService");
const { deployProject } = require("./deployEngine");

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
  if (password === ADMIN_PASSWORD) {
    const token = jwt.sign({ role: 'admin', id: 'admin_user' }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: "Invalid password" });
  }
});

// ── PROJECT ROUTES ──

app.get("/api/projects", authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const projects = await db.all("SELECT * FROM projects WHERE user_id = ?", [req.user.id]);
    res.json({ projects });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/projects", authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    const db = getDb();
    const id = crypto.randomUUID();
    await db.run("INSERT INTO projects (id, user_id, name) VALUES (?, ?, ?)", [id, req.user.id, name]);
    res.json({ id, name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── NODE ROUTES ──

app.get("/api/projects/:projectId/nodes", authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const nodes = await db.all("SELECT id, project_id, name, public_ip, ssh_port, ssh_username, provider, region, role, status, created_at FROM nodes WHERE project_id = ?", [req.params.projectId]);
    res.json({ nodes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/projects/:projectId/nodes", authenticateToken, async (req, res) => {
  try {
    const { name, public_ip, ssh_port, ssh_username, ssh_private_key, provider, region, role } = req.body;
    const db = getDb();
    const id = crypto.randomUUID();
    const encryptedKey = encrypt(ssh_private_key);
    
    await db.run(
      "INSERT INTO nodes (id, project_id, name, public_ip, ssh_port, ssh_username, ssh_private_key_encrypted, provider, region, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id, req.params.projectId, name, public_ip, ssh_port || 22, ssh_username || 'root', encryptedKey, provider, region, role]
    );
    res.json({ id, name, public_ip, status: 'pending' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/nodes/:id/test", authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const node = await db.get("SELECT * FROM nodes WHERE id = ?", [req.params.id]);
    if (!node) return res.status(404).json({ error: "Node not found" });

    const SSHEngine = require('./sshEngine');
    const engine = new SSHEngine(node);
    await engine.connect(decrypt(node.ssh_private_key_encrypted));
    const result = await engine.execCommand('echo "SSH Connection Successful"');
    engine.disconnect();

    res.json({ success: true, message: result.stdout.trim() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ROUTE BUILDER & DEPLOY ──

app.post("/api/projects/:projectId/routes", authenticateToken, async (req, res) => {
  try {
    const { node_sequence } = req.body; // Array of node IDs
    const db = getDb();
    const id = crypto.randomUUID();
    
    // For simplicity, overwrite existing route for the project
    await db.run("DELETE FROM routes WHERE project_id = ?", [req.params.projectId]);
    await db.run(
      "INSERT INTO routes (id, project_id, node_sequence) VALUES (?, ?, ?)",
      [id, req.params.projectId, JSON.stringify(node_sequence)]
    );
    res.json({ id, project_id: req.params.projectId, node_sequence });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/projects/:projectId/deploy", authenticateToken, async (req, res) => {
  try {
    const result = await deployProject(req.params.projectId);
    res.json(result);
  } catch (err) {
    console.error("Deploy failed:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── CLIENT ROUTES ──

app.get("/api/projects/:projectId/clients", authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const clients = await db.all("SELECT id, name, public_key, assigned_ip, created_at FROM clients WHERE project_id = ?", [req.params.projectId]);
    res.json({ clients });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/projects/:projectId/clients", authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });

    const db = getDb();
    
    const project = await db.get("SELECT * FROM projects WHERE id = ?", [req.params.projectId]);
    if (!project || !project.entry_pubkey) {
      return res.status(400).json({ error: "Project not deployed yet" });
    }

    await db.exec('BEGIN EXCLUSIVE TRANSACTION');
    
    const existingClients = await db.all("SELECT assigned_ip FROM clients WHERE project_id = ?", [req.params.projectId]);
    const ip = wgService.allocateIp(existingClients);
    const keys = await wgService.generateKeys();
    const id = crypto.randomUUID();
    const encryptedPrivKey = encrypt(keys.privateKey);

    await db.run(
      "INSERT INTO clients (id, project_id, name, public_key, private_key_encrypted, assigned_ip) VALUES (?, ?, ?, ?, ?, ?)",
      [id, req.params.projectId, name, keys.publicKey, encryptedPrivKey, ip]
    );

    await db.exec('COMMIT');

    // Add peer to the Entry Node
    try {
      const entryNodeId = JSON.parse((await db.get("SELECT node_sequence FROM routes WHERE project_id = ?", [req.params.projectId])).node_sequence)[0];
      const entryNode = await db.get("SELECT * FROM nodes WHERE id = ?", [entryNodeId]);
      
      const SSHEngine = require('./sshEngine');
      const engine = new SSHEngine(entryNode);
      await engine.connect(decrypt(entryNode.ssh_private_key_encrypted));
      await engine.execCommand(`sudo wg set wg1 peer ${keys.publicKey} allowed-ips ${ip}/32`);
      await engine.execCommand(`sudo wg-quick save wg1`);
      engine.disconnect();
    } catch(e) {
      console.error("Failed to add peer on entry node", e);
    }

    const config = `[Interface]
PrivateKey = ${keys.privateKey}
Address = ${ip}/32
DNS = 1.1.1.1

[Peer]
PublicKey = ${project.entry_pubkey}
AllowedIPs = 0.0.0.0/0
Endpoint = ${project.entry_ip}:51821
PersistentKeepalive = 25`;

    res.json({ id, name, ip, config, publicKey: keys.publicKey });
  } catch (err) {
    const db = getDb();
    try { await db.exec('ROLLBACK'); } catch(e){}
    res.status(500).json({ error: err.message });
  }
});

// The "catchall" handler
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

const PORT = process.env.PORT || 5000;
const { startCronJobs } = require('./cronJobs');

initDB().then(async () => {
  // Ensure we have an admin user in DB
  const db = getDb();
  await db.run("INSERT OR IGNORE INTO users (id, email, password_hash) VALUES ('admin_user', 'admin@nexus.local', 'mockhash')");

  startCronJobs();

  app.listen(PORT, () => {
    console.log(`🚀 Nexus Orchestrator running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error("Failed to initialize DB:", err);
  process.exit(1);
});