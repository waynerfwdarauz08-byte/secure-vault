import { useEffect, useState } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { ErrorMessage, Field, Loading } from "../components/common/UI";
export default function ProfilePage() {
  const { setUser } = useAuth(),
    [data, setData] = useState(null),
    [revealed, setRevealed] = useState(null),
    [error, setError] = useState(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    api("/profile")
      .then((r) => setData(r.data))
      .catch(setError);
  }, []);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const f = new FormData(e.currentTarget),
      body = { name: f.get("name") };
    if (f.get("phone")) body.phone = f.get("phone");
    if (f.get("clearPhone")) body.phone = null;
    try {
      const r = await api("/profile", { method: "PATCH", body });
      setData(r.data);
      setUser(({ id, email, role, isActive }) => ({
        id,
        email,
        role,
        isActive,
        name: r.data.name,
      }));
      setRevealed(null);
      setMessage("Tu perfil se guardó.");
      e.target.reset();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">TU ESPACIO, A TU MANERA</p>
          <h1>Mi perfil.</h1>
          <p>Los detalles que hacen este lugar tuyo.</p>
        </div>
      </div>
      <ErrorMessage error={error} />
      {!data ? (
        <Loading />
      ) : (
        <div className="profile-grid">
          <form className="panel" onSubmit={submit}>
            <h2>Tus datos</h2>
            <Field
              name="name"
              label="Nombre"
              required
              maxLength={100}
              defaultValue={data.name}
            />
            <Field name="email" label="Correo" value={data.email} readOnly />
            <div className="sensitive">
              <span>Teléfono guardado</span>
              <strong>
                {revealed ??
                  data.phoneMasked ??
                  "Todavía no agregaste un teléfono"}
              </strong>
              {data.phoneMasked && (
                <button
                  type="button"
                  className="button secondary"
                  onClick={async () => {
                    if (revealed) {
                      setRevealed(null);
                      return;
                    }
                    try {
                      const r = await api("/profile/reveal-sensitive", {
                        method: "POST",
                      });
                      setRevealed(r.data.phone);
                    } catch (e) {
                      setError(e);
                    }
                  }}
                >
                  {revealed ? <EyeOff size={16} /> : <Eye size={16} />}{" "}
                  {revealed ? "Ocultar" : "Revelar mi teléfono"}
                </button>
              )}
            </div>
            <Field
              name="phone"
              label="Nuevo teléfono (opcional)"
              type="tel"
              maxLength={25}
              pattern="[+0-9 ()-]{7,25}"
              placeholder="+506 8888 8888"
            />
            <label className="check">
              <input name="clearPhone" type="checkbox" />
              Eliminar teléfono guardado
            </label>
            <button className="button" disabled={busy}>
              {busy ? "Guardando…" : "Guardar perfil"}
            </button>
            <p role="status">{message}</p>
          </form>
          <aside className="panel privacy-panel">
            <ShieldCheck size={35} strokeWidth={1} />
            <h2>Privado, por diseño.</h2>
            <p>
              Tu teléfono y el contenido de tus entradas se guardan cifrados.
              Solo tu cuenta puede consultarlos desde la aplicación.
            </p>
            <p>
              El servidor puede descifrarlos con sus llaves. Esto no es cifrado
              de extremo a extremo.
            </p>
            <p>
              Para cambiar tu contraseña, usá la recuperación desde el inicio de
              sesión. Al restablecerla se cerrarán todas tus sesiones.
            </p>
          </aside>
        </div>
      )}
    </>
  );
}
