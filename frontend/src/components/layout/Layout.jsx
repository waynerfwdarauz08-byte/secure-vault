import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BookOpen,
  LayoutGrid,
  CalendarDays,
  Heart,
  UserRound,
  ShieldCheck,
  LogOut,
  PenLine,
  Leaf,
  Users,
  Activity,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";
import { ErrorMessage } from "../common/UI";
const links = [
  ["/diario", LayoutGrid, "Mi diario"],
  ["/entradas", BookOpen, "Recuerdos"],
  ["/calendario", CalendarDays, "Calendario"],
  ["/favoritos", Heart, "Favoritos"],
];
export default function Layout() {
  const { user, logout } = useAuth(),
    navigate = useNavigate(),
    [error, setError] = useState("");
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink to="/diario" className="brand">
          <span className="brand-icon">
            <Leaf />
          </span>
          <span>
            SecureVault<small>UN LUGAR PARA VOS</small>
          </span>
        </NavLink>
        <p className="nav-caption">TU ESPACIO PERSONAL</p>
        <nav aria-label="Principal">
          {links.map(([to, Icon, label]) => (
            <NavLink key={to} to={to}>
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-note">
          <span>Un momento para vos.</span>
          <p>Las pequeñas cosas también merecen una página.</p>
          <Leaf size={40} />
        </div>
        <nav aria-label="Cuenta" className="account-nav">
          <NavLink to="/perfil">
            <UserRound size={20} />
            Mi perfil
          </NavLink>
          <NavLink to="/ayuda">
            <ShieldCheck size={20} />
            Privacidad y ayuda
          </NavLink>
          {user.role === "administrador" && (
            <>
              <NavLink to="/admin/usuarios">
                <Users size={20} />
                Usuarios
              </NavLink>
              <NavLink to="/admin/eventos">
                <Activity size={20} />
                Eventos
              </NavLink>
            </>
          )}
        </nav>
        <div className="sidebar-user">
          <span className="avatar">{user.name.slice(0, 1).toUpperCase()}</span>
          <div>
            <strong>{user.name}</strong>
            <small>Tu diario privado</small>
          </div>
          <button
            className="icon-button"
            aria-label="Cerrar sesión"
            onClick={async () => {
              try {
                await logout();
                navigate("/login");
              } catch (e) {
                setError(e);
              }
            }}
          >
            <LogOut size={18} />
          </button>
        </div>
        <ErrorMessage error={error} />
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span>
            <ShieldCheck size={15} /> Solo vos, tus palabras y tus recuerdos
          </span>
          <NavLink to="/entradas/nueva" className="button small">
            <PenLine size={17} />
            Escribir una entrada
          </NavLink>
          <button
            className="icon-button mobile-logout"
            aria-label="Cerrar sesión"
            onClick={async () => {
              try {
                await logout();
                navigate("/login");
              } catch (e) {
                setError(e);
              }
            }}
          >
            <LogOut size={18} />
          </button>
        </header>
        <main id="main">
          <Outlet key={user.id} />
        </main>
        <footer>
          SecureVault <span>Hecho para guardar lo que importa.</span>
        </footer>
      </div>
    </div>
  );
}
