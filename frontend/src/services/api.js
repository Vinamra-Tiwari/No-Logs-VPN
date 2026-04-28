const BASE_URL = window.location.origin;

async function safeFetch(url, options = {}) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw { status: res.status, ...data };
    }
    return await res.json();
  } catch (err) {
    if (err.status) throw err;
    throw { status: 0, error: "Network error", offline: true };
  }
}

// Session
export const createSession = () =>
  safeFetch(`${BASE_URL}/api/session/create`, { method: "POST" });

export const getSession = (id) =>
  safeFetch(`${BASE_URL}/api/session/${id}`);

export const extendSession = (sessionId) =>
  safeFetch(`${BASE_URL}/api/session/extend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });

// Connection
export const connect = (sessionId, serverCode) =>
  safeFetch(`${BASE_URL}/api/connect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, serverCode }),
  });

export const disconnect = (sessionId) =>
  safeFetch(`${BASE_URL}/api/disconnect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });

// Metrics
export const getMetrics = (sessionId) =>
  safeFetch(`${BASE_URL}/api/metrics/${sessionId}`);

// Nodes
export const getNodes = () =>
  safeFetch(`${BASE_URL}/api/nodes`);

export const rotateNodes = () =>
  safeFetch(`${BASE_URL}/api/nodes/rotate`, { method: "POST" });

export const toggleAutoRotate = (enabled) =>
  safeFetch(`${BASE_URL}/api/nodes/auto-rotate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled }),
  });

// QR / Devices
export const generatePeer = (sessionId, deviceName, deviceType) =>
  safeFetch(`${BASE_URL}/api/generate-peer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, deviceName, deviceType }),
  });

export const getDevices = (sessionId) =>
  safeFetch(`${BASE_URL}/api/devices/${sessionId}`);

export const revokeDevice = (sessionId, deviceId) =>
  safeFetch(`${BASE_URL}/api/devices/revoke`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, deviceId }),
  });

// Privacy & Health
export const getPrivacyStatus = () =>
  safeFetch(`${BASE_URL}/api/privacy-status`);

export const healthCheck = () =>
  safeFetch(`${BASE_URL}/api/health`);