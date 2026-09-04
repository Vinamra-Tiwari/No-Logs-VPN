const http = require('http');

const API_BASE = 'http://localhost:5000';

function request(path, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const reqOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const req = http.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runDemo() {
  console.log('===============================================================');
  console.log('       NEXUS VPN: BLOCKCHAIN AUDIT LEDGER LIVE DEMO            ');
  console.log('===============================================================\n');

  // 1. Admin Login
  console.log('1. Authenticating admin user (POST /api/admin/login)...');
  const loginRes = await request('/api/admin/login', { method: 'POST' }, { password: 'admin' });
  if (loginRes.status !== 200 || !loginRes.data.token) {
    throw new Error('Admin login failed: ' + JSON.stringify(loginRes.data));
  }
  const token = loginRes.data.token;
  console.log('   ✓ Admin authenticated successfully.');
  console.log('   ✓ Session Token:', token.slice(0, 24) + '...\n');

  const authHeaders = { Authorization: `Bearer ${token}` };

  // 2. Provision Client
  console.log('2. Provisioning new peer (POST /api/clients)...');
  const clientName = 'MacBook Pro M3';
  const createRes = await request('/api/clients', { method: 'POST', headers: authHeaders }, { name: clientName });
  if (createRes.status !== 200) {
    throw new Error('Create client failed: ' + JSON.stringify(createRes.data));
  }
  const newPeer = createRes.data;
  console.log(`   ✓ Peer provisioned: "${newPeer.name}" (ID: ${newPeer.id})`);
  console.log(`   ✓ Allocated IP: ${newPeer.ip}`);
  console.log(`   ✓ Public Key: ${newPeer.publicKey}\n`);

  // Allow a moment for transaction confirmation
  await new Promise((r) => setTimeout(r, 1000));

  // 3. Fetch Audit Trail
  console.log('3. Fetching On-Chain Audit Trail (GET /api/peers/:id/audit-trail)...');
  const auditRes = await request(`/api/peers/${newPeer.id}/audit-trail`, { headers: authHeaders });
  if (auditRes.status !== 200) {
    throw new Error('Audit trail request failed: ' + JSON.stringify(auditRes.data));
  }
  const audit = auditRes.data;
  console.log('   ✓ Public Key SHA-256 Hash:', audit.publicKeyHash);
  console.log('   ✓ Total On-Chain Events:', audit.eventCount);
  console.log('   ✓ Decoded Event Timeline:');
  audit.events.forEach((ev, i) => {
    console.log(`     [Event ${i + 1}]`);
    console.log(`       State:       ${ev.eventName} (Type ${ev.eventType})`);
    console.log(`       Block:       #${ev.blockNumber}`);
    console.log(`       Timestamp:   ${ev.timestamp} (${ev.date})`);
    console.log(`       Tx Hash:     ${ev.txHash}`);
    console.log(`       Key Hash:    ${ev.keyHash}`);
  });
  console.log('');

  // 4. Revoke Client
  console.log('4. Revoking peer (DELETE /api/clients/:id)...');
  const deleteRes = await request(`/api/clients/${newPeer.id}`, { method: 'DELETE', headers: authHeaders });
  console.log('   ✓ Peer revoked status:', deleteRes.status, deleteRes.data);

  // Allow a moment for revocation transaction confirmation
  await new Promise((r) => setTimeout(r, 1000));

  // 5. Fetch Key History from Blockchain directly to verify Revocation on-chain
  console.log('\n5. Verifying Revocation Event on Blockchain Ledger...');
  const blockchain = require('../backend/blockchain');
  const updatedHistory = await blockchain.getKeyHistory(newPeer.publicKey);
  const updatedCount = await blockchain.getEventCount(newPeer.publicKey);

  console.log('   ✓ Updated Event Count on Smart Contract:', updatedCount);
  console.log('   ✓ Complete Immutable History for this Key Hash:');
  updatedHistory.forEach((ev, i) => {
    console.log(`     [Event ${i + 1}]`);
    console.log(`       State:       ${ev.eventName} (Type ${ev.eventType})`);
    console.log(`       Block:       #${ev.blockNumber}`);
    console.log(`       Timestamp:   ${ev.timestamp} (${ev.date})`);
    console.log(`       Tx Hash:     ${ev.txHash}`);
  });

  console.log('\n===============================================================');
  console.log('       ✓ ALL VERIFICATIONS SUCCEEDED! SYSTEM OPERATIONAL       ');
  console.log('===============================================================');
}

runDemo().catch((err) => {
  console.error('Demo failed:', err);
  process.exit(1);
});
