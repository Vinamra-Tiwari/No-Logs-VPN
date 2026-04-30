const { getDb, decrypt } = require('./database');
const SSHEngine = require('./sshEngine');

// Check every 15 minutes
const CLEANUP_INTERVAL = 15 * 60 * 1000;

async function pruneExpiredClients() {
  try {
    const db = getDb();
    const now = new Date().toISOString();
    
    // Find expired clients
    const expiredClients = await db.all("SELECT * FROM clients WHERE expires_at IS NOT NULL AND expires_at < ?", [now]);
    
    for (const client of expiredClients) {
      console.log(`[Cron] Pruning expired client: ${client.name} (${client.id})`);
      
      // Get the project and route to find the entry node
      const route = await db.get("SELECT node_sequence FROM routes WHERE project_id = ?", [client.project_id]);
      if (route) {
        const sequence = JSON.parse(route.node_sequence);
        const entryNodeId = sequence[0];
        const entryNode = await db.get("SELECT * FROM nodes WHERE id = ?", [entryNodeId]);
        
        if (entryNode) {
          const engine = new SSHEngine(entryNode);
          await engine.connect(decrypt(entryNode.ssh_private_key_encrypted));
          await engine.execCommand(`sudo wg set wg1 peer ${client.public_key} remove`);
          await engine.execCommand(`sudo wg-quick save wg1`);
          engine.disconnect();
          console.log(`[Cron] Removed peer from entry node.`);
        }
      }
      
      await db.run("DELETE FROM clients WHERE id = ?", [client.id]);
    }
  } catch (err) {
    console.error("[Cron] Error pruning clients:", err);
  }
}

function startCronJobs() {
  console.log("[Cron] Starting background jobs...");
  setInterval(pruneExpiredClients, CLEANUP_INTERVAL);
  // We can add key rotation here as well if needed.
}

module.exports = { startCronJobs };
