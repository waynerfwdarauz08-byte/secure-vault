import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  PenLine,
  Search,
  BookOpen,
  Heart,
  CalendarDays,
  Plus,
  Leaf,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useDiary } from "../context/DiaryContext";
import EntryCard from "../components/diary/EntryCard";
import { ErrorMessage, Loading } from "../components/common/UI";
export default function DiaryPage() {
  const { user } = useAuth(),
    { entries, loading, error, save, reload } = useDiary(),
    { pathname } = useLocation(),
    home = pathname === "/diario",
    favorites = pathname === "/favoritos";
  const [query, setQuery] = useState(""),
    [mood, setMood] = useState(""),
    [sort, setSort] = useState("new"),
    [actionError, setActionError] = useState(null);
  const visible = entries
    .filter(
      (n) =>
        (!favorites || n.isFavorite) &&
        (!mood || n.mood === mood) &&
        [n.title, n.body, ...n.tags]
          .join(" ")
          .toLocaleLowerCase()
          .includes(query.toLocaleLowerCase()),
    )
    .sort((a, b) =>
      sort === "old"
        ? a.entryDate.localeCompare(b.entryDate)
        : b.entryDate.localeCompare(a.entryDate),
    );
  async function favorite(n) {
    try {
      const { id, createdAt, updatedAt, ...data } = n;
      void createdAt;
      void updatedAt;
      await save({ ...data, isFavorite: !n.isFavorite }, id);
    } catch (e) {
      setActionError(e);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            {new Date().toLocaleDateString("es-CR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <h1>
            {home
              ? "Hola, " + user.name.split(" ")[0] + "."
              : favorites
                ? "Tus páginas favoritas."
                : "Cada página, un recuerdo."}
          </h1>
          <p>
            {home
              ? "Este es tu espacio. ¿Qué te gustaría guardar hoy?"
              : favorites
                ? "Esos momentos a los que te gusta volver."
                : "Un pequeño archivo de lo que hace tu vida tuya."}
          </p>
        </div>
        <span className="heading-leaf" aria-hidden="true">
          <Leaf size={42} strokeWidth={1} />
        </span>
      </div>
      {home && (
        <>
          <section className="writing-invitation">
            <div>
              <span className="eyebrow">
                UNA PÁGINA EN BLANCO, MIL POSIBILIDADES
              </span>
              <h2>
                Hacé una pausa.
                <br />
                <em>Dejá que las palabras lleguen.</em>
              </h2>
              <p>Un pensamiento, una alegría o algo que no querés olvidar.</p>
              <Link className="button" to="/entradas/nueva">
                <PenLine size={18} />
                Escribir una entrada
              </Link>
            </div>
            <div className="paper-art" aria-hidden="true">
              <div>
                <span>Querido diario,</span>
                <i />
                <i />
                <i />
                <Leaf size={54} strokeWidth={1} />
              </div>
              <span className="sun-disc" />
            </div>
          </section>
          <section className="stats" aria-label="Tu diario en números">
            <div>
              <BookOpen />
              <strong>
                {entries.length}
                <small>entradas en tu diario</small>
              </strong>
            </div>
            <div>
              <Heart />
              <strong>
                {entries.filter((n) => n.isFavorite).length}
                <small>recuerdos favoritos</small>
              </strong>
            </div>
            <Link to="/calendario">
              <CalendarDays />
              <strong>
                Tu calendario<small>Un recuerdo para cada día</small>
              </strong>
            </Link>
          </section>
        </>
      )}
      <section>
        <div className="section-heading">
          <div>
            <p className="eyebrow">TUS PALABRAS, A TU RITMO</p>
            <h2>
              {home
                ? "Entre tus páginas"
                : favorites
                  ? "Para volver a sentir"
                  : "Mi colección de recuerdos"}
            </h2>
          </div>
          {home && <Link to="/entradas">Ver todas las entradas</Link>}
        </div>
        <div className="filters">
          <label className="search">
            <Search size={18} />
            <span className="sr-only">Buscar en mis entradas</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar un recuerdo…"
            />
          </label>
          <label>
            <span className="sr-only">Estado de ánimo</span>
            <select value={mood} onChange={(e) => setMood(e.target.value)}>
              <option value="">Todos los ánimos</option>
              {["sereno", "feliz", "cansado", "reflexivo"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Ordenar entradas</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="new">Más recientes</option>
              <option value="old">Más antiguas</option>
            </select>
          </label>
        </div>
        <ErrorMessage error={error ?? actionError} />
        {error && <button onClick={reload}>Reintentar</button>}
        {loading ? (
          <Loading />
        ) : visible.length ? (
          <div className="entries-grid">
            {visible.slice(0, home ? 6 : 100).map((n) => (
              <EntryCard key={n.id} entry={n} onFavorite={favorite} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <BookOpen size={42} strokeWidth={1} />
            <h3>
              {query || mood
                ? "No encontramos ese recuerdo."
                : favorites
                  ? "Tus favoritos tendrán un lugar acá."
                  : "Tu historia está por escribirse."}
            </h3>
            <p>
              {query || mood
                ? "Probá con otras palabras o cambiá los filtros."
                : "Una frase, un día especial, una pequeña idea. Empezá por lo que quieras."}
            </p>
            <Link className="button secondary" to="/entradas/nueva">
              <Plus size={18} />
              Escribir mi primera entrada
            </Link>
          </div>
        )}
      </section>
      <p className="quiet-note">
        <Leaf size={15} /> No todos los días necesitan grandes historias.
      </p>
    </>
  );
}
