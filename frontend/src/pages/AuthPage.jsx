import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Feather, LockKeyhole } from "lucide-react";
import { LeatherCover } from "../components/diary/Notebook";
import DeskAtmosphere from "../components/diary/DeskAtmosphere";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { ErrorMessage, Field } from "../components/common/UI";
export default function AuthPage() {
  const { pathname } = useLocation(),
    register = pathname === "/registro",
    forgot = pathname === "/recuperar",
    reset = pathname === "/restablecer";
  const { login, connectionError } = useAuth(),
    navigate = useNavigate();
  const [error, setError] = useState(null),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const [resetToken] = useState(() => {
    const token =
      new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "";
    if (reset) window.history.replaceState(null, "", window.location.pathname);
    return token;
  });
  const title = register
    ? "Tu historia empieza acá."
    : forgot
      ? "Volvé a tu espacio."
      : reset
        ? "Un nuevo comienzo."
        : "Qué bueno verte de nuevo.";
  const fieldError = (name) =>
    error?.fields
      ?.filter((f) => f.path === name)
      .map((f) => f.message)
      .join(". ");
  async function submit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const body = Object.fromEntries(new FormData(e.currentTarget));
    try {
      if (
        (register || reset) &&
        (!/[a-z]/.test(body.password) ||
          !/[A-Z]/.test(body.password) ||
          !/[0-9]/.test(body.password) ||
          !/[^\p{L}\p{N}\s]/u.test(body.password))
      ) {
        const invalid = new Error("Revisá tu contraseña");
        invalid.fields = [
          {
            path: "password",
            message: "Incluí mayúscula, minúscula, número y símbolo",
          },
        ];
        throw invalid;
      }
      if (register) {
        await api("/auth/register", { method: "POST", body });
        await login({ email: body.email, password: body.password });
        navigate("/diario");
      } else if (forgot) {
        const r = await api("/auth/forgot-password", { method: "POST", body });
        setMessage(r.data.message);
      } else if (reset) {
        const r = await api("/auth/reset-password", {
          method: "POST",
          body: { password: body.password, token: resetToken },
        });
        setMessage(r.data.message);
      } else {
        await login(body);
        navigate("/diario");
      }
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-layout">
      <DeskAtmosphere />
      <section className="auth-story">
        <div className="brand">
          <span className="brand-icon">
            <Feather />
          </span>
          SecureVault
        </div>
        <div>
          <p className="eyebrow">TU DIARIO PERSONAL Y PRIVADO</p>
          <h1>
            Hay cosas que
            <br />
            merecen quedarse
            <br />
            <em>entre tus páginas.</em>
          </h1>
          <p>
            Tu espacio para escribir y guardar lo que importa. Sin prisa, a tu
            manera.
          </p>
          <div className="auth-book-scene">
            <LeatherCover name="Un lugar para vos" decorative />
          </div>
        </div>
        <small>
          <LockKeyhole size={14} /> Tus entradas se guardan cifradas en el
          servidor.
        </small>
      </section>
      <section className="auth-form">
        <p className="eyebrow">UN MOMENTO PARA VOS</p>
        <h2>{title}</h2>
        <p>
          {register
            ? "Creá tu cuenta y dale un lugar a tus recuerdos."
            : forgot
              ? "Te enviaremos un enlace para restablecer tu contraseña."
              : reset
                ? "Elegí una contraseña única para proteger tus recuerdos."
                : "Abrí tu diario y continuá donde lo dejaste."}
        </p>
        <ErrorMessage error={error ?? connectionError} />
        {message ? (
          <div role="status" className="notice">
            {message}
            <p>
              <Link to="/login">Ir a iniciar sesión</Link>
            </p>
          </div>
        ) : (
          <form onSubmit={submit}>
            {register && (
              <Field
                error={fieldError("name")}
                name="name"
                label="Tu nombre"
                required
                maxLength={100}
                autoComplete="name"
              />
            )}
            {!reset && (
              <Field
                error={fieldError("email")}
                name="email"
                label="Correo electrónico"
                type="email"
                required
                maxLength={254}
                autoComplete="email"
                placeholder="vos@ejemplo.com"
              />
            )}
            {!forgot && (
              <>
                <Field
                  error={fieldError("password")}
                  name="password"
                  label="Contraseña"
                  type="password"
                  required
                  minLength={register || reset ? 12 : 1}
                  maxLength={128}
                  autoComplete={
                    register || reset ? "new-password" : "current-password"
                  }
                />
                {(register || reset) && (
                  <small className="hint">
                    De 12 a 128 caracteres, con mayúscula, minúscula, número y
                    símbolo.
                  </small>
                )}
              </>
            )}
            {!forgot && !register && !reset && (
              <Link className="forgot" to="/recuperar">
                ¿Olvidaste tu contraseña?
              </Link>
            )}
            <button className="button wide" disabled={busy}>
              {busy
                ? "Un momento…"
                : register
                  ? "Crear mi cuenta"
                  : forgot
                    ? "Enviar instrucciones"
                    : reset
                      ? "Guardar contraseña"
                      : "Entrar a mi diario"}
            </button>
          </form>
        )}
        <div className="auth-switch">
          {register
            ? "¿Ya tenés una cuenta? "
            : forgot || reset
              ? "¿Recordás tu contraseña? "
              : "¿Todavía no tenés un diario? "}
          <Link to={register || forgot || reset ? "/login" : "/registro"}>
            {register || forgot || reset ? "Iniciá sesión" : "Creá tu cuenta"}
          </Link>
        </div>
        <p className="privacy-note">
          <LockKeyhole size={15} /> Tus palabras son privadas. El administrador
          no puede leer tu diario desde la aplicación.
        </p>
      </section>
    </div>
  );
}
