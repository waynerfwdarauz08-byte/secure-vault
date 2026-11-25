import { Link } from "react-router-dom";
import { Heart, MoreHorizontal } from "lucide-react";
export const formatDate = (value) =>
  new Date(value + "T12:00:00").toLocaleDateString("es-CR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
export function Cover({ id, color }) {
  return (
    <div aria-hidden="true" className={"cover " + color + " " + id}>
      <span />
      <i />
      <b />
    </div>
  );
}
export default function EntryCard({ entry, onFavorite }) {
  return (
    <article className="entry-card">
      <Link to={"/entradas/" + entry.id} tabIndex={-1} aria-hidden="true">
        <Cover id={entry.coverId} color={entry.cardColor} />
      </Link>
      <div className="entry-card-body">
        <div className="card-meta">
          <time dateTime={entry.entryDate}>{formatDate(entry.entryDate)}</time>
          <button
            className={
              "icon-button favorite " + (entry.isFavorite ? "selected" : "")
            }
            aria-label={
              entry.isFavorite ? "Quitar de favoritos" : "Marcar como favorito"
            }
            aria-pressed={entry.isFavorite}
            onClick={() => onFavorite(entry)}
          >
            <Heart
              size={19}
              fill={entry.isFavorite ? "currentColor" : "none"}
            />
          </button>
          <details className="entry-menu">
            <summary aria-label="Opciones de entrada">
              <MoreHorizontal size={18} />
            </summary>
            <div>
              <Link to={"/entradas/" + entry.id}>Leer entrada</Link>
              <Link to={"/entradas/" + entry.id + "/editar"}>
                Editar entrada
              </Link>
            </div>
          </details>
        </div>
        <h3>
          <Link to={"/entradas/" + entry.id}>{entry.title}</Link>
        </h3>
        <p>{entry.body || "Una página que empieza con un título."}</p>
        <div className="tags">
          {entry.mood && <span>{entry.mood}</span>}
          {entry.tags.slice(0, 2).map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </div>
      </div>
    </article>
  );
}
