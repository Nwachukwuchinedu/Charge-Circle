import { useState, useEffect, useCallback } from 'react';
import { User } from '../app/types';
import { api } from '../lib/api';

const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';
const USER_KEY = 'user';

function clearStorage() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const storedUser = localStorage.getItem(USER_KEY);
  const accessToken = localStorage.getItem(ACCESS_KEY);
  if (storedUser && accessToken) {
    try {
      return JSON.parse(storedUser) as User;
    } catch {
      clearStorage();
    }
  }
  return null;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(getStoredUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(false);
  }, []);

  const login = useCallback((accessToken: string, refreshToken: string, userData: User) => {
    localStorage.setItem(ACCESS_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    const token = localStorage.getItem(REFRESH_KEY);
    if (token) {
      api.post('/auth/logout', { refreshToken: token }).catch(() => {});
    }
    clearStorage();
    setUser(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }, []);

  const refreshTokens = useCallback(async (): Promise<string | null> => {
    const token = localStorage.getItem(REFRESH_KEY);
    if (!token) return null;

    try {
      const res = await api.post('/auth/refresh', { refreshToken: token });
      localStorage.setItem(ACCESS_KEY, res.data.accessToken);
      localStorage.setItem(REFRESH_KEY, res.data.refreshToken);
      return res.data.accessToken;
    } catch {
      clearStorage();
      setUser(null);
      return null;
    }
  }, []);

  return { user, loading, login, logout, refreshTokens };
}
