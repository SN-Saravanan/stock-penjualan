import {
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  X,
} from "lucide-react";

import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import { toast } from "sonner";

import api from "../../services/api";

import useAuth from "../../hooks/useAuth";
import ModalPortal from "../ui/ModalPortal";

// ============================================================
// CHANGE PASSWORD MODAL
// ============================================================

function ChangePasswordModal({ open, onClose }) {
  const { logout } = useAuth();

  const navigate = useNavigate();

  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [showCurrent, setShowCurrent] = useState(false);

  const [showNew, setShowNew] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // ==========================================================
  // RESET WHEN OPEN
  // ==========================================================

  // ==========================================================
  // ESC
  // ==========================================================

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !submitting) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, submitting]);

  if (!open) {
    return null;
  }

  // ==========================================================
  // CHANGE
  // ==========================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !form.current_password ||
      !form.new_password ||
      !form.confirm_password
    ) {
      toast.error("Semua field password wajib diisi");

      return;
    }

    if (form.new_password.length < 8) {
      toast.error("Password baru minimal 8 karakter");

      return;
    }

    if (form.new_password !== form.confirm_password) {
      toast.error("Konfirmasi password baru tidak sama");

      return;
    }

    if (form.current_password === form.new_password) {
      toast.error("Password baru harus berbeda dari password lama");

      return;
    }

    const toastId = toast.loading("Mengubah password...");

    try {
      setSubmitting(true);

      const response = await api.patch("/auth/change-password", form);

      toast.success(response.data.message || "Password berhasil diubah", {
        id: toastId,
      });

      onClose();

      // Untuk keamanan:
      // login ulang setelah password berubah.
      logout();

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error("Change password:", error);

      toast.error(error.response?.data?.message || "Gagal mengubah password", {
        id: toastId,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalPortal onClose={() => { if (!submitting) onClose(); }}>
      <div className="fixed inset-0 z-[125] flex items-center justify-center p-4">
        {/* BACKDROP */}
        <button
          type="button"
          aria-label="Tutup ganti password"
          onClick={() => {
            if (!submitting) {
              onClose();
            }
          }}
          className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm animate-[modalBackdropIn_180ms_ease-out]"
        />

      {/* MODAL */}
      <div
        className="
          relative
          z-10
          max-h-[90vh]
          w-full
          max-w-md
          overflow-y-auto
          rounded-2xl
          border
          border-slate-200
          bg-white
          shadow-2xl
          animate-[profileModalIn_220ms_ease-out]
        "
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <KeyRound size={20} />
            </div>

            <div>
              <h2 className="font-bold text-slate-950">Ganti Password</h2>

              <p className="mt-1 text-xs text-slate-500">
                Perbarui keamanan akun Anda.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={submitting}
            aria-label="Tutup ganti password"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 disabled:opacity-40"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
          {/* INFO */}
          <div className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <ShieldCheck size={19} className="mt-0.5 shrink-0 text-blue-600" />

            <p className="text-xs leading-5 text-blue-700">
              Setelah password berhasil diubah, Anda akan diminta login kembali
              menggunakan password baru.
            </p>
          </div>

          <PasswordField
            label="Password Lama"
            name="current_password"
            value={form.current_password}
            show={showCurrent}
            onToggle={() => setShowCurrent((previous) => !previous)}
            onChange={handleChange}
            autoComplete="current-password"
          />

          <PasswordField
            label="Password Baru"
            name="new_password"
            value={form.new_password}
            show={showNew}
            onToggle={() => setShowNew((previous) => !previous)}
            onChange={handleChange}
            autoComplete="new-password"
          />

          <PasswordField
            label="Konfirmasi Password Baru"
            name="confirm_password"
            value={form.confirm_password}
            show={showConfirm}
            onToggle={() => setShowConfirm((previous) => !previous)}
            onChange={handleChange}
            autoComplete="new-password"
          />

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-600">
              Ketentuan Password
            </p>

            <ul className="mt-2 space-y-1 text-xs text-slate-500">
              <li>• Minimal 8 karakter.</li>

              <li>• Berbeda dari password lama.</li>

              <li>• Jangan gunakan password yang mudah ditebak.</li>
            </ul>
          </div>

          <div className="flex gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="h-11 flex-1 rounded-xl border border-slate-300 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LockKeyhole size={17} />

              {submitting ? "Memproses..." : "Ganti Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
}

// ============================================================
// PASSWORD FIELD
// ============================================================

function PasswordField({
  label,
  name,
  value,
  show,
  onToggle,
  onChange,
  autoComplete,
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <div className="relative">
        <input
          id={name}
          type={show ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          className="h-11 w-full rounded-xl border border-slate-300 px-4 pr-11 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />

        <button
          type="button"
          aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:text-blue-600"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

export default ChangePasswordModal;
