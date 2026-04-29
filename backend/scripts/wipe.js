require('dotenv').config();
const { initDB } = require('../database');
const wgService = require('../wgService');

async function wipe() {
  const db = await initDB();
  const peers = await wgService.parseWgShow('wg1');
  console.log(`Found ${peers.size} peers on Vultr. Wiping...`);
  for (const [pubKey] of peers.entries()) {
    await wgService.removePeer(pubKey);
    console.log(`Removed ${pubKey}`);
  }
  await db.exec('DELETE FROM clients');
  console.log('Database clients wiped.');
  process.exit(0);
}
wipe();
