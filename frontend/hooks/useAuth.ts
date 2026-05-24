import { useState, useEffect } from 'react';
import { User } from '../app/types';
import { api } from '../lib/api';

const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';
const USER_KEY = 'user';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem(USER_KEY);
    const accessToken = localStorage.getItem(ACCESS_KEY);

    if (storedUser && accessToken) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
      } catch {
        clearStorage();
      }
    }
    setLoading(false);
  }, []);

  const login = (accessToken: string, refreshToken: string, userData: User) => {
    localStorage.setItem(ACCESS_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (refreshToken) {
      api.post('/auth/logout', { refreshToken }).catch(() => {});
    }
    clearStorage();
    setUser(null);
  };

  const refreshTokens = async (): Promise<string | null> => {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!refreshToken) return null;

    try {
      const res = await api.post('/auth/refresh', { refreshToken });
      localStorage.setItem(ACCESS_KEY, res.data.accessToken);
      localStorage.setItem(REFRESH_KEY, res.data.refreshToken);
      return res.data.accessToken;
    } catch {
      clearStorage();
      setUser(null);
      return null;
    }
  };

  const clearStorage = () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  };

  return { user, loading, login, logout, refreshTokens };
}
