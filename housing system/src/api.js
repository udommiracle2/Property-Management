const API_URL = import.meta.env.VITE_API_URL || "http://localhost:9000/api";

/**
 * Generic authenticated fetch against the backend API.
 * Throws an Error (with .status set) on any non-2xx response so callers
 * can catch it and decide how to react (retry, show a message, etc).
 */
export async function apiRequest(method, path, body) {
  const token = localStorage.getItem("token");
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // No JSON body (e.g. a plain 204) — that's fine.
  }

  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }

  return data;
}

export { API_URL };
