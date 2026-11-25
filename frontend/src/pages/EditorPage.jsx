import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useBlocker } from "react-router-dom";
import { Save, Leaf } from "lucide-react";
import { useDiary } from "../context/DiaryContext";
import { ErrorMessage, Loading, Modal } from "../components/common/UI";
export default function EditorPage() {
  const { id } = useParams(),
    { entries, loading, save } = useDiary(),
    navigate = useNavigate();
  const current = entries.find((n) => n.id === id);
  const [data, setData] = useState(null),
    [dirty, setDirty] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(null);
  const saved = useRef(false);
  const blocker = useBlocker(() => dirty && !saved.current);
  useEffect(() => {
    if (!loading) {
      setData(
        current
          ? Object.fromEntries(
              Object.entries(current).filter(
                ([k]) => !["id", "createdAt", "updatedAt"].includes(k),
              ),
            )
          : {
              title: "",
              body: "",
              entryDate: new Date().toLocaleDateString("en-CA"),
              mood: "",
              tags: [],
              isFavorite: false,
              cardColor: "sage",
              coverId: "botanical",
            },
      );
    }
  }, [current, loading]);
  useEffect(() => {
    const fn = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", fn);
    return () => window.removeEventListener("beforeunload", fn);
  }, [dirty]);
  const change = (key, value) => {
    setData((d) => ({ ...d, [key]: value }));
    setDirty(true);
  };
  if (loading || !data) return <Loading />;
  if (id && !current) return <p>Entrada no encontrada.</p>;
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const n = await save(data, id);
      saved.current = true;
      setDirty(false);
      navigate("/entradas/" + n.id);
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
          <p className="eyebrow">UN ESPACIO PARA TUS PALABRAS</p>
          <h1>{id ? "Volvé a esta página." : "Una nueva página."}</h1>
          <p>No hace falta escribir perfecto. Solo escribir.</p>
        </div>
        <Leaf strokeWidth={1} size={38} />
      </div>
      <ErrorMessage error={error} />
      <form onSubmit={submit} className="editor">
        <div className="editor-toolbar">
          <label>
            Fecha de tu entrada
            <input
              aria-label="Fecha de tu entrada"
              type="date"
              required
              value={data.entryDate}
              onChange={(e) => change("entryDate", e.target.value)}
            />
          </label>
          <label>
            ¿Cómo te sentís?
            <select
              value={data.mood}
              onChange={(e) => change("mood", e.target.value)}
            >
              <option value="">Sin seleccionar</option>
              {["sereno", "feliz", "cansado", "reflexivo"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={data.isFavorite}
              onChange={(e) => change("isFavorite", e.target.checked)}
            />
            Favorito
          </label>
        </div>
        <div className="paper-editor">
          <label className="sr-only" htmlFor="entry-title">
            Título
          </label>
          <input
            id="entry-title"
            className="title-input"
            placeholder="Dale un título a este día…"
            maxLength={120}
            required
            value={data.title}
            onChange={(e) => change("title", e.target.value)}
          />
          <label className="sr-only" htmlFor="entry-body">
            Contenido
          </label>
          <textarea
            id="entry-body"
            placeholder="Hoy quiero recordar…"
            maxLength={10000}
            value={data.body}
            onChange={(e) => change("body", e.target.value)}
          />
          <div className="character-count">
            {data.title.length}/120 · {data.body.length.toLocaleString("es")} /
            10 000 caracteres
          </div>
        </div>
        <div className="editor-options">
          <label>
            Etiquetas (hasta 5, separadas por coma)
            <input
              value={data.tags.join(",")}
              maxLength={124}
              onChange={(e) =>
                change("tags", e.target.value.split(",").slice(0, 5))
              }
              onBlur={() =>
                change("tags", data.tags.map((t) => t.trim()).filter(Boolean))
              }
              placeholder="gratitud, pequeños momentos"
            />
          </label>
          <fieldset>
            <legend>Color de papel</legend>
            <div className="swatches">
              {["sage", "clay", "lavender", "paper"].map((color) => (
                <label key={color} className={"swatch " + color}>
                  <input
                    type="radio"
                    name="color"
                    value={color}
                    checked={data.cardColor === color}
                    onChange={() => change("cardColor", color)}
                  />
                  <span className="sr-only">
                    {
                      {
                        sage: "Verde salvia",
                        clay: "Terracota",
                        lavender: "Lavanda",
                        paper: "Marfil",
                      }[color]
                    }
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <label>
            Portada
            <select
              value={data.coverId}
              onChange={(e) => change("coverId", e.target.value)}
            >
              <option value="botanical">Hojas de calma</option>
              <option value="sunrise">Un nuevo sol</option>
              <option value="waves">Como el agua</option>
              <option value="none">Solo papel</option>
            </select>
          </label>
        </div>
        <div className="editor-actions">
          <small>
            {dirty
              ? "Tenés cambios sin guardar."
              : "Guardá cuando estés listo. No hay autoguardado."}
          </small>
          <Link className="button secondary" to="/entradas">
            Cancelar
          </Link>
          <button className="button" disabled={busy}>
            <Save size={17} />
            {busy ? "Guardando…" : "Guardar entrada"}
          </button>
        </div>
      </form>
      {blocker.state === "blocked" && (
        <Modal title="¿Salir sin guardar?" onClose={() => blocker.reset()}>
          <p>Los cambios de esta página se perderán.</p>
          <div className="dialog-actions">
            <button
              className="button secondary"
              onClick={() => blocker.reset()}
            >
              Seguir escribiendo
            </button>
            <button className="button" onClick={() => blocker.proceed()}>
              Salir sin guardar
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
