import { createBrowserRouter, Navigate, Outlet, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { DiaryProvider } from "../context/DiaryContext";
import Layout from "../components/layout/Layout";
import { Loading } from "../components/common/UI";
import AuthPage from "../pages/AuthPage";
import DiaryPage from "../pages/DiaryPage";
import EditorPage from "../pages/EditorPage";
import EntryPage from "../pages/EntryPage";
import CalendarPage from "../pages/CalendarPage";
import ProfilePage from "../pages/ProfilePage";
import AdminPage from "../pages/AdminPage";
import HelpPage from "../pages/HelpPage";
function Private() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  return user ? (
    <DiaryProvider key={user.id}>
      <Outlet />
    </DiaryProvider>
  ) : (
    <Navigate to="/login" replace />
  );
}
function Admin() {
  return useAuth().user?.role === "administrador" ? (
    <Outlet />
  ) : (
    <Navigate to="/denegado" replace />
  );
}
function Missing() {
  return (
    <div className="empty-state">
      <h1>Esta página no está acá.</h1>
      <Link to="/diario">Volver a mi diario</Link>
    </div>
  );
}
export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/diario" replace /> },
  ...["login", "registro", "recuperar", "restablecer"].map((path) => ({
    path: "/" + path,
    element: <AuthPage key={path} />,
  })),
  {
    element: <Private />,
    children: [
      {
        element: <Layout />,
        children: [
          ...["diario", "entradas", "favoritos"].map((path) => ({
            path: "/" + path,
            element: <DiaryPage key={path} />,
          })),
          { path: "/entradas/nueva", element: <EditorPage /> },
          { path: "/entradas/:id/editar", element: <EditorPage /> },
          { path: "/entradas/:id", element: <EntryPage /> },
          { path: "/calendario", element: <CalendarPage /> },
          { path: "/perfil", element: <ProfilePage /> },
          { path: "/ayuda", element: <HelpPage /> },
          {
            element: <Admin />,
            children: [
              { path: "/admin/usuarios", element: <AdminPage key="users" /> },
              { path: "/admin/eventos", element: <AdminPage key="events" /> },
            ],
          },
        ],
      },
    ],
  },
  {
    path: "/denegado",
    element: (
      <div className="empty-state">
        <h1>Acceso denegado</h1>
        <Link to="/diario">Volver</Link>
      </div>
    ),
  },
  { path: "*", element: <Missing /> },
]);
