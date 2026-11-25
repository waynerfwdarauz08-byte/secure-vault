import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Pencil, Trash2, Heart } from "lucide-react";
import { useDiary } from "../context/DiaryContext";
import { Cover, formatDate } from "../components/diary/EntryCard";
import { Modal, ErrorMessage, Loading } from "../components/common/UI";
export default function EntryPage() {
  const { id } = useParams(),
    { entries, loading, remove, save } = useDiary(),
    navigate = useNavigate(),
    [confirm, setConfirm] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(null);
  const n = entries.find((e) => e.id === id);
  if (loading) return <Loading />;
  if (!n)
    return (
      <p>
        Entrada no encontrada.{" "}
        <Link to="/entradas">Volver a mis recuerdos</Link>
      </p>
    );
  async function favorite() {
    try {
      const { id, createdAt, updatedAt, ...data } = n;
      void createdAt;
      void updatedAt;
      await save({ ...data, isFavorite: !data.isFavorite }, id);
    } catch (e) {
      setError(e);
    }
  }
  return (
    <>
      <div className="reading-actions">
        <Link to="/entradas">Mis recuerdos</Link>
        <div>
          <button
            className="button secondary"
            onClick={favorite}
            aria-pressed={n.isFavorite}
          >
            <Heart size={16} />
            {n.isFavorite ? "Favorito" : "Guardar favorito"}
          </button>
          <Link className="button secondary" to={"/entradas/" + id + "/editar"}>
            <Pencil size={16} />
            Editar
          </Link>
          <button
            className="icon-button danger"
            aria-label="Eliminar entrada"
            onClick={() => setConfirm(true)}
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>
      <ErrorMessage error={error} />
      <article className="reading-page">
        <Cover id={n.coverId} color={n.cardColor} />
        <div className="reading-content">
          <time className="eyebrow">{formatDate(n.entryDate)}</time>
          <h1>{n.title}</h1>
          <div className="tags">
            {n.mood && <span>{n.mood}</span>}
            {n.tags.map((t) => (
              <span key={t}>#{t}</span>
            ))}
          </div>
          <p className="entry-text">{n.body}</p>
        </div>
      </article>
      {confirm && (
        <Modal
          title="¿Eliminar esta entrada?"
          onClose={() => setConfirm(false)}
        >
          <p>Esta acción es permanente. Esta página no podrá recuperarse.</p>
          <div className="dialog-actions">
            <button
              className="button secondary"
              onClick={() => setConfirm(false)}
            >
              Conservar
            </button>
            <button
              className="button danger"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await remove(id);
                  navigate("/entradas");
                } catch (e) {
                  setError(e);
                  setConfirm(false);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Eliminar entrada
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
