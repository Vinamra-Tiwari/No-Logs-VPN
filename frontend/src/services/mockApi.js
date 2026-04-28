/**
 * MOCK SERVICE LAYER v2
 * Simulates API calls with latency and random data.
 * Follows "no logs" philosophy: data is in-memory only.
 */

const LATENCY_RANGE = [20, 150];
const SPEED_RANGE = [50, 500];

export const servers = [
    { id: 'in-1', country: "India", city: "Mumbai", code: "IN", flag: "🇮🇳", region: "Asia Pacific", load: 24, tags: ["Low Latency", "Multi-Hop"] },
    { id: 'ch-1', country: "Switzerland", city: "Zürich", code: "CH", flag: "🇨🇭", region: "Europe", load: 12, tags: ["Privacy First", "Multi-Hop"] },
];

const nodePool = {
    entry: [
        { id: "relay-mum", provider: "Nexus Relay", location: "Mumbai", ip: "103.21.52.12" },
        { id: "relay-zrh", provider: "Nexus Relay", location: "Zürich", ip: "185.19.28.44" },
    ],
    exit: [
        { id: "exit-mum", provider: "Nexus Exit", location: "Mumbai", ip: "103.21.52.88" },
        { id: "exit-zrh", provider: "Nexus Exit", location: "Zürich", ip: "185.19.28.102" },
    ],
};

// In-memory state (destroyed on refresh)
let session = null;
let connected = false;
let currentServer = servers[0];
let currentNodes = { entry: nodePool.entry[0], exit: nodePool.exit[0] };
let devices = [];
let settings = {
    killSwitch: true,
    autoRotate: true,
    rotationInterval: '15m',
    defaultServer: 'de-1',
    protocol: 'wireguard',
    notifications: {
        qrGenerated: true,
        connectionSuccess: true,
        sessionExpiry: true
    },
    sessionTimeout: '30m',
    theme: 'dark'
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
    getServers: async () => {
        await sleep(400);
        return servers.map(s => ({
            ...s,
            latency: Math.floor(Math.random() * (LATENCY_RANGE[1] - LATENCY_RANGE[0])) + LATENCY_RANGE[0]
        }));
    },

    getSettings: async () => {
        await sleep(300);
        return settings;
    },

    updateSettings: async (newSettings) => {
        await sleep(300);
        settings = { ...settings, ...newSettings };
        return settings;
    },

    createSession: async () => {
        await sleep(600);
        session = {
            id: Math.random().toString(36).substring(2, 15),
            expiresAt: Date.now() + 30 * 60 * 1000,
            createdAt: Date.now(),
        };
        return session;
    },

    connect: async (serverId) => {
        await sleep(1500);
        if (Math.random() < 0.05) throw new Error("Connection timeout. Peer unreachable.");

        connected = true;
        currentServer = servers.find(s => s.id === serverId) || servers[0];
        currentNodes = {
            entry: nodePool.entry[Math.floor(Math.random() * nodePool.entry.length)],
            exit: nodePool.exit[Math.floor(Math.random() * nodePool.exit.length)],
        };
        return { connected: true, server: currentServer, nodes: currentNodes };
    },

    disconnect: async () => {
        await sleep(500);
        connected = false;
        return { connected: false };
    },

    getMetrics: async () => {
        if (!connected) return null;
        return {
            latency: Math.floor(Math.random() * (LATENCY_RANGE[1] - LATENCY_RANGE[0])) + LATENCY_RANGE[0],
            downloadSpeed: (Math.random() * SPEED_RANGE[1]).toFixed(1),
            uploadSpeed: (Math.random() * (SPEED_RANGE[1] / 3)).toFixed(1),
            ip: `185.212.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
            strength: Math.random() > 0.8 ? 'good' : 'excellent',
            dataTransferred: {
                down: (Math.random() * 500).toFixed(1),
                up: (Math.random() * 100).toFixed(1)
            }
        };
    },

    rotateNodes: async () => {
        await sleep(800);
        currentNodes = {
            entry: nodePool.entry[Math.floor(Math.random() * nodePool.entry.length)],
            exit: nodePool.exit[Math.floor(Math.random() * nodePool.exit.length)],
        };
        return currentNodes;
    },

    generateConfig: async (deviceName) => {
        await sleep(1000);
        const id = Math.random().toString(36).substring(7);
        const device = {
            id,
            name: deviceName || `Device-${id}`,
            type: 'mobile',
            config: `[Interface]
PrivateKey = ${Math.random().toString(36).substring(2, 32)}
Address = 10.0.0.2/32
DNS = 1.1.1.1

[Peer]
PublicKey = ${Math.random().toString(36).substring(2, 32)}
Endpoint = 103.21.52.88:51820
AllowedIPs = 0.0.0.0/0`,
            expiresAt: Date.now() + 2 * 60 * 1000 // 2 minutes expiry
        };
        devices.push(device);
        return device;
    },

    getDevices: async () => {
        return devices;
    },

    revokeDevice: async (id) => {
        await sleep(400);
        devices = devices.filter(d => d.id !== id);
        return true;
    }
};
