// Backend origin only; endpoint paths retain their existing /api contracts.
export const API_BASE = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');

export const apiUrl = (path: string): string => `${API_BASE}${path}`;

// Staff APIs use JWT Bearer tokens, not cross-site session cookies.
export const authenticatedFetch = (input: string, init: RequestInit = {}): Promise<Response> => {
  const headers = new Headers(init.headers);
  const token = localStorage.getItem('aidfast_token');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(input, { ...init, credentials: 'omit', headers });
};
