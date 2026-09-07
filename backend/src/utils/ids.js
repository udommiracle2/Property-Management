/** Generate IDs matching the frontend style (e.g. PROP-..., UNT-..., etc.) */
export function makeId(prefix) {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${ts}${rand}`;
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
