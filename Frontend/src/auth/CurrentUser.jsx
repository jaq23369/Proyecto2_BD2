import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { usersApi } from "../api/domain";

const CurrentUserCtx = createContext(null);
const STORAGE_KEY = "neogram.currentUser";

export function CurrentUserProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  const login = useCallback((u) => setUser(u), []);
  const logout = useCallback(() => setUser(null), []);

  const refresh = useCallback(async () => {
    if (!user?.userId) return;
    try {
      const res = await usersApi.get(user.userId);
      if (res?.data) setUser(res.data);
    } catch {}
  }, [user?.userId]);

  return (
    <CurrentUserCtx.Provider value={{ user, login, logout, refresh }}>
      {children}
    </CurrentUserCtx.Provider>
  );
}

export function useCurrentUser() {
  const ctx = useContext(CurrentUserCtx);
  if (!ctx) throw new Error("useCurrentUser must be inside CurrentUserProvider");
  return ctx;
}
