const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

/**
 * Stores a reference to the latest refresh function so the fetch interceptor
 * can call it without importing the hook (which would break the module graph).
 */
let refreshFn: (() => Promise<string | null>) | null = null;

export function setRefreshFn(fn: () => Promise<string | null>): void {
  refreshFn = fn;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

async function refreshAndRetry(url: string, options: RequestInit): Promise<Response> {
  if (!refreshFn) throw new Error('No refresh handler registered');

  const newToken = await refreshFn();
  if (!newToken) {
    window.location.href = '/login';
    throw new Error('Session expired — redirecting to login');
  }

  options.headers = {
    ...(options.headers as Record<string, string>),
    Authorization: `Bearer ${newToken}`,
  };

  return fetch(url, options);
}

export const api = {
  async post(endpoint: string, body: Record<string, unknown>) {
    const token = getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const url = `${API_URL}${endpoint}`;
    const options: RequestInit = { method: 'POST', headers, body: JSON.stringify(body) };

    let response = await fetch(url, options);

    if (response.status === 401 && endpoint !== '/auth/refresh' && endpoint !== '/auth/login' && endpoint !== '/auth/signup') {
      response = await refreshAndRetry(url, options);
    }

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'API Request Failed');
    }

    return response.json();
  },

  async get(endpoint: string) {
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const url = `${API_URL}${endpoint}`;
    const options: RequestInit = { method: 'GET', headers };

    let response = await fetch(url, options);

    if (response.status === 401) {
      response = await refreshAndRetry(url, options);
    }

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'API Request Failed');
    }

    return response.json();
  },
};
