const blockchain = require('../backend/blockchain');

async function run() {
  console.log('=== Testing Blockchain Key Ledger Integration ===');

  const testPubKey = 'tEsT+WireGuard+PublicKey+44CharactersLength=';
  const keyHash = blockchain.hashPublicKey(testPubKey);
  console.log(`Test Public Key: ${testPubKey}`);
  console.log(`Computed SHA-256 Hash: ${keyHash}`);

  console.log('\n1. Anchoring Provisioned Event (0)...');
  const provRes = await blockchain.anchorKeyEvent(testPubKey, blockchain.EVENT_TYPES.PROVISIONED);
  console.log('✓ Provisioned tx:', provRes.txHash, 'Block:', provRes.blockNumber);

  console.log('\n2. Anchoring Rotated Event (1)...');
  const rotRes = await blockchain.anchorKeyEvent(testPubKey, blockchain.EVENT_TYPES.ROTATED);
  console.log('✓ Rotated tx:', rotRes.txHash, 'Block:', rotRes.blockNumber);

  console.log('\n3. Anchoring Revoked Event (2)...');
  const revRes = await blockchain.anchorKeyEvent(testPubKey, blockchain.EVENT_TYPES.REVOKED);
  console.log('✓ Revoked tx:', revRes.txHash, 'Block:', revRes.blockNumber);

  console.log('\n4. Checking on-chain event count via getEventCount()...');
  const count = await blockchain.getEventCount(testPubKey);
  console.log(`✓ Total events anchored for key hash: ${count}`);

  console.log('\n5. Querying and decoding on-chain history via getKeyHistory()...');
  const history = await blockchain.getKeyHistory(testPubKey);
  console.log(`✓ Retrieved ${history.length} decoded events from blockchain logs:`);
  history.forEach((ev, i) => {
    console.log(`  [${i + 1}] ${ev.eventName} (type: ${ev.eventType}) | Block: ${ev.blockNumber} | Date: ${ev.date}`);
    console.log(`      Tx: ${ev.txHash}`);
  });

  if (history.length === 3 && count === 3) {
    console.log('\n🎉 ALL BLOCKCHAIN AUDIT LEDGER TESTS PASSED!');
  } else {
    throw new Error(`Unexpected event count: ${count}, history length: ${history.length}`);
  }
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
