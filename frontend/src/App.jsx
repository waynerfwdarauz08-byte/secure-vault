import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { router } from "./routes/router";
export default function App() {
  return (
    <AuthProvider>
      <a className="skip-link" href="#main">
        Saltar al contenido
      </a>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
