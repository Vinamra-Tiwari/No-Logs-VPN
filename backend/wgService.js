const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

require('dotenv').config();

// ── Config from .env ──
const VPS_HOST = process.env.VPS_HOST || '';
const VPS_USER = process.env.VPS_USER || 'root';
const VPS_SSH_KEY = process.env.VPS_SSH_KEY || '';
const WG_INTERFACE = process.env.WG_INTERFACE || 'wg1';

// ── Helper: run local command ──
async function runCmd(cmd) {
  const { stdout } = await execPromise(cmd);
  return stdout.trim();
}

// ── Helper: run command on VPS via SSH ──
function buildSSHPrefix() {
  const keyPart = VPS_SSH_KEY ? `-i ${VPS_SSH_KEY} ` : '';
  return `ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 -o BatchMode=yes ${keyPart}${VPS_USER}@${VPS_HOST}`;
}

async function runRemote(remoteCmd) {
  if (!VPS_HOST) {
    throw new Error('VPS_HOST not configured');
  }
  const fullCmd = `${buildSSHPrefix()} "${remoteCmd}"`;
  return runCmd(fullCmd);
}

// ── Generate WireGuard keypair ──
async function generateKeys() {
  try {
    const privateKey = await runCmd('wg genkey');
    const publicKey = await runCmd(`echo "${privateKey}" | wg pubkey`);
    return { privateKey, publicKey };
  } catch (error) {
    // Fallback: generate keys using Node.js crypto (Curve25519)
    console.warn("[wgService] wg tools not available locally, using crypto fallback");
    const crypto = require('crypto');
    const keyPair = crypto.generateKeyPairSync('x25519');
    const privKeyBase64 = keyPair.privateKey.export({ type: 'pkcs8', format: 'der' }).subarray(-32).toString('base64');
    const pubKeyBase64 = keyPair.publicKey.export({ type: 'spki', format: 'der' }).subarray(-32).toString('base64');
    return { privateKey: privKeyBase64, publicKey: pubKeyBase64 };
  }
}

// ── Add a peer to the VPS WireGuard interface ──
async function addPeer(publicKey, ipAddress) {
  if (!VPS_HOST) {
    return;
  }

  try {
    // Add peer to the live WireGuard interface
    await runRemote(`sudo wg set ${WG_INTERFACE} peer ${publicKey} allowed-ips ${ipAddress}/32`);
    // Persist to config file so it survives reboots
    await runRemote(`sudo wg-quick save ${WG_INTERFACE}`);
  } catch (error) {
    console.error(`[Error] WG Add: ${error.message}`);
    // Don't throw — the client is already saved in DB, user can still get the QR code
  }
}

// ── Remove a peer from the VPS WireGuard interface ──
async function removePeer(publicKey) {
  if (!VPS_HOST) {
    return;
  }

  try {
    await runRemote(`sudo wg set ${WG_INTERFACE} peer ${publicKey} remove`);
    await runRemote(`sudo wg-quick save ${WG_INTERFACE}`);
  } catch (error) {
    console.error(`[Error] WG Remove: ${error.message}`);
  }
}

// ── Track wg show warning (log once, not every 10s) ──
let _wgShowWarned = false;

// ── Parse live peer status from VPS ──
async function parseWgShow(interfaceName) {
  interfaceName = interfaceName || WG_INTERFACE;

  try {
    let stdout;
    if (VPS_HOST) {
      stdout = await runRemote(`sudo wg show ${interfaceName} dump`);
    } else {
      stdout = await runCmd(`sudo wg show ${interfaceName} dump`);
    }

    const lines = stdout.split('\n');
    const statusMap = new Map();

    // dump format: public-key, preshared-key, endpoint, allowed-ips, latest-handshake, transfer-rx, transfer-tx, persistent-keepalive
    // First line is the interface itself (skip it), peer lines follow
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split('\t');
      if (parts.length >= 7) {
        const publicKey = parts[0];
        const latestHandshake = parseInt(parts[4], 10);
        const rx = parseInt(parts[5], 10);
        const tx = parseInt(parts[6], 10);

        statusMap.set(publicKey, {
          latestHandshake,
          rx,
          tx,
          online: (Date.now() / 1000) - latestHandshake < 180 && latestHandshake > 0
        });
      }
    }
    _wgShowWarned = false;
    return statusMap;
  } catch (err) {
    if (!_wgShowWarned) {
      const where = VPS_HOST ? `VPS (${VPS_HOST})` : 'localhost';
      console.warn(`[wgService] WireGuard interface '${interfaceName}' not reachable on ${where} — client status will show as offline.`);
      _wgShowWarned = true;
    }
    return new Map();
  }
}

// ── Allocate next available IP ──
function allocateIp(clients) {
  const usedLastOctets = clients
    .map(c => c.ip_address)
    .filter(ip => ip && ip.startsWith('10.20.20.'))
    .map(ip => parseInt(ip.split('.')[3], 10))
    .filter(num => !isNaN(num));

  let nextOctet = 2; // .1 is the gateway
  while (usedLastOctets.includes(nextOctet) && nextOctet <= 254) {
    nextOctet++;
  }

  if (nextOctet > 254) {
    throw new Error("IP pool exhausted in 10.20.20.x/24");
  }

  return `10.20.20.${nextOctet}`;
}

// ── Auto-fetch server public key from VPS on startup ──
async function autoFetchServerKey() {
  const current = process.env.SERVER_PUBLIC_KEY || '';
  // If key is already set to a real value, skip
  if (current && !current.includes('PASTE') && !current.includes('PLACEHOLDER') && current.length === 44) {
    console.log(`[wgService] Server public key already configured: ${current.substring(0, 16)}...`);
    return;
  }

  if (!VPS_HOST) {
    console.warn('[wgService] VPS_HOST not set — cannot auto-fetch server public key. QR codes will have a placeholder key.');
    return;
  }

  try {
    const pubKey = await runRemote(`sudo wg show ${WG_INTERFACE} public-key`);
    if (pubKey && pubKey.length === 44) {
      process.env.SERVER_PUBLIC_KEY = pubKey;
      console.log(`[wgService] ✓ Auto-fetched server public key from VPS: ${pubKey.substring(0, 16)}...`);
    } else {
      console.warn(`[wgService] Got unexpected key from VPS: "${pubKey}"`);
    }
  } catch (error) {
    console.error(`[wgService] ✗ Could not fetch server public key from VPS: ${error.message}`);
    console.error('[wgService]   → Make sure SSH access works: ssh ' + VPS_USER + '@' + VPS_HOST + ' "sudo wg show ' + WG_INTERFACE + ' public-key"');
  }
}

module.exports = {
  generateKeys,
  addPeer,
  removePeer,
  parseWgShow,
  allocateIp,
  autoFetchServerKey
};
