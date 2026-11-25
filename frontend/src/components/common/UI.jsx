import { useEffect, useRef } from "react";
import { X } from "lucide-react";
export function ErrorMessage({ error }) {
  return error ? (
    <div className="error" role="alert">
      {error.message ?? error}
      {error.fields?.map((f, i) => (
        <div key={i}>
          {f.path}: {f.message}
        </div>
      ))}
    </div>
  ) : null;
}
export function Field({ label, error, ...props }) {
  const id = props.id ?? props.name;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? id + "-error" : undefined}
        {...props}
      />
      {error && <small id={id + "-error"}>{error}</small>}
    </div>
  );
}
export function Modal({ title, children, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const prior = document.activeElement;
    ref.current.showModal();
    return () => prior?.focus();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      aria-labelledby="modal-title"
    >
      <header>
        <h2 id="modal-title">{title}</h2>
        <button className="icon-button" aria-label="Cerrar" onClick={onClose}>
          <X />
        </button>
      </header>
      {children}
    </dialog>
  );
}
export function Loading() {
  return (
    <div className="loading" role="status">
      Abriendo tu espacio…
    </div>
  );
}
