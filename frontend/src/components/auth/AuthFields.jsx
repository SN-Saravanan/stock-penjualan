import { Eye, EyeOff, LockKeyhole } from "lucide-react";

export const authInputClass =
  "auth-input peer block w-full rounded-2xl border border-slate-200 bg-white text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/80";

export function AuthInput({
  id,
  label,
  icon: Icon,
  error,
  hint,
  ...inputProps
}) {
  return (
    <div className="auth-field">
      <label className="auth-label" htmlFor={id}>
        {label}
      </label>
      <div className="auth-input-wrap">
        <Icon
          className="auth-input-icon"
          size={19}
          strokeWidth={1.8}
          aria-hidden="true"
        />
        <input
          id={id}
          className={`${authInputClass} ${error ? "auth-input-error" : ""}`}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error ? `${id}-error` : hint ? `${id}-hint` : undefined
          }
          {...inputProps}
        />
      </div>
      {error ? (
        <p className="auth-field-message" id={`${id}-error`} role="alert">
          {error}
        </p>
      ) : null}
      {!error && hint ? (
        <p className="auth-field-hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function AuthPasswordField({
  id,
  label,
  show,
  onToggle,
  error,
  hint,
  ...inputProps
}) {
  return (
    <div className="auth-field">
      <label className="auth-label" htmlFor={id}>
        {label}
      </label>
      <div className="auth-input-wrap">
        <LockKeyhole
          className="auth-input-icon"
          size={19}
          strokeWidth={1.8}
          aria-hidden="true"
        />
        <input
          id={id}
          type={show ? "text" : "password"}
          className={`${authInputClass} auth-input-password ${error ? "auth-input-error" : ""}`}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error ? `${id}-error` : hint ? `${id}-hint` : undefined
          }
          {...inputProps}
        />
        <button
          type="button"
          className="auth-password-toggle"
          aria-label={
            show
              ? `Sembunyikan ${label.toLowerCase()}`
              : `Tampilkan ${label.toLowerCase()}`
          }
          aria-pressed={show}
          onClick={onToggle}
        >
          {show ? <EyeOff size={19} /> : <Eye size={19} />}
        </button>
      </div>
      {error ? (
        <p className="auth-field-message" id={`${id}-error`} role="alert">
          {error}
        </p>
      ) : null}
      {!error && hint ? (
        <p className="auth-field-hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
