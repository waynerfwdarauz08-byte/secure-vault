import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { BookOpen, CalendarDays, Heart, UserRound, ShieldCheck, LogOut, PenLine, Feather, Users, Activity, SlidersHorizontal, Check, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";
import { ErrorMessage, Modal } from "../common/UI";
import { NotebookProvider, notebookOptions, useNotebook } from "../../context/NotebookContext";
import DeskAtmosphere from "../diary/DeskAtmosphere";
const links = [["/diario", BookOpen, "Mi cuaderno"], ["/favoritos", Heart, "Favoritos"], ["/calendario", CalendarDays, "Calendario"]];
function NotebookWorkspace() {
  const { user, logout } = useAuth(), navigate = useNavigate();
  const { preferences, customize } = useNotebook();
  const [error, setError] = useState(null), [settings, setSettings] = useState(false);
  async function leave() { try { await logout(); navigate("/login"); } catch (e) { setError(e); } }
  return <div className="notebook-app" data-cover={preferences.cover} data-paper={preferences.paper} data-font={preferences.font} data-desk={preferences.desk} data-effects={preferences.effects}>
    <DeskAtmosphere />
    <header className="studio-header">
      <NavLink className="studio-brand" to="/diario"><span className="studio-logo"><Feather size={22} strokeWidth={1.3} /></span><span>SecureVault<small>EL ARTE DE GUARDAR TUS DÍAS</small></span></NavLink>
      <nav className="studio-navigation" aria-label="Principal">{links.map(([to, Icon, label]) => <NavLink key={to} to={to}><Icon size={16} />{label}</NavLink>)}</nav>
      <div className="studio-account"><button className="studio-customize" onClick={() => setSettings(true)}><SlidersHorizontal size={16} /><span>Personalizar</span></button><NavLink className="studio-avatar" to="/perfil" aria-label="Mi perfil">{user.name.slice(0, 1).toUpperCase()}</NavLink><button className="studio-icon" aria-label="Cerrar sesión" onClick={leave}><LogOut size={17} /></button></div>
    </header>
    <div className="studio-body">
      <aside className="studio-rail" aria-label="Herramientas del cuaderno"><NavLink to="/entradas/nueva" aria-label="Escribir una entrada" className="rail-write"><PenLine size={21} /></NavLink><span className="rail-divider" /><NavLink to="/entradas" aria-label="Todas mis entradas"><BookOpen size={20} /></NavLink><button aria-label="Personalizar cuaderno" onClick={() => setSettings(true)}><SlidersHorizontal size={20} /></button><span className="rail-spacer" /><NavLink to="/perfil" aria-label="Mi perfil"><UserRound size={20} /></NavLink><NavLink to="/ayuda" aria-label="Privacidad y ayuda"><ShieldCheck size={20} /></NavLink>{user.role === "administrador" && <><NavLink to="/admin/usuarios" aria-label="Usuarios"><Users size={20} /></NavLink><NavLink to="/admin/eventos" aria-label="Eventos"><Activity size={20} /></NavLink></>}</aside>
      <main className="studio-main" id="main"><ErrorMessage error={error} /><Outlet key={user.id} /></main>
    </div>
    <footer className="studio-footer"><span><ShieldCheck size={12} /> Tus palabras, bajo llave.</span><span>Un cuaderno. Infinitas versiones de vos.</span><span>SECUREVAULT</span></footer>
    {settings && <Modal title="Hacelo tuyo." onClose={() => setSettings(false)}><p className="customizer-description">Tu cuaderno también tiene personalidad.</p><div className="customizer-preview"><Feather size={26} /><span>Mi cuaderno</span><small>{notebookOptions.cover.find(([id]) => id === preferences.cover)[1]}</small></div>{Object.entries(notebookOptions).map(([name, options]) => <fieldset key={name} className={"customizer-group customizer-" + name}><legend>{{cover:"01 · La tapa",paper:"02 · El papel",font:"03 · Tu letra",desk:"04 · El escritorio",effects:"05 · El ambiente"}[name]}</legend><div>{options.map(([value,label]) => <button key={value} type="button" data-option={value} className={preferences[name]===value ? "choice selected" : "choice"} aria-pressed={preferences[name]===value} onClick={() => customize(name,value)}>{name === "cover" && <span className="cover-swatch" />}<span>{label}</span>{preferences[name] === value && <Check size={13} />}</button>)}</div></fieldset>)}<div className="customizer-footer"><small>La apariencia se guarda en este dispositivo. Tus entradas siguen privadas.</small><button className="button" onClick={() => setSettings(false)}><Check size={16} /> Listo</button></div></Modal>}
  </div>;
}
export default function Layout() { const { user } = useAuth(); return <NotebookProvider key={user.id} userId={user.id}><NotebookWorkspace /></NotebookProvider>; }
