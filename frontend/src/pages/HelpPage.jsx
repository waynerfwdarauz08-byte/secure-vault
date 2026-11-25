import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { api } from "../services/api";
import { ErrorMessage } from "../components/common/UI";
const tips = [
  [
    "Una contraseña solo para vos",
    "Usá un gestor de contraseñas y una clave larga y única. Nunca compartás tu contraseña.",
  ],
  [
    "Tus palabras se guardan cifradas",
    "Protegemos las entradas y el teléfono con AES-256-GCM. El backend puede descifrarlos; conservá también tus propias medidas de seguridad.",
  ],
  [
    "Cerrá la puerta al salir",
    "Cerrá sesión si usás un dispositivo compartido. La sesión vence tras 30 minutos de inactividad o a las 8 horas.",
  ],
  [
    "Cuidado con los enlaces",
    "La recuperación vence en 15 minutos. Nunca enviamos tu contraseña ni pedimos que la compartás por correo.",
  ],
];
export default function HelpPage() {
  const [topic, setTopic] = useState("passwords"),
    [text, setText] = useState(""),
    [error, setError] = useState(null),
    [busy, setBusy] = useState(false);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">CUIDAR LO QUE IMPORTA</p>
          <h1>Un espacio de confianza.</h1>
          <p>Pequeños hábitos para proteger tus recuerdos.</p>
        </div>
        <ShieldCheck size={40} />
      </div>
      <div className="help-grid">
        {tips.map(([title, body]) => (
          <article className="panel" key={title}>
            <h2>{title}</h2>
            <p>{body}</p>
          </article>
        ))}
      </div>
      <section className="panel assistant">
        <h2>Aprendé sobre privacidad</h2>
        <p>
          Asistente educativo opcional. Solo recibe el tema elegido; nunca
          recibe tus entradas, tu teléfono ni tu perfil.
        </p>
        <label>
          Tema
          <select value={topic} onChange={(e) => setTopic(e.target.value)}>
            {[
              ["passwords", "Contraseñas"],
              ["encryption", "Cifrado"],
              ["phishing", "Phishing"],
              ["sessions", "Sesiones"],
              ["csrf", "CSRF"],
            ].map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <button
          className="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              setText(
                (await api("/help", { method: "POST", body: { topic } })).data
                  .text,
              );
            } catch (e) {
              setError(e);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Consultando…" : "Explicar este tema"}
        </button>
        <ErrorMessage error={error} />
        {text && <p className="entry-text">{text}</p>}
      </section>
    </>
  );
}
