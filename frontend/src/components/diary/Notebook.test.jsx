import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Notebook from "./Notebook";
import { NotebookProvider, useNotebook } from "../../context/NotebookContext";
const entries = [
  { id: "a", title: "La primera historia", body: "Una tarde tranquila", tags: [], entryDate: "2026-11-26", isFavorite: false },
  { id: "b", title: "La segunda historia", body: "<script>alert(1)</script>", tags: [], entryDate: "2026-11-25", isFavorite: true },
];
function book() { return render(<MemoryRouter><Notebook entries={entries} name="Ana" onFavorite={vi.fn()} /></MemoryRouter>); }
describe("cuaderno interactivo", () => {
  it("pasa páginas, limita extremos y vuelve atrás", () => {
    book();
    expect(screen.getByRole("button", { name: "Página anterior" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Página siguiente" }));
    expect(screen.getByRole("heading", { name: "La segunda historia" })).toBeInTheDocument();
    expect(document.querySelector("script")).toBeNull();
    fireEvent.animationEnd(document.querySelector(".flipping-leaf"));
    expect(screen.getByRole("button", { name: "Página siguiente" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Página anterior" }));
    expect(screen.getByRole("heading", { name: "La primera historia" })).toBeInTheDocument();
  });
  it("cierra la tapa y permite reabrir sin perder la página", () => {
    book();
    fireEvent.click(screen.getByRole("button", { name: "Cerrar cuaderno" }));
    expect(document.querySelector(".physical-notebook")).toHaveClass("is-closed");
    expect(screen.getByRole("button", { name: "Página siguiente" })).toBeDisabled();
    fireEvent.click(screen.getAllByRole("button", { name: "Abrir mi cuaderno" })[0]);
    expect(document.querySelector(".physical-notebook")).toHaveClass("is-open");
    expect(screen.getByRole("heading", { name: "La primera historia" })).toBeInTheDocument();
  });
  it("las flechas del teclado pasan páginas desde el cuaderno", () => {
    book();
    fireEvent.keyDown(document.querySelector(".physical-notebook"), { key: "ArrowRight" });
    expect(screen.getByRole("heading", { name: "La segunda historia" })).toBeInTheDocument();
  });
});
function Appearance() {
  const { preferences, customize } = useNotebook();
  return <><output>{preferences.cover}</output><button onClick={() => customize("cover", "cognac")}>Cambiar tapa</button></>;
}
describe("apariencia privada", () => {
  it("persiste solo opciones visuales y rechaza valores desconocidos", () => {
    localStorage.clear();
    localStorage.setItem("securevault.appearance.v1.test-user", JSON.stringify({ cover: "invalid", paper: "<script>", body: "private text" }));
    const view = render(<NotebookProvider userId="test-user"><Appearance /></NotebookProvider>);
    expect(screen.getByRole("status")).toHaveTextContent("onyx");
    fireEvent.click(screen.getByRole("button", { name: "Cambiar tapa" }));
    expect(JSON.parse(localStorage.getItem("securevault.appearance.v1.test-user"))).toEqual({ cover: "cognac", paper: "ruled", font: "literary", desk: "walnut", effects: "calm" });
    view.unmount();
    render(<NotebookProvider userId="test-user"><Appearance /></NotebookProvider>);
    expect(screen.getByRole("status")).toHaveTextContent("cognac");
  });
});
