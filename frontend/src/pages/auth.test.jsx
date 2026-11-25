import { it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import AuthPage from "./AuthPage";
import { api } from "../services/api";
const mocks = vi.hoisted(() => ({ login: vi.fn() }));
vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ login: mocks.login }),
}));
vi.mock("../services/api", () => ({ api: vi.fn() }));
function show(path) {
  return render(
    <RouterProvider
      router={createMemoryRouter([{ path: "*", element: <AuthPage /> }], {
        initialEntries: [path],
      })}
    />,
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.login.mockResolvedValue({});
});
it("login envía correo y contraseña al contexto", async () => {
  show("/login");
  fireEvent.change(screen.getByLabelText("Correo electrónico"), {
    target: { value: "a@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Contraseña"), {
    target: { value: "Mi-ClaveSegura123!" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Entrar a mi diario" }));
  await waitFor(() =>
    expect(mocks.login).toHaveBeenCalledWith({
      email: "a@example.com",
      password: "Mi-ClaveSegura123!",
    }),
  );
});
it("registro bloquea complejidad inválida con error asociado", async () => {
  show("/registro");
  fireEvent.change(screen.getByLabelText("Tu nombre"), {
    target: { value: "Ana" },
  });
  fireEvent.change(screen.getByLabelText("Correo electrónico"), {
    target: { value: "a@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Contraseña"), {
    target: { value: "abcdefghijkl" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Crear mi cuenta" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Revisá tu contraseña",
  );
  expect(screen.getByLabelText("Contraseña")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  expect(api).not.toHaveBeenCalled();
});
it("recuperación muestra respuesta genérica", async () => {
  api.mockResolvedValue({
    data: { message: "Si la cuenta existe, recibirás instrucciones." },
  });
  show("/recuperar");
  fireEvent.change(screen.getByLabelText("Correo electrónico"), {
    target: { value: "a@example.com" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Enviar instrucciones" }));
  expect(await screen.findByRole("status")).toHaveTextContent(
    "Si la cuenta existe",
  );
});
