import { CalendarDays, Mail, ShieldCheck, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../../services/api";
import { formatDateTime } from "../../utils/formatters";
import ModalPortal from "../ui/ModalPortal";
import useAuth from "../../hooks/useAuth";
import { toast } from "sonner";

// ============================================================
// PROFILE MODAL
// ============================================================

function ProfileModal({ open, onClose, initialMode = "view" }) {
  return open ? <ProfileDialog key={initialMode} onClose={onClose} initialMode={initialMode} /> : null;
}

function ProfileDialog({ onClose, initialMode }) {
  const open = true;
  const { updateProfile } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "" });
  const [submitting, setSubmitting] = useState(false);
  const close = () => { if (!submitting) onClose(); };

  // ==========================================================
  // FETCH PROFILE
  // ==========================================================

  useEffect(() => {
    if (!open) {
      return;
    }

    const controller = new AbortController();
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/auth/me", { signal: controller.signal });

        setProfile(response.data.data);
        setForm({ name: response.data.data.name, email: response.data.data.email });
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Profile error:", error);

        setError(error.response?.data?.message || "Profil gagal dimuat");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchProfile();
    return () => controller.abort();
  }, [open]);

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

  const roleLabel = profile?.role === "admin" ? "Owner / Admin" : "Karyawan";

  const initial = profile?.name?.charAt(0)?.toUpperCase() || "U";

  return (
    <ModalPortal onClose={close}>
    <div
      className="
        fixed
        inset-0
        z-120
        overflow-y-auto
        overscroll-contain
      "
    >
      {/* BACKDROP */}
      <button
        type="button"
        aria-label="Tutup profil"
        onClick={close}
        className="
          fixed
          inset-0
          bg-slate-950/45
          backdrop-blur-sm
          animate-[modalBackdropIn_180ms_ease-out]
        "
      />

      {/* VIEWPORT SAFE WRAPPER */}
      <div
        className="
          modal-viewport
          relative
          flex
          min-h-full
          items-start
          justify-center
          p-4
          sm:items-center
        "
      >
        {/* MODAL */}
        <div
          className="
            relative
            z-10
            w-full
            max-w-lg
            max-h-[calc(100dvh-2rem)]
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
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-xl font-bold text-slate-950">{initialMode === "edit" ? "Pengaturan Akun" : "Profil Saya"}</h2>

            <p className="mt-1 text-sm text-slate-500">
              Informasi akun yang sedang digunakan.
            </p>
          </div>

          <button
            type="button"
            aria-label="Tutup profil"
            onClick={close}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
          >
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <ProfileSkeleton />
        ) : error ? (
          <div className="p-10 text-center">
            <p className="font-semibold text-red-600">{error}</p>
          </div>
        ) : profile && initialMode === "edit" ? (
          <form className="space-y-5 p-5 sm:p-6" onSubmit={async (event) => {
            event.preventDefault();
            if (submitting) return;
            setSubmitting(true);
            try {
              await updateProfile(form);
              toast.success("Profil berhasil diperbarui");
              onClose();
            } catch (error) {
              toast.error(error.response?.data?.message || "Gagal memperbarui profil");
            } finally { setSubmitting(false); }
          }}>
            <div>
              <label htmlFor="profile-name" className="mb-2 block text-sm font-semibold text-slate-700">Nama Lengkap</label>
              <input id="profile-name" className="form-input" required maxLength={100}
                value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </div>
            <div>
              <label htmlFor="profile-email" className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
              <input id="profile-email" type="email" className="form-input" required maxLength={150}
                value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            </div>
            <button disabled={submitting} className="h-11 w-full rounded-xl bg-blue-600 font-semibold text-white disabled:opacity-50">
              {submitting ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </form>
        ) : profile ? (
          <div className="p-5 sm:p-6">
            {/* AVATAR */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-3xl font-bold text-blue-700 ring-8 ring-blue-50">
                {initial}
              </div>

              <h3 className="mt-5 max-w-full wrap-break-word text-xl font-bold text-slate-950">
                {profile.name}
              </h3>

              <p className="mt-1 max-w-full break-all text-sm text-slate-500">{profile.email}</p>

              <span
                className={`mt-3 rounded-full px-3 py-1 text-xs font-semibold ${
                  profile.role === "admin"
                    ? "bg-violet-100 text-violet-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {roleLabel}
              </span>
            </div>

            {/* INFO */}
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <ProfileInfo
                icon={<UserRound size={18} />}
                label="Nama Lengkap"
                value={profile.name}
              />

              <ProfileInfo
                icon={<Mail size={18} />}
                label="Email"
                value={profile.email}
              />

              <ProfileInfo
                icon={<ShieldCheck size={18} />}
                label="Role"
                value={roleLabel}
              />

              <ProfileInfo
                icon={<ShieldCheck size={18} />}
                label="Status Akun"
                value={profile.status === "active" ? "Aktif" : "Nonaktif"}
                badge
                active={profile.status === "active"}
              />
            </div>

            {/* CREATED DATE */}
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <CalendarDays size={19} />
              </div>

              <div>
                <p className="text-xs text-slate-400">Akun Dibuat</p>

                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {profile.created_at
                    ? formatDateTime(profile.created_at)
                    : "-"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-6 h-11 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
            >
              Tutup
            </button>
          </div>
        ) : null}
        </div>
      </div>
    </div>
    </ModalPortal>
    
  ); // END MODAL
}

// ============================================================
// INFO ITEM
// ============================================================

function ProfileInfo({ icon, label, value, badge = false, active = false }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 text-blue-600">
        {icon}

        <p className="text-xs font-medium text-slate-400">{label}</p>
      </div>

      {badge ? (
        <span
          className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
            active
              ? "bg-emerald-100 text-emerald-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {value}
        </span>
      ) : (
        <p className="mt-3 wrap-break-word text-sm font-semibold text-slate-800">
          {value || "-"}
        </p>
      )}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="animate-pulse p-6">
      <div className="mx-auto h-20 w-20 rounded-full bg-slate-200" />

      <div className="mx-auto mt-5 h-5 w-36 rounded bg-slate-200" />

      <div className="mx-auto mt-3 h-4 w-52 rounded bg-slate-100" />

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-24 rounded-xl bg-slate-100" />
        ))}
      </div>
    </div>
  );
}

export default ProfileModal;
