import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { parseRoleFromApi } from '../auth/roleUtils';
import { api, getToken, setToken } from '../api/client';
import type { User } from '../types';

type AuthState = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    const t = getToken();
    if (!t) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api<{ _id: string; email: string; name: string; role: string }>('/auth/me', {
        token: t,
      });
      const role = parseRoleFromApi(me.role);
      if (!role) {
        setToken(null);
        setUser(null);
        setLoading(false);
        return;
      }
      setUser({ id: me._id, email: me.email, name: me.name, role });
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<{ token: string; user: { id: string; email: string; name: string; role: string } }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }), token: null }
    );
    const role = parseRoleFromApi(res.user.role);
    if (!role) {
      throw new Error('Invalid role returned from server');
    }
    setToken(res.token);
    const next: User = { id: res.user.id, email: res.user.email, name: res.user.name, role };
    setUser(next);
    return next;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await api<{ token: string; user: { id: string; email: string; name: string; role: string } }>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify({ name, email, password }), token: null }
    );
    const role = parseRoleFromApi(res.user.role);
    if (!role) {
      throw new Error('Invalid role returned from server');
    }
    setToken(res.token);
    const next: User = { id: res.user.id, email: res.user.email, name: res.user.name, role };
    setUser(next);
    return next;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
}
