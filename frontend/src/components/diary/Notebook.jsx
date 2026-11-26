import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, Feather, Heart, LockKeyhole, MoreHorizontal, Pencil, Plus, X } from "lucide-react";
import { formatDate } from "./EntryCard";

export function LeatherCover({ name = "Tu historia", onOpen, decorative = false, open = false }) {
  const content = <>
    <span className="cover-stitch" aria-hidden="true" />
    <span className="cover-emblem" aria-hidden="true"><Feather size={34} strokeWidth={1} /></span>
    <span className="cover-title">Mi cuaderno</span>
    <span className="cover-subtitle">PALABRAS QUE SE QUEDAN</span>
    <span className="cover-owner">{name}</span>
    <span className="cover-clasp" aria-hidden="true"><i /></span>
    <span className="cover-bottom">SECUREVAULT · EDICIÓN PERSONAL</span>
    {!decorative && <span className="cover-open"><BookOpen size={15} /> Abrir mi cuaderno</span>}
  </>;
  return decorative
    ? <div className="leather-cover decorative-cover" aria-hidden="true">{content}</div>
    : <button className="leather-cover book-cover" onClick={onOpen} aria-label="Abrir mi cuaderno" tabIndex={open ? -1 : 0} aria-hidden={open}>{content}</button>;
}

export function PaperSpread({ left, children, className = "" }) {
  return <div className={"paper-spread " + className}>
    <section className="notebook-page page-left">{left}</section>
    <section className="notebook-page page-right">{children}</section>
    <span className="book-binding" aria-hidden="true" />
  </div>;
}

