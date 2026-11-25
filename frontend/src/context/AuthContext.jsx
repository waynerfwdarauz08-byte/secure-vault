import { createContext, useContext, useEffect, useState } from "react";
import { api, bootstrap, clearSession, onExpired } from "../services/api";
const Context = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true),
    [connectionError, setConnectionError] = useState("");
  useEffect(() => {
    onExpired(() => setUser(null));
    bootstrap()
      .then(() => api("/auth/me"))
      .then((r) => setUser(r.data))
      .catch((e) => {
        if (e.status !== 401) setConnectionError(e.message);
      })
      .finally(() => setLoading(false));
    return () => onExpired(() => {});
  }, []);
  async function login(body) {
    const r = await api("/auth/login", { method: "POST", body });
    setUser(r.data);
  }
  async function logout() {
    await api("/auth/logout", { method: "POST" });
    clearSession();
    setUser(null);
  }
  return (
    <Context.Provider
      value={{ user, setUser, loading, connectionError, login, logout }}
    >
      {children}
    </Context.Provider>
  );
}
export const useAuth = () => useContext(Context);
