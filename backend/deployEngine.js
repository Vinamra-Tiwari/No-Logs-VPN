const { getDb, encrypt, decrypt } = require('./database');
const SSHEngine = require('./sshEngine');
const crypto = require('crypto');

// Helpers for multi-hop IP allocation (e.g., 10.10.0.1, 10.10.0.2)
function getInternalIp(index) {
  return `10.10.0.${index + 1}`;
}

async function executeOnNode(node, cmd, context) {
  console.log(`[Deploy] Executing on ${node.name}: ${cmd}`);
  const privKey = decrypt(node.ssh_private_key_encrypted);
  const engine = new SSHEngine(node);
  
  await engine.connect(privKey);
  const result = await engine.execCommand(cmd);
  engine.disconnect();

  if (result.code !== 0 && !cmd.includes('wg show')) {
    throw new Error(`Command failed on ${node.name}: ${cmd}\nstderr: ${result.stderr}`);
  }
  return result.stdout.trim();
}

async function installDependencies(node) {
  const cmds = [
    'apt-get update -y',
    'DEBIAN_FRONTEND=noninteractive apt-get install -y wireguard iptables iproute2',
    'echo "net.ipv4.ip_forward=1" > /etc/sysctl.d/99-vpn.conf',
    'echo "net.ipv4.conf.all.rp_filter=0" >> /etc/sysctl.d/99-vpn.conf',
    'echo "net.ipv4.conf.default.rp_filter=0" >> /etc/sysctl.d/99-vpn.conf',
    'sysctl -p /etc/sysctl.d/99-vpn.conf'
  ];
  await executeOnNode(node, cmds.join(' && '));
}

async function generateNodeKeys(node) {
  const privKey = await executeOnNode(node, 'wg genkey');
  const pubKey = await executeOnNode(node, `echo "${privKey}" | wg pubkey`);
  return { privKey, pubKey };
}

async function deployProject(project_id) {
  const db = getDb();
  
  const route = await db.get("SELECT node_sequence FROM routes WHERE project_id = ?", [project_id]);
  if (!route) throw new Error("No route found for project");

  const sequence = JSON.parse(route.node_sequence); // Array of node IDs
  if (sequence.length === 0) throw new Error("Route is empty");

  const nodes = [];
  for (const nodeId of sequence) {
    const node = await db.get("SELECT * FROM nodes WHERE id = ?", [nodeId]);
    if (!node) throw new Error(`Node ${nodeId} not found`);
    nodes.push(node);
  }

  // 1. Install & Generate keys for all nodes
  const nodeData = [];
  let i = 1;
  for (const node of nodes) {
    await db.run("UPDATE nodes SET status = 'deploying' WHERE id = ?", [node.id]);
    try {
      await installDependencies(node);
      const keys = await generateNodeKeys(node);
      const internalIp = getInternalIp(i);
      
      nodeData.push({
        ...node,
        privKey: keys.privKey,
        pubKey: keys.pubKey,
        internalIp: internalIp
      });

      // We could store keys in DB if needed, but they are ephemeral for wg0.
      i++;
    } catch (err) {
      await db.run("UPDATE nodes SET status = 'failed' WHERE id = ?", [node.id]);
      throw err;
    }
  }

  // 2. Configure wg0 tunnels (node-to-node)
  for (let idx = 0; idx < nodeData.length; idx++) {
    const isEntry = (idx === 0);
    const isExit = (idx === nodeData.length - 1);
    const current = nodeData[idx];

    let wg0Config = `[Interface]
PrivateKey = ${current.privKey}
Address = ${current.internalIp}/24
ListenPort = 51820
`;

    // Connect to next node
    if (!isExit) {
      const next = nodeData[idx + 1];
      wg0Config += `
[Peer]
PublicKey = ${next.pubKey}
Endpoint = ${next.public_ip}:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
`;
    }

    // Connect to prev node (for return traffic, optional but good for routing)
    if (!isEntry) {
      const prev = nodeData[idx - 1];
      wg0Config += `
[Peer]
PublicKey = ${prev.pubKey}
AllowedIPs = ${prev.internalIp}/32
`;
    }

    // Write wg0.conf
    const b64Config = Buffer.from(wg0Config).toString('base64');
    await executeOnNode(current, `echo "${b64Config}" | base64 -d > /etc/wireguard/wg0.conf`);
    
    // Start wg0
    await executeOnNode(current, 'systemctl enable wg-quick@wg0');
    await executeOnNode(current, 'systemctl restart wg-quick@wg0');

    // Setup NAT on Exit
    if (isExit) {
      const natCmds = [
        `iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE || true`,
        `iptables-save > /etc/iptables.rules`
      ];
      await executeOnNode(current, natCmds.join(' && '));
    }

    // Setup Entry Client Interface (wg1) and Policy Routing
    if (isEntry) {
      // Create a specific wg1 keypair for clients to connect to
      const entryKeys = await generateNodeKeys(current);
      
      let wg1Config = `[Interface]
PrivateKey = ${entryKeys.privKey}
Address = 10.20.20.1/24
ListenPort = 51821
`;
      // NAT for wg1 if it's the only node, else policy routing
      if (isExit) {
        wg1Config += `PostUp = iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE\n`;
        wg1Config += `PostDown = iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE\n`;
      } else {
        // Policy routing
        const policyCmds = [
          'ip rule add iif wg1 lookup 100 || true',
          `ip route add default dev wg0 table 100 || true`
        ];
        await executeOnNode(current, policyCmds.join(' && '));
      }

      const b64Wg1 = Buffer.from(wg1Config).toString('base64');
      await executeOnNode(current, `echo "${b64Wg1}" | base64 -d > /etc/wireguard/wg1.conf`);
      await executeOnNode(current, 'systemctl enable wg-quick@wg1');
      await executeOnNode(current, 'systemctl restart wg-quick@wg1');

      // Update project entry node keys so clients know where to connect
      await db.run("UPDATE projects SET entry_pubkey = ?, entry_ip = ? WHERE id = ?", [entryKeys.pubKey, current.public_ip, project_id]);
    }

    await db.run("UPDATE nodes SET status = 'connected' WHERE id = ?", [current.id]);
  }

  return { success: true, nodes: nodeData.length };
}

module.exports = { deployProject };
