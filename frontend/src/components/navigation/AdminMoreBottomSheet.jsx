import {
  BarChart3,
  ChevronRight,
  LogOut,
  Settings,
  UserRound,
  Users,
  X,
} from "lucide-react";

import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import { toast } from "sonner";

import useAuth from "../../hooks/useAuth";

import ModalPortal from "../ui/ModalPortal";
import ProfileModal from "../header/ProfileModal";

// ============================================================
// ADMIN MORE BOTTOM SHEET
// ============================================================

function AdminMoreBottomSheet({ open, onClose }) {
  const { user, logout } = useAuth();

  const navigate = useNavigate();

  // Modal profil tetap dipasang selama bottom sheet disembunyikan.
  // Jangan memanggil onClose saat membuka profil karena parent
  // mungkin merender komponen ini secara kondisional.
  const [profileMode, setProfileMode] = useState(null);
  const showSheet = open && profileMode === null;

  const openProfile = (mode) => {
    setProfileMode(mode);
  };

  const closeProfile = () => {
    setProfileMode(null);
    onClose();
  };

  // ==========================================================
  // BODY LOCK
  // ==========================================================

  // ==========================================================
  // ESC
  // ==========================================================

  useEffect(() => {
    if (!showSheet) {
      return;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showSheet, onClose]);

  // ==========================================================
  // NAVIGATE
  // ==========================================================

  const goTo = (path) => {
    onClose();

    navigate(path);
  };

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const handleLogout = () => {
    onClose();

    logout();

    toast.success("Logout berhasil");

    navigate("/login", {
      replace: true,
    });
  };

  const initial = user?.name?.charAt(0)?.toUpperCase() || "A";

  return (
    <>
      {showSheet && (
        <ModalPortal onClose={onClose} label="Menu Lainnya">
          <div
            className="
          fixed
          inset-0
          z-110

          flex
          items-end

          lg:hidden
        "
          >
            {/* BACKDROP */}
            <button
              type="button"
              aria-label="Tutup menu lainnya"
              onClick={onClose}
              className="
            absolute
            inset-0
            bg-slate-950/40
            backdrop-blur-[2px]

            animate-[bottomSheetBackdropIn_200ms_ease-out]
          "
            />

            {/* SHEET */}
            <section
              className="
            relative
            z-10

            w-full

            rounded-t-[30px]

            border-t
            border-white/50

            bg-white/95

            px-4
            pb-[max(20px,env(safe-area-inset-bottom))]
            pt-3

            shadow-[0_-20px_60px_rgba(15,23,42,0.18)]

            backdrop-blur-2xl

            animate-[adminBottomSheetIn_320ms_cubic-bezier(0.22,1,0.36,1)]
          "
            >
              {/* HANDLE */}
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />

              {/* HEADER */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold text-slate-950">
                    Menu Lainnya
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Akses fitur Admin lainnya
                  </p>
                </div>

                <button
                  type="button"
                  aria-label="Tutup menu"
                  onClick={onClose}
                  className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                bg-slate-100
                text-slate-500
                transition
                hover:bg-slate-200
                active:scale-95
              "
                >
                  <X size={19} />
                </button>
              </div>

              {/* PROFILE CARD */}
              <div
                className="
              mt-5
              flex
              items-center
              gap-3
              rounded-2xl

              bg-linear-to-r
              from-blue-600
              to-blue-500

              p-4

              text-white

              shadow-lg
              shadow-blue-500/20
            "
              >
                <div
                  className="
                flex
                h-12
                w-12
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-white/20
                font-bold
                ring-1
                ring-white/25
              "
                >
                  {initial}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{user?.name || "Admin"}</p>

                  <p className="mt-1 truncate text-xs text-blue-100">
                    {user?.email || "Owner / Admin"}
                  </p>
                </div>

                <span
                  className="
                rounded-full
                bg-white/15
                px-2.5
                py-1
                text-[10px]
                font-semibold
              "
                >
                  Admin
                </span>
              </div>

              {/* MAIN OPTIONS */}
              <div className="mt-5 grid grid-cols-2 gap-3">
                <SheetQuickAction
                  icon={<BarChart3 size={21} />}
                  label="Laporan"
                  description="Analisis penjualan"
                  onClick={() => goTo("/admin/reports")}
                />

                <SheetQuickAction
                  icon={<Users size={21} />}
                  label="Manajemen User"
                  description="Admin & Karyawan"
                  onClick={() => goTo("/admin/users")}
                />
              </div>

              {/* MENU LIST */}
              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                <SheetMenuItem
                  icon={<UserRound size={19} />}
                  title="Profil Saya"
                  onClick={() => openProfile("view")}
                />

                <SheetMenuItem
                  icon={<Settings size={19} />}
                  title="Pengaturan Akun"
                  onClick={() => openProfile("edit")}
                />
              </div>

              {/* LOGOUT */}
              <button
                type="button"
                onClick={handleLogout}
                className="
              mt-4
              flex
              w-full
              items-center
              justify-center
              gap-2

              rounded-2xl

              bg-red-50

              px-4
              py-3.5

              text-sm
              font-semibold
              text-red-600

              transition
              duration-200

              hover:bg-red-100
              active:scale-[0.98]

              focus-visible:outline-none
              focus-visible:ring-4
              focus-visible:ring-red-100
            "
              >
                <LogOut size={18} />
                Logout
              </button>
            </section>
          </div>
        </ModalPortal>
      )}

      <ProfileModal
        open={profileMode !== null}
        initialMode={profileMode ?? "view"}
        onClose={closeProfile}
      />
    </>
  );
}

// ============================================================
// QUICK ACTION
// ============================================================

function SheetQuickAction({ icon, label, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        group
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-4
        text-left

        shadow-sm

        transition
        duration-200

        hover:-translate-y-0.5
        hover:border-blue-200
        hover:shadow-md

        active:scale-[0.98]

        focus-visible:outline-none
        focus-visible:ring-4
        focus-visible:ring-blue-100
      "
    >
      <div
        className="
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-xl
          bg-blue-50
          text-blue-600
          transition
          group-hover:bg-blue-100
        "
      >
        {icon}
      </div>

      <p className="mt-3 text-sm font-bold text-slate-900">{label}</p>

      <p className="mt-1 text-[11px] leading-4 text-slate-400">{description}</p>
    </button>
  );
}

// ============================================================
// LIST ITEM
// ============================================================

function SheetMenuItem({ icon, title, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        flex
        w-full
        items-center
        gap-3

        border-b
        border-slate-100

        px-4
        py-3.5

        text-left

        transition

        last:border-b-0

        hover:bg-slate-50
      "
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        {icon}
      </div>

      <span className="flex-1 text-sm font-semibold text-slate-700">
        {title}
      </span>

      <ChevronRight size={17} className="text-slate-300" />
    </button>
  );
}

export default AdminMoreBottomSheet;