export default function Notebook({ entries, name, onFavorite, emptyTitle, queryActive }) {
  const [open, setOpen] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [turn, setTurn] = useState(null);
  const touch = useRef(null);
  const index = Math.max(0, entries.findIndex(entry => entry.id === selectedId));
  const entry = entries[index];
  function select(next) {
    if (turn || next < 0 || next >= entries.length || next === index) return;
    setTurn({ entry, direction: next > index ? "forward" : "backward" });
    setSelectedId(entries[next].id);
  }
  const left = <>
    <div className="folio-header"><span>EL CUADERNO DE {name.toLocaleUpperCase()}</span><span>ÍNDICE</span></div>
    <div className="index-intro"><span className="chapter-label">CAPÍTULO ABIERTO</span><h2>Todo empieza<br />con una <em>página.</em></h2><p>Los días pasan. Algunas cosas merecen quedarse.</p></div>
    <div className="notebook-index" aria-label="Índice del cuaderno">
      {entries.map((item, position) => <button key={item.id} className={item.id === entry?.id ? "index-entry selected" : "index-entry"} aria-current={item.id === entry?.id ? "page" : undefined} onClick={() => select(position)}>
        <span className="index-number">{String(position + 1).padStart(2, "0")}</span><span><strong>{item.title}</strong><small>{formatDate(item.entryDate)}</small></span><span className="index-dots" /><span className="index-page-number">{position + 1}</span>
      </button>)}
      {!entries.length && <p className="index-empty">Este índice se llena con tus propias historias.</p>}
    </div>
    <Link className="index-new" to="/entradas/nueva"><Plus size={17} /> Una página nueva <span>↗</span></Link>
    <div className="folio-bottom"><Feather size={18} strokeWidth={1} /><span>Escribí a tu manera.</span><span>i</span></div>
  </>;
  return <div className="notebook-scene">
    <div className="book-top-caption"><span><LockKeyhole size={13} /> UN ESPACIO SOLO TUYO</span><button onClick={() => { setOpen(!open); setTurn(null); }}>{open ? <><X size={13} /> Cerrar cuaderno</> : <><BookOpen size={13} /> Abrir cuaderno</>}</button></div>
    <div className={"physical-notebook " + (open ? "is-open" : "is-closed")} tabIndex={open ? 0 : -1} aria-label="Cuaderno: usá las flechas izquierda y derecha para pasar las páginas" onKeyDown={event => {
      if (event.target !== event.currentTarget || !open) return;
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); select(index + (event.key === "ArrowRight" ? 1 : -1)); }
    }} onTouchStart={event => { touch.current = { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY }; }} onTouchEnd={event => {
      if (!touch.current || !open || /BUTTON|INPUT|TEXTAREA|SELECT|A/.test(event.target.tagName)) return;
      const dx = event.changedTouches[0].clientX - touch.current.x;
      const dy = event.changedTouches[0].clientY - touch.current.y;
      if (Math.abs(dx) > 65 && Math.abs(dy) < 60) select(index + (dx < 0 ? 1 : -1));
      touch.current = null;
    }}>
      <div className="book-cover-underlay" aria-hidden="true" />
      <div className="book-spine" aria-hidden="true" />
      <div className="book-page-edges" aria-hidden="true" />
      <div className="book-side-sheets" aria-hidden="true" />
      <div className="open-book-content" inert={!open}>
        <PaperSpread left={left}>
          <div className="folio-header"><span>{entry ? formatDate(entry.entryDate) : "LA PRIMERA DE MUCHAS"}</span><span>{entry ? String(index + 1).padStart(2, "0") : "01"}</span></div>
          {entry ? <>
            <div className="entry-page-heading"><span className="chapter-label">{entry.mood || "UN MOMENTO PARA RECORDAR"}</span><div className="page-entry-tools"><Link to={"/entradas/" + entry.id} aria-label="Opciones de esta entrada"><MoreHorizontal size={19} /></Link><button className={"page-favorite " + (entry.isFavorite ? "is-favorite" : "")} aria-label={entry.isFavorite ? "Quitar favorito" : "Guardar favorito"} aria-pressed={entry.isFavorite} onClick={() => onFavorite(entry)}><Heart size={19} /></button></div></div>
            <div className="notebook-writing" key={entry.id}><h2>{entry.title}</h2><p className="handwritten-entry">{entry.body || "Este recuerdo todavía no tiene palabras."}</p><div className="notebook-tags">{entry.tags.map(tag => <span key={tag}>#{tag}</span>)}</div></div>
            <Link className="page-edit" to={"/entradas/" + entry.id + "/editar"}><Pencil size={14} /> Seguir escribiendo</Link>
          </> : <div className="blank-page"><Feather size={44} strokeWidth={1} /><h2>{emptyTitle}</h2><p>{queryActive ? "Probá con otras palabras o cambiá los filtros." : "No hace falta una gran historia. Empezá por lo que sentís hoy."}</p><Link className="button" to="/entradas/nueva"><Plus size={17} /> Escribir mi primera entrada</Link></div>}
          <div className="folio-bottom"><span>{entry ? "Tu historia, con tu letra." : "Sin prisa. Sin reglas."}</span><span>{index + 1}</span></div>
        </PaperSpread>
        {turn && <div className={"flipping-leaf flip-" + turn.direction} onAnimationEnd={event => { if (event.target === event.currentTarget) setTurn(null); }} aria-hidden="true"><div className="leaf-face"><span className="chapter-label">{formatDate(turn.entry.entryDate)}</span><h2>{turn.entry.title}</h2><p>{turn.entry.body}</p></div><div className="leaf-back" /></div>}
      </div>
      <LeatherCover name={name} onOpen={() => setOpen(true)} open={open} />
      <div className="book-ribbon" aria-hidden="true" />
    </div>
    <div className="book-pagination"><button className="page-arrow" aria-label="Página anterior" disabled={!open || index === 0 || !!turn} onClick={() => select(index - 1)}><ArrowLeft size={18} /><span>Anterior</span></button><span aria-live="polite">{!open ? "Tu historia está a un gesto de distancia" : entries.length ? <>Página <strong>{index + 1}</strong> de {entries.length}</> : "Tu primera página está por escribirse"}</span><button className="page-arrow" aria-label="Página siguiente" disabled={!open || index >= entries.length - 1 || !!turn} onClick={() => select(index + 1)}><span>Siguiente</span><ArrowRight size={18} /></button></div>
    <span className="desk-pen" aria-hidden="true"><i /></span>
  </div>;
}
