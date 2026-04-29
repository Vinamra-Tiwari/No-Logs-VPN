const { exec } = require('child_process');
const util = require('util');
const fs = require('fs').promises;
const path = require('path');
const execPromise = util.promisify(exec);

const WG_CONF_PATH = process.env.WG_CONF_PATH || '/etc/wireguard/wg1.conf';

// Executes a shell command
async function runCmd(cmd) {
  try {
    const { stdout } = await execPromise(cmd);
    return stdout.trim();
  } catch (error) {
    console.error(`Error executing command: ${cmd}`, error);
    throw error;
  }
}

// Generate new keypair
async function generateKeys() {
  try {
    const privateKey = await runCmd('wg genkey');
    const publicKey = await runCmd(`echo "${privateKey}" | wg pubkey`);
    return { privateKey, publicKey };
  } catch (error) {
    // Fallback: generate keys using Node.js crypto (Curve25519)
    console.warn("wg tools not available, using crypto fallback for key generation");
    const crypto = require('crypto');
    const { publicKey, privateKey } = crypto.generateKeyPairSync('x25519');
    const privKeyBase64 = privateKey.export({ type: 'pkcs8', format: 'der' }).subarray(-32).toString('base64');
    const pubKeyBase64 = publicKey.export({ type: 'spki', format: 'der' }).subarray(-32).toString('base64');
    return { privateKey: privKeyBase64, publicKey: pubKeyBase64 };
  }
}

// Parse `wg show wg1` to get client connection status
async function parseWgShow(interfaceName = 'wg1') {
  try {
    // Attempt to run wg show, gracefully fallback if it fails (e.g., local dev without root)
    const stdout = await runCmd(`sudo wg show ${interfaceName} dump`);
    const lines = stdout.split('\n');
    const statusMap = new Map();

    // The dump format for peers:
    // interface, public-key, preshared-key, endpoint, allowed-ips, latest-handshake, transfer-rx, transfer-tx, persistent-keepalive
    // Note: the first line is usually the interface itself
    for (const line of lines) {
      const parts = line.split('\t');
      if (parts.length >= 8 && parts[0] === interfaceName) {
        const publicKey = parts[1];
        const latestHandshake = parseInt(parts[5], 10);
        const rx = parseInt(parts[6], 10);
        const tx = parseInt(parts[7], 10);
        
        statusMap.set(publicKey, {
          latestHandshake,
          rx,
          tx,
          // Consider online if handshake is within last 3 minutes (180 seconds)
          online: (Date.now() / 1000) - latestHandshake < 180 && latestHandshake > 0
        });
      }
    }
    return statusMap;
  } catch (err) {
    console.warn("Could not read wg show status, returning empty map.", err.message);
    return new Map();
  }
}

// Re-generate configuration and sync it atomically
async function syncConfig(clients) {
  // We need the base configuration (Interface section)
  // To avoid modifying the interface block, we'll read it from the existing config or a template.
  let baseConfig = '';
  try {
    const currentConf = await fs.readFile(WG_CONF_PATH, 'utf8');
    // Extract everything up to the first [Peer]
    const peerIndex = currentConf.indexOf('[Peer]');
    if (peerIndex !== -1) {
      baseConfig = currentConf.substring(0, peerIndex).trim();
    } else {
      baseConfig = currentConf.trim();
    }
  } catch (error) {
    console.warn(`Could not read base config from ${WG_CONF_PATH}. Using fallback template.`);
    baseConfig = `[Interface]
Address = 10.20.20.1/24
ListenPort = 51821
PrivateKey = ${process.env.SERVER_PRIVATE_KEY || 'SERVER_PRIVATE_KEY_PLACEHOLDER'}

PostUp = ip rule add iif wg1 lookup multihop priority 1000
PostUp = ip route add default dev wg0 table multihop
PostUp = iptables -A FORWARD -i wg1 -o wg0 -j ACCEPT
PostUp = iptables -A FORWARD -i wg0 -o wg1 -m state --state RELATED,ESTABLISHED -j ACCEPT
PostUp = iptables -t nat -A POSTROUTING -s 10.20.20.0/24 -o wg0 -j MASQUERADE

PostDown = ip rule del iif wg1 lookup multihop priority 1000
PostDown = ip route flush table multihop
PostDown = iptables -D FORWARD -i wg1 -o wg0 -j ACCEPT
PostDown = iptables -D FORWARD -i wg0 -o wg1 -m state --state RELATED,ESTABLISHED -j ACCEPT
PostDown = iptables -t nat -D POSTROUTING -s 10.20.20.0/24 -o wg0 -j MASQUERADE
`;
  }

  // Generate Peer blocks
  let peersConfig = '';
  for (const client of clients) {
    if (client.active) {
      peersConfig += `\n\n[Peer]\nPublicKey = ${client.public_key}\nAllowedIPs = ${client.ip_address}/32`;
    }
  }

  const newConfigData = baseConfig + '\n' + peersConfig + '\n';
  const tmpPath = `${WG_CONF_PATH}.tmp`;
  
  await fs.writeFile(tmpPath, newConfigData, { mode: 0o600 });

  // Execute sync script using sudo (assuming sudo rule is setup for sync_wg.sh)
  const scriptPath = path.join(__dirname, 'scripts', 'sync_wg.sh');
  // Make sure it's executable
  await runCmd(`chmod +x ${scriptPath}`);
  
  try {
    // If not in production/root, we might just run the script directly if it has permissions,
    // or run via sudo if rules are configured.
    const useSudo = process.env.NODE_ENV === 'production' ? 'sudo ' : '';
    await runCmd(`${useSudo}${scriptPath} ${tmpPath} ${WG_CONF_PATH}`);
  } catch (error) {
    console.warn("WG config sync skipped (dev mode or no WG interface):", error.message);
    // In dev mode, don't throw - the DB is already updated
    if (process.env.NODE_ENV === 'production') {
      throw new Error("WireGuard Sync Failed");
    }
  }
}

// Utility to find next available IP
function allocateIp(clients) {
  // Reserved 10.20.20.1 for Gateway
  // Format: 10.20.20.x
  const usedLastOctets = clients
    .map(c => c.ip_address)
    .filter(ip => ip && ip.startsWith('10.20.20.'))
    .map(ip => parseInt(ip.split('.')[3], 10))
    .filter(num => !isNaN(num));

  let nextOctet = 2; // Start from 2
  while (usedLastOctets.includes(nextOctet) && nextOctet <= 254) {
    nextOctet++;
  }

  if (nextOctet > 254) {
    throw new Error("IP pool exhausted in 10.20.20.x/24");
  }

  return `10.20.20.${nextOctet}`;
}

module.exports = {
  generateKeys,
  parseWgShow,
  syncConfig,
  allocateIp
};
