import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { api, tokenStore } from '../api/client.js';

const AuthContext = createContext(null);

/** Holds the signed-in user and exposes signup/login/logout to the whole tree. */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // `loading` covers the initial "do we already have a valid token?" check,
  // so protected routes do not flash the login screen on refresh.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tokenStore.get()) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then(({ user: u }) => setUser(u))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  const persist = useCallback(({ token, user: u }) => {
    tokenStore.set(token);
    setUser(u);
    return u;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      signup: async (payload) => persist(await api.signup(payload)),
      login: async (payload) => persist(await api.login(payload)),
      logout: () => {
        tokenStore.clear();
        setUser(null);
      },
    }),
    [user, loading, persist]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
