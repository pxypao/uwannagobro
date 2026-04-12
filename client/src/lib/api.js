export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function apiFetch(path, options = {}) {
  return fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: { ...(options.headers || {}) },
  });
}
