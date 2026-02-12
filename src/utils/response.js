export function ok(data = {}) {
  return { success: true, data, error: null };
}

export function fail(message, data = {}) {
  return { success: false, data, error: message };
}
