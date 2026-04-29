require('dotenv').config();
const { initDB, encrypt } = require('../database');
const wgService = require('../wgService');

async function rotateKeys() {
  console.log('[RotateKeys] Starting automated key rotation cycle...');
  try {
    const db = await initDB();
    
    // Check if key rotation is enabled globally
    const rotateSetting = await db.get("SELECT value FROM settings WHERE key = 'rotateKeys'");
    if (!rotateSetting || rotateSetting.value !== 'true') {
      console.log('[RotateKeys] Global Key Rotation is DISABLED. Exiting.');
      process.exit(0);
    }

    const clients = await db.all("SELECT id, name, public_key, ip_address FROM clients");
    if (clients.length === 0) {
      console.log('[RotateKeys] No active clients to rotate.');
      process.exit(0);
    }

    for (const client of clients) {
      console.log(`[RotateKeys] Rotating keys for client: ${client.name} (${client.ip_address})`);
      
      // 1. Generate new keys
      const newKeyPair = await wgService.generateKeyPair();
      const encryptedPrivKey = encrypt(newKeyPair.privateKey);

      // 2. Remove old peer from VPS
      await wgService.removePeer(client.public_key);
      console.log(`  -> Removed old public key: ${client.public_key}`);

      // 3. Add new peer to VPS
      await wgService.addPeer(newKeyPair.publicKey, client.ip_address);
      console.log(`  -> Added new public key: ${newKeyPair.publicKey}`);

      // 4. Update database
      await db.run(
        "UPDATE clients SET public_key = ?, private_key_enc = ? WHERE id = ?",
        [newKeyPair.publicKey, encryptedPrivKey, client.id]
      );
      console.log(`  -> Successfully rotated keys for ${client.name}`);
    }

    console.log('[RotateKeys] Cycle complete.');
    process.exit(0);
  } catch (err) {
    console.error('[RotateKeys] Error during execution:', err);
    process.exit(1);
  }
}

rotateKeys();
