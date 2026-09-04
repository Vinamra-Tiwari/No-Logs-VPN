const { ethers } = require('ethers');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// ── Event Types ──
const EVENT_TYPES = {
  PROVISIONED: 0,
  ROTATED: 1,
  REVOKED: 2,
};

const EVENT_TYPE_NAMES = {
  0: 'Provisioned',
  1: 'Rotated',
  2: 'Revoked',
};

// ── Local Hardhat Configuration Defaults ──
const RPC_URL = process.env.HARDHAT_RPC_URL || 'http://127.0.0.1:8545';
// Default Hardhat Account #0 private key (standard for local dev)
const DEFAULT_PRIVATE_KEY =
  process.env.HARDHAT_PRIVATE_KEY ||
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

// Load deployed contract address and ABI
let contractConfig = null;
try {
  const configPath = path.join(__dirname, 'contractAddress.json');
  if (fs.existsSync(configPath)) {
    contractConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (err) {
  console.warn('[blockchain] Could not read contractAddress.json:', err.message);
}

const CONTRACT_ADDRESS =
  process.env.KEY_LEDGER_ADDRESS ||
  (contractConfig && contractConfig.address) ||
  '0x5FbDB2315678afecb367f032d93F642f64180aa3';

const CONTRACT_ABI = (contractConfig && contractConfig.abi) || [
  'event EventAnchored(bytes32 indexed keyHash, uint8 eventType, uint256 timestamp)',
  'function anchorEvent(bytes32 keyHash, uint8 eventType, uint256 timestamp) external',
  'function eventCount(bytes32) view returns (uint256)',
  'function getEventCount(bytes32 keyHash) view returns (uint256)',
];

/**
 * Computes SHA-256 hash of a WireGuard public key string.
 * Ensures that neither raw public keys nor private keys are ever stored on-chain.
 * @param {string} pubKey Base64 WireGuard public key string or hex string
 * @returns {string} 0x-prefixed 32-byte hex hash string
 */
function hashPublicKey(pubKey) {
  if (!pubKey || typeof pubKey !== 'string') {
    throw new Error('Public key must be a non-empty string');
  }
  // If already a 32-byte hex string (0x + 64 hex chars), return normalized
  if (/^0x[0-9a-fA-F]{64}$/.test(pubKey.trim())) {
    return pubKey.trim().toLowerCase();
  }
  return ethers.sha256(ethers.toUtf8Bytes(pubKey.trim()));
}

/**
 * Returns an ethers Provider connected to the local Hardhat chain
 */
function getProvider() {
  return new ethers.JsonRpcProvider(RPC_URL);
}

/**
 * Returns an ethers Wallet signer for sending transactions
 */
function getSigner(provider) {
  return new ethers.Wallet(DEFAULT_PRIVATE_KEY, provider);
}

/**
 * Returns a KeyLedger Contract instance
 * @param {boolean} withSigner Whether to attach a wallet signer for write transactions
 */
function getContract(withSigner = false) {
  const provider = getProvider();
  if (withSigner) {
    const signer = getSigner(provider);
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  }
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

/**
 * Anchors a key lifecycle event on the local blockchain
 * @param {string} pubKey WireGuard public key
 * @param {number} eventType 0 = Provisioned, 1 = Rotated, 2 = Revoked
 * @param {number} [timestamp] Optional Unix timestamp in seconds (defaults to now)
 * @returns {Promise<object>} Transaction outcome and event metadata
 */
async function anchorKeyEvent(pubKey, eventType, timestamp = null) {
  const keyHash = hashPublicKey(pubKey);
  const eventTime = timestamp || Math.floor(Date.now() / 1000);

  try {
    const contract = getContract(true);
    console.log(`[blockchain] Anchoring event ${eventType} (${EVENT_TYPE_NAMES[eventType]}) for keyHash: ${keyHash}`);

    const tx = await contract.anchorEvent(keyHash, eventType, eventTime);
    const receipt = await tx.wait();

    console.log(`[blockchain] ✓ Event anchored on-chain! Tx: ${receipt.hash}, Block: ${receipt.blockNumber}`);

    return {
      success: true,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      keyHash,
      eventType,
      eventName: EVENT_TYPE_NAMES[eventType] || 'Unknown',
      timestamp: eventTime,
    };
  } catch (err) {
    console.warn(`[blockchain] ⚠️ Could not anchor event on-chain (${err.message}). Is local Hardhat node running?`);
    return {
      success: false,
      error: err.message,
      keyHash,
      eventType,
      eventName: EVENT_TYPE_NAMES[eventType] || 'Unknown',
      timestamp: eventTime,
    };
  }
}

/**
 * Queries and decodes historical events for a given public key from on-chain event logs
 * @param {string} pubKey WireGuard public key or key hash
 * @returns {Promise<Array>} Array of decoded event records
 */
async function getKeyHistory(pubKey) {
  const keyHash = hashPublicKey(pubKey);

  try {
    const contract = getContract(false);
    const filter = contract.filters.EventAnchored(keyHash);
    const logs = await contract.queryFilter(filter, 0, 'latest');

    const history = logs.map((log) => {
      let eventType = null;
      let timestamp = null;

      try {
        const parsed = contract.interface.parseLog({
          topics: log.topics,
          data: log.data,
        });
        if (parsed) {
          eventType = Number(parsed.args.eventType);
          timestamp = Number(parsed.args.timestamp);
        }
      } catch (decodeErr) {
        // Fallback manual decode if needed
        eventType = Number(log.topics[2] || 0);
      }

      return {
        keyHash,
        eventType,
        eventName: EVENT_TYPE_NAMES[eventType] || 'Unknown',
        timestamp,
        date: timestamp ? new Date(timestamp * 1000).toISOString() : null,
        txHash: log.transactionHash,
        blockNumber: log.blockNumber,
      };
    });

    return history;
  } catch (err) {
    console.warn(`[blockchain] ⚠️ Could not query key history from chain: ${err.message}`);
    return [];
  }
}

/**
 * Returns the on-chain event count for a given public key
 * @param {string} pubKey WireGuard public key or key hash
 * @returns {Promise<number>}
 */
async function getEventCount(pubKey) {
  const keyHash = hashPublicKey(pubKey);
  try {
    const contract = getContract(false);
    const count = await contract.getEventCount(keyHash);
    return Number(count);
  } catch (err) {
    console.warn(`[blockchain] Could not fetch event count: ${err.message}`);
    return 0;
  }
}

module.exports = {
  EVENT_TYPES,
  EVENT_TYPE_NAMES,
  hashPublicKey,
  anchorKeyEvent,
  getKeyHistory,
  getEventCount,
};
