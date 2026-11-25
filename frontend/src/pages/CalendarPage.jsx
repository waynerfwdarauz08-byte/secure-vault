import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { useDiary } from "../context/DiaryContext";
import { ErrorMessage, Loading } from "../components/common/UI";
export default function CalendarPage() {
  const { entries, loading, error } = useDiary(),
    [month, setMonth] = useState(
      () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    );
  const year = month.getFullYear(),
    m = month.getMonth(),
    days = new Date(year, m + 1, 0).getDate(),
    offset = (month.getDay() + 6) % 7;
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">EL TIEMPO ENTRE TUS PÁGINAS</p>
          <h1>Tu calendario de recuerdos.</h1>
          <p>Cada día tiene algo para contar.</p>
        </div>
        <CalendarDays size={38} strokeWidth={1} />
      </div>
      <ErrorMessage error={error} />
      {loading ? (
        <Loading />
      ) : (
        <section className="calendar">
          <header>
            <button
              className="icon-button"
              aria-label="Mes anterior"
              onClick={() => setMonth(new Date(year, m - 1, 1))}
            >
              <ChevronLeft />
            </button>
            <h2>
              {month.toLocaleDateString("es-CR", {
                month: "long",
                year: "numeric",
              })}
            </h2>
            <button
              className="icon-button"
              aria-label="Mes siguiente"
              onClick={() => setMonth(new Date(year, m + 1, 1))}
            >
              <ChevronRight />
            </button>
          </header>
          <div className="calendar-grid">
            {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
              <strong key={d}>{d}</strong>
            ))}
            {Array.from({ length: offset }, (_, i) => (
              <div key={"blank" + i} className="blank" />
            ))}
            {Array.from({ length: days }, (_, i) => {
              const date =
                year +
                "-" +
                String(m + 1).padStart(2, "0") +
                "-" +
                String(i + 1).padStart(2, "0");
              const notes = entries.filter((n) => n.entryDate === date);
              return (
                <div
                  key={date}
                  className={
                    "calendar-day " + (notes.length ? "has-entries" : "")
                  }
                >
                  <time dateTime={date}>{i + 1}</time>
                  {notes.map((n) => (
                    <Link key={n.id} to={"/entradas/" + n.id}>
                      {n.title}
                    </Link>
                  ))}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
