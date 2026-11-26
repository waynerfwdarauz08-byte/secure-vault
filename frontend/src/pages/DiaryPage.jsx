import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, PenLine, SlidersHorizontal } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useDiary } from "../context/DiaryContext";
import Notebook from "../components/diary/Notebook";
import { ErrorMessage, Loading } from "../components/common/UI";
export default function DiaryPage() {
  const { user } = useAuth(), { entries, loading, error, save, reload } = useDiary(), { pathname } = useLocation();
  const favorites = pathname === "/favoritos";
  const [query, setQuery] = useState(""), [mood,setMood] = useState(""), [sort,setSort] = useState("new"), [actionError,setActionError] = useState(null), [filters,setFilters] = useState(false);
  const visible = entries.filter(n => (!favorites || n.isFavorite) && (!mood || n.mood === mood) && [n.title,n.body,...n.tags].join(" ").toLocaleLowerCase().includes(query.toLocaleLowerCase())).sort((a,b) => sort === "old" ? a.entryDate.localeCompare(b.entryDate) : b.entryDate.localeCompare(a.entryDate));
  async function favorite(n) { try { const {id,createdAt,updatedAt,...data}=n; void createdAt;void updatedAt;await save({...data,isFavorite:!n.isFavorite},id); } catch(e) { setActionError(e); } }
  return <>
    <div className="notebook-heading"><div><p className="desk-eyebrow">TU PEQUEÑO RITUAL DIARIO</p><h1>{favorites ? "Páginas para volver." : "Un momento para vos."}</h1><p>{favorites ? "Las historias que elegiste guardar un poco más cerca." : "Cerrá el ruido de afuera. Abrí tu cuaderno."}</p></div><Link className="studio-write" to="/entradas/nueva"><PenLine size={17} /> Escribir una página <span>↗</span></Link></div>
    <div className="notebook-toolbar"><span className="notebook-date">{new Date().toLocaleDateString("es-CR",{day:"numeric",month:"long",year:"numeric"})}<span className="toolbar-dot" />{entries.length} {entries.length === 1 ? "recuerdo" : "recuerdos"}</span><div className="notebook-search-tools"><label className="notebook-search"><Search size={15} /><span className="sr-only">Buscar en mis entradas</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar un recuerdo…" /></label><button className={"filter-toggle " + (filters ? "active" : "")} aria-label="Mostrar filtros" aria-expanded={filters} onClick={()=>setFilters(!filters)}><SlidersHorizontal size={16} /></button></div></div>
    {filters && <div className="notebook-filters"><label>Estado de ánimo<select value={mood} onChange={e=>setMood(e.target.value)}><option value="">Todos los ánimos</option>{["sereno","feliz","cansado","reflexivo"].map(x=><option key={x}>{x}</option>)}</select></label><label>Ordenar entradas<select value={sort} onChange={e=>setSort(e.target.value)}><option value="new">Más recientes</option><option value="old">Más antiguas</option></select></label></div>}
    <ErrorMessage error={error ?? actionError} />{error && <button onClick={reload}>Reintentar</button>}
    {loading ? <Loading /> : <Notebook entries={visible} name={user.name.split(" ")[0]} onFavorite={favorite} queryActive={!!query || !!mood} emptyTitle={query || mood ? "No encontramos ese recuerdo." : favorites ? "Tus favoritos tendrán un lugar acá." : "Tu historia está por escribirse."} />}
    <p className="notebook-tip"><span>← →</span> Pasá las páginas con las flechas o deslizá en tu celular.</p>
  </>;
}
