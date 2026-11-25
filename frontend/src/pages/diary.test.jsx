import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import DiaryPage from "./DiaryPage";
import CalendarPage from "./CalendarPage";
import EditorPage from "./EditorPage";
import { useDiary } from "../context/DiaryContext";
import EntryCard from "../components/diary/EntryCard";
vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: { name: "Ana" } }),
}));
vi.mock("../context/DiaryContext", () => ({ useDiary: vi.fn() }));
const entry = {
  id: "one",
  title: "<script>alert(1)</script>",
  body: "Un día hermoso",
  entryDate: "2026-11-25",
  mood: "feliz",
  tags: ["bosque"],
  isFavorite: true,
  cardColor: "sage",
  coverId: "botanical",
};
const save = vi.fn(async (data) => ({ ...data, id: "one" }));
function renderPage(element, path = "/entradas") {
  const router = createMemoryRouter([{ path: "*", element }], {
    initialEntries: [path],
  });
  return render(<RouterProvider router={router} />);
}
describe("diario privado", () => {
  it("renderiza XSS como texto sin ejecutar", () => {
    renderPage(<EntryCard entry={entry} onFavorite={() => {}} />);
    expect(screen.getByRole("heading").textContent).toContain("<script>");
    expect(document.querySelector("script")).toBeNull();
  });
  it("busca contenido y filtra favoritos", () => {
    useDiary.mockReturnValue({
      entries: [
        entry,
        { ...entry, id: "two", title: "Otra página", isFavorite: false },
      ],
      loading: false,
      save,
    });
    renderPage(<DiaryPage />, "/favoritos");
    expect(screen.queryByText("Otra página")).toBeNull();
    fireEvent.change(screen.getByPlaceholderText("Buscar un recuerdo…"), {
      target: { value: "inexistente" },
    });
    expect(
      screen.getByText("No encontramos ese recuerdo."),
    ).toBeInTheDocument();
  });
  it("muestra calendario y navegación mensual", () => {
    useDiary.mockReturnValue({ entries: [entry], loading: false });
    renderPage(<CalendarPage />);
    expect(screen.getByLabelText("Mes anterior")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Mes anterior"));
    expect(screen.getByLabelText("Mes siguiente")).toBeInTheDocument();
  });
  it("editor guarda campos y contador", async () => {
    useDiary.mockReturnValue({ entries: [], loading: false, save });
    renderPage(<EditorPage />, "/entradas/nueva");
    const title = await screen.findByLabelText("Título");
    fireEvent.change(title, { target: { value: "Nueva página" } });
    fireEvent.change(screen.getByLabelText("Contenido"), {
      target: { value: "Un pequeño momento" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar entrada" }));
    expect(save).toHaveBeenCalled();
  });
  it("estado vacío no inventa recuerdos", () => {
    useDiary.mockReturnValue({ entries: [], loading: false });
    renderPage(<DiaryPage />);
    expect(
      screen.getByText("Tu historia está por escribirse."),
    ).toBeInTheDocument();
  });
});
