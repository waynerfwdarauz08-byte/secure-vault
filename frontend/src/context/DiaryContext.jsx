import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../services/api";
const Context = createContext(null);
export function DiaryProvider({ children }) {
  const [entries, setEntries] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(null);
  async function reload() {
    setError(null);
    try {
      const r = await api("/notes");
      setEntries(r.data);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    reload();
  }, []);
  async function save(data, id) {
    const r = await api("/notes" + (id ? "/" + id : ""), {
      method: id ? "PATCH" : "POST",
      body: data,
    });
    setEntries((items) =>
      id ? items.map((n) => (n.id === id ? r.data : n)) : [r.data, ...items],
    );
    return r.data;
  }
  async function remove(id) {
    await api("/notes/" + id, { method: "DELETE" });
    setEntries((items) => items.filter((n) => n.id !== id));
  }
  return (
    <Context.Provider value={{ entries, loading, error, reload, save, remove }}>
      {children}
    </Context.Provider>
  );
}
export const useDiary = () => useContext(Context);
