import { createContext, useContext, useState } from "react";

export const notebookOptions = {
  cover: [["onyx", "Cuero negro"], ["cognac", "Cuero coñac"], ["olive", "Oliva"], ["wine", "Borgoña"]],
  paper: [["ruled", "Rayado"], ["plain", "Liso"], ["dotted", "Punteado"]],
  font: [["literary", "Literaria"], ["handwritten", "Manuscrita"], ["modern", "Moderna"]],
  desk: [["walnut", "Nogal"], ["midnight", "Medianoche"], ["linen", "Lino"]],
  effects: [["calm", "Luz y movimiento"], ["still", "Sin movimiento"]],
};
const defaults = { cover: "onyx", paper: "ruled", font: "literary", desk: "walnut", effects: "calm" };
const Context = createContext({ preferences: defaults, customize: () => {} });

export function NotebookProvider({ userId, children }) {
  const key = "securevault.appearance.v1." + userId;
  const [preferences, setPreferences] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key)) ?? {};
      return Object.fromEntries(Object.entries(defaults).map(([name, value]) => [name,
        notebookOptions[name].some(([option]) => option === saved[name]) ? saved[name] : value]));
    } catch { return defaults; }
  });
  function customize(name, value) {
    if (!notebookOptions[name]?.some(([option]) => option === value)) return;
    setPreferences(previous => {
      const next = { ...previous, [name]: value };
      // Appearance selections only. Never store diary text, credentials or tokens.
      try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* Session appearance still works. */ }
      return next;
    });
  }
  return <Context.Provider value={{ preferences, customize }}>{children}</Context.Provider>;
}

export const useNotebook = () => useContext(Context);
