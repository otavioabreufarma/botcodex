const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL;
const BACKEND_API_KEY = process.env.BACKEND_API_KEY;

function requireEnv(value, name) {
  if (!value) {
    throw new Error(`${name} não configurado`);
  }
}

function buildUrl(pathname) {
  requireEnv(BACKEND_BASE_URL, 'BACKEND_BASE_URL');
  return new URL(pathname, BACKEND_BASE_URL).toString();
}

async function backendRequest(pathname, { method = 'GET', body, withAuth = true } = {}) {
  if (withAuth) {
    requireEnv(BACKEND_API_KEY, 'BACKEND_API_KEY');
  }

  const headers = {
    'Content-Type': 'application/json'
  };

  if (withAuth) {
    headers.Authorization = `Bearer ${BACKEND_API_KEY}`;
  }

  const response = await fetch(buildUrl(pathname), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.success === false) {
    const message = payload?.error || `Erro HTTP ${response.status}`;
    throw new Error(message);
  }

  return payload.data;
}

export async function getVipStatus(steamId) {
  return backendRequest(`/api/vip/status/${encodeURIComponent(steamId)}`);
}

export async function activateVip({ steamId, discordId }) {
  return backendRequest('/api/vip/activate', {
    method: 'POST',
    body: { steamId, discordId }
  });
}

export async function deactivateVip({ steamId }) {
  return backendRequest('/api/vip/deactivate', {
    method: 'POST',
    body: { steamId }
  });
}

export async function getSteamLink(discordId) {
  return backendRequest(`/api/vip/steam-link/${encodeURIComponent(discordId)}`);
}

export async function getSteamAuthUrl(discordId) {
  return backendRequest(`/api/auth/steam/start?discordId=${encodeURIComponent(discordId)}`, {
    withAuth: false
  });
}

export async function createCheckout({ discordId, steamId, plan = 'vip-default' }) {
  return backendRequest('/api/orders/checkout', {
    method: 'POST',
    withAuth: false,
    body: { discordId, steamId, plan }
  });
}
