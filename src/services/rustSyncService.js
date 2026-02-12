const DEFAULT_TIMEOUT_MS = 10_000;

export async function sendVipToRustServer({ name, endpoint, serverKey, steamId, action }) {
  if (!endpoint || !serverKey) {
    return {
      server: name,
      success: false,
      reason: 'Configuração de endpoint ou chave do servidor não encontrada.'
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        RUST_SERVER_KEY: serverKey,
        Authorization: `Bearer ${process.env.API_KEY}`
      },
      body: JSON.stringify({ steamId, action }),
      signal: controller.signal
    });

    const body = await response.json().catch(() => ({}));

    return {
      server: name,
      success: response.ok && body?.success !== false,
      status: response.status,
      response: body
    };
  } catch (error) {
    return {
      server: name,
      success: false,
      reason: error.message
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function rustEndpoints() {
  return [
    {
      name: 'rust1',
      endpoint:
        process.env.RUST1_SYNC_URL ??
        `${process.env.PUBLIC_BASE_URL ?? 'http://127.0.0.1:8080'}/api/rust1/sync-vip`,
      serverKey: process.env.RUST1_SERVER_KEY
    },
    {
      name: 'rust2',
      endpoint:
        process.env.RUST2_SYNC_URL ??
        `${process.env.PUBLIC_BASE_URL ?? 'http://127.0.0.1:8080'}/api/rust2/sync-vip`,
      serverKey: process.env.RUST2_SERVER_KEY
    }
  ];
}
