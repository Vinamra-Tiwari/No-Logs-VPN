const { initDB, getDb } = require('../database');
const wgService = require('../wgService');
require('dotenv').config();

const EPHEMERAL_HOURS = process.env.EPHEMERAL_HOURS || 24;

async function runEphemeralCleanup() {
  try {
    const db = await initDB();
    // SQLite created_at is in 'YYYY-MM-DD HH:MM:SS' format by default, let's use Date objects
    // The default in our schema is CURRENT_TIMESTAMP which is UTC 'YYYY-MM-DD HH:MM:SS'
    
    // Calculate threshold date (X hours ago)
    const thresholdDate = new Date(Date.now() - EPHEMERAL_HOURS * 60 * 60 * 1000);
    const thresholdISO = thresholdDate.toISOString().replace('T', ' ').split('.')[0]; // basic format compatible with sqlite
    
    const oldClients = await db.all("SELECT id, public_key, name FROM clients WHERE created_at < ?", [thresholdISO]);
    
    if (oldClients.length > 0) {
      for (const client of oldClients) {
        await wgService.removePeer(client.public_key);
        await db.run("DELETE FROM clients WHERE id = ?", [client.id]);
      }
    }
  } catch (err) {
    console.error('[Ephemeral Error]', err.message);
  } finally {
    process.exit(0);
  }
}

runEphemeralCleanup();
