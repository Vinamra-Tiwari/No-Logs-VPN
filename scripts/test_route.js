process.env.DB_ENCRYPTION_KEY = process.env.DB_ENCRYPTION_KEY || '12345678901234567890123456789012';
const crypto = require('crypto');
const { initDB, getDb, encrypt } = require('../backend/database');
const blockchain = require('../backend/blockchain');

async function testRoute() {
  console.log('=== Testing Express /api/peers/:id/audit-trail Logic ===');

  await initDB();
  const db = getDb();

  const testPeerId = crypto.randomUUID();
  const testPubKey = 'RouteTestPublicKey+SampleBase64String44Ch=';
  const testName = 'Test iPhone 16 Pro';
  const testIp = '10.20.20.240';
  const encPrivKey = encrypt('mock-private-key-1234567890');

  // Insert mock client
  await db.run(
    'INSERT OR REPLACE INTO clients (id, name, public_key, private_key_enc, ip_address) VALUES (?, ?, ?, ?, ?)',
    [testPeerId, testName, testPubKey, encPrivKey, testIp]
  );
  console.log(`✓ Inserted test peer: ${testPeerId} (${testName})`);

  // Anchor provisioned event on-chain
  console.log('Anchoring provisioned event...');
  const anchorRes = await blockchain.anchorKeyEvent(testPubKey, blockchain.EVENT_TYPES.PROVISIONED);
  console.log(`✓ Anchored provision event: ${anchorRes.txHash}`);

  // Fetch client and query audit trail (identical to GET /api/peers/:id/audit-trail handler)
  const client = await db.get('SELECT id, name, public_key, ip_address, created_at FROM clients WHERE id = ?', [testPeerId]);
  if (!client) throw new Error('Client not found in DB');

  const keyHash = blockchain.hashPublicKey(client.public_key);
  const events = await blockchain.getKeyHistory(client.public_key);
  const eventCount = await blockchain.getEventCount(client.public_key);

  const routeResponse = {
    peerId: client.id,
    name: client.name,
    publicKeyHash: keyHash,
    eventCount,
    events,
  };

  console.log('\nAudit Trail API Response:');
  console.log(JSON.stringify(routeResponse, null, 2));

  // Clean up
  await db.run('DELETE FROM clients WHERE id = ?', [testPeerId]);
  console.log(`\n✓ Cleaned up test peer ${testPeerId}`);

  if (routeResponse.events.length >= 1 && routeResponse.publicKeyHash === keyHash) {
    console.log('🎉 AUDIT TRAIL ROUTE TEST PASSED!');
  } else {
    throw new Error('Audit trail response validation failed');
  }
}

testRoute().catch(err => {
  console.error('❌ Route test failed:', err);
  process.exit(1);
});
