const BASE_URL = window.location.origin.includes('localhost') ? 'http://localhost:5000/api' : '/api';

function getHeaders() {
  const token = localStorage.getItem('nexus_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

async function safeFetch(url, options = {}) {
  try {
    const res = await fetch(url, { ...options, headers: { ...getHeaders(), ...options.headers } });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw { status: res.status, ...data };
    }
    return await res.json();
  } catch (err) {
    if (err.status === 401 || err.status === 403) {
      localStorage.removeItem('nexus_token');
      window.location.href = '/login';
    }
    if (err.status) throw err;
    throw { status: 0, error: "Network error", offline: true };
  }
}

// Auth
export const loginAdmin = (password) =>
  safeFetch(`${BASE_URL}/admin/login`, {
    method: "POST",
    body: JSON.stringify({ password }),
  });

// Projects
export const getProjects = () =>
  safeFetch(`${BASE_URL}/projects`);

export const createProject = (name) =>
  safeFetch(`${BASE_URL}/projects`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });

export const deployProject = (projectId) =>
  safeFetch(`${BASE_URL}/projects/${projectId}/deploy`, {
    method: "POST"
  });

// Nodes
export const getNodes = (projectId) =>
  safeFetch(`${BASE_URL}/projects/${projectId}/nodes`);

export const createNode = (projectId, nodeData) =>
  safeFetch(`${BASE_URL}/projects/${projectId}/nodes`, {
    method: "POST",
    body: JSON.stringify(nodeData),
  });

export const testNode = (nodeId) =>
  safeFetch(`${BASE_URL}/nodes/${nodeId}/test`, {
    method: "POST",
  });

// Routes
export const saveRoute = (projectId, nodeSequence) =>
  safeFetch(`${BASE_URL}/projects/${projectId}/routes`, {
    method: "POST",
    body: JSON.stringify({ node_sequence: nodeSequence }),
  });

// Clients (QR Provisioning)
export const getClients = (projectId) =>
  safeFetch(`${BASE_URL}/projects/${projectId}/clients`);

export const createClient = (projectId, name) =>
  safeFetch(`${BASE_URL}/projects/${projectId}/clients`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });

export const revokeClient = (clientId) =>
  safeFetch(`${BASE_URL}/clients/${clientId}`, {
    method: "DELETE",
  });

// Stats
export const getStats = () =>
  safeFetch(`${BASE_URL}/stats`);