import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../services/api";
import { ErrorMessage, Loading, Modal } from "../components/common/UI";
export default function AdminPage() {
  const events = useLocation().pathname.endsWith("eventos"),
    [page, setPage] = useState(1),
    [result, setResult] = useState(null),
    [error, setError] = useState(null),
    [filter, setFilter] = useState(""),
    [pending, setPending] = useState(null),
    [busy, setBusy] = useState(false);
  async function load() {
    setError(null);
    try {
      setResult(
        await api(
          "/admin/" +
            (events ? "security-events" : "users") +
            "?page=" +
            page +
            "&limit=10" +
            (events && filter ? "&outcome=" + filter : ""),
        ),
      );
    } catch (e) {
      setError(e);
    }
  }
  useEffect(() => {
    setResult(null);
    load();
  }, [events, page, filter]);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">ADMINISTRACIÓN · ACCESO RESTRINGIDO</p>
          <h1>{events ? "Eventos de seguridad." : "Administrar cuentas."}</h1>
          <p>El diario y el teléfono de cada persona permanecen privados.</p>
        </div>
      </div>
      <ErrorMessage error={error} />
      {events && (
        <label>
          Resultado
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos</option>
            <option value="failure">Fallos y alertas</option>
            <option value="success">Correctos</option>
          </select>
        </label>
      )}
      {!result ? (
        <Loading />
      ) : (
        <>
          <div className="admin-list">
            {result.data.map((row) => (
              <article className="panel admin-row" key={row.id}>
                {events ? (
                  <>
                    <div>
                      <strong>{row.eventType}</strong>
                      <small>
                        {new Date(row.createdAt).toLocaleString("es-CR")}
                      </small>
                    </div>
                    <span className={"badge " + row.outcome}>
                      {row.outcome === "success" ? "Correcto" : "Fallo"}
                    </span>
                    <small>
                      Actor: {row.actorId ?? "anónimo"}
                      <br />
                      Solicitud: {row.requestId}
                    </small>
                  </>
                ) : (
                  <>
                    <div>
                      <strong>{row.name}</strong>
                      <small>{row.email}</small>
                    </div>
                    <span className="badge">
                      {row.role} · {row.isActive ? "Activo" : "Inactivo"}
                    </span>
                    <button
                      className="button secondary"
                      onClick={() =>
                        setPending({
                          id: row.id,
                          field: "role",
                          body: {
                            role:
                              row.role === "usuario"
                                ? "administrador"
                                : "usuario",
                          },
                        })
                      }
                    >
                      Cambiar rol
                    </button>
                    <button
                      className="button secondary"
                      onClick={() =>
                        setPending({
                          id: row.id,
                          field: "status",
                          body: { isActive: !row.isActive },
                        })
                      }
                    >
                      {row.isActive ? "Desactivar" : "Activar"}
                    </button>
                  </>
                )}
              </article>
            ))}
            {!result.data.length && <p>No hay resultados.</p>}
          </div>
          <div className="pagination">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </button>
            <span>
              Página {page} · {result.meta.total} registros
            </span>
            <button
              disabled={page * 10 >= result.meta.total}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </button>
          </div>
        </>
      )}
      {pending && (
        <Modal
          title="Confirmar cambio de cuenta"
          onClose={() => setPending(null)}
        >
          <p>El cambio cerrará las sesiones existentes de esta cuenta.</p>
          <div className="dialog-actions">
            <button
              className="button secondary"
              onClick={() => setPending(null)}
            >
              Cancelar
            </button>
            <button
              className="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await api(
                    "/admin/users/" + pending.id + "/" + pending.field,
                    { method: "PATCH", body: pending.body },
                  );
                  setPending(null);
                  await load();
                } catch (e) {
                  setError(e);
                  setPending(null);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Confirmar
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
