import {
  ChevronDown,
  KeyRound,
  LogOut,
  Settings,
  UserRound,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import useAuth from "../../hooks/useAuth";
import ProfileModal from "./ProfileModal";
import ChangePasswordModal from "./ChangePasswordModal";

// ============================================================
// PROFILE MENU
// ============================================================

function ProfileMenu() {
  const { user, logout } = useAuth();

  const navigate = useNavigate();

  const containerRef = useRef(null);

  const [open, setOpen] = useState(false);

  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const [profileInitialMode, setProfileInitialMode] = useState("view");

  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  // ==========================================================
  // ROLE DISPLAY
  // ==========================================================

  const roleLabel = user?.role === "admin" ? "Owner / Admin" : "Karyawan";

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || "U";

  // ==========================================================
  // CLICK OUTSIDE + ESC
  // ==========================================================

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);

      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // ==========================================================
  // PROFILE
  // ==========================================================

  const handleProfile = () => {
    setOpen(false);
    setProfileInitialMode("view");
    setProfileModalOpen(true);
  };

  // ==========================================================
  // SETTINGS
  // ==========================================================

  const handleSettings = () => {
    setOpen(false);
    setProfileInitialMode("edit");
    setProfileModalOpen(true);
  };

  // ==========================================================
  // CHANGE PASSWORD
  // ==========================================================

  const handleChangePassword = () => {
    setOpen(false);

    setChangePasswordOpen(true);
  };

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const handleLogout = () => {
    setOpen(false);

    logout();

    toast.success("Logout berhasil");

    navigate("/login", {
      replace: true,
    });
  };

  return (
    <>
      <div ref={containerRef} className="relative">
        {/* ==================================================== */}
        {/* PROFILE TRIGGER */}
        {/* ==================================================== */}

        <button
          type="button"
          aria-label="Buka menu profil"
          aria-haspopup="true"
          aria-expanded={open}
          onClick={() => setOpen((previous) => !previous)}
          className="
          group
          flex
          items-center
          gap-3
          rounded-xl
          px-1.5
          py-1
          text-left
          transition
          duration-200
          ease-out

          hover:bg-slate-50

          active:scale-[0.98]

          focus-visible:outline-none
          focus-visible:ring-4
          focus-visible:ring-blue-100
        "
        >
          {/* USER TEXT */}
          <div className="hidden min-w-0 text-right sm:block">
            <p className="max-w-40 truncate text-sm font-semibold text-slate-900">
              {user?.name || "User"}
            </p>

            <p className="mt-0.5 text-xs text-slate-500">{roleLabel}</p>
          </div>

          {/* AVATAR */}
          <div
            className="
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-full
            bg-blue-100
            font-bold
            text-blue-700
            transition
            duration-200

            group-hover:bg-blue-200
          "
          >
            {userInitial}
          </div>

          {/* ARROW */}
          <ChevronDown
            size={16}
            className={`
            hidden
            text-slate-400
            transition
            duration-200
            md:block

            ${open ? "rotate-180 text-blue-600" : ""}
          `}
          />
        </button>

        {/* ==================================================== */}
        {/* PROFILE DROPDOWN */}
        {/* ==================================================== */}

        {open && (
          <div
            className="
            fixed
            left-3
            right-3
            top-20
            z-85

            overflow-hidden
            rounded-2xl
            border
            border-slate-200
            bg-white

            shadow-2xl
            shadow-slate-900/10

            animate-[profileMenuIn_220ms_ease-out]

            sm:absolute
            sm:left-auto
            sm:right-0
            sm:top-14
            sm:w-[320px]
          "
          >
            {/* ================================================ */}
            {/* USER INFO */}
            {/* ================================================ */}

            <div className="border-b border-slate-100 p-5">
              <div className="flex items-center gap-3">
                <div
                  className="
                  flex
                  h-12
                  w-12
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-blue-100
                  text-lg
                  font-bold
                  text-blue-700
                "
                >
                  {userInitial}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-slate-900">
                    {user?.name || "User"}
                  </p>

                  <p className="mt-1 truncate text-xs text-slate-500">
                    {user?.email || "Email tidak tersedia"}
                  </p>

                  <span
                    className={`
                    mt-2
                    inline-flex
                    rounded-full
                    px-2.5
                    py-1
                    text-[11px]
                    font-semibold

                    ${
                      user?.role === "admin"
                        ? "bg-violet-100 text-violet-700"
                        : "bg-blue-100 text-blue-700"
                    }
                  `}
                  >
                    {roleLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* ================================================ */}
            {/* MENU */}
            {/* ================================================ */}

            <div className="p-2">
              <ProfileMenuButton
                icon={<UserRound size={18} />}
                title="Profil Saya"
                description="Lihat informasi akun"
                onClick={handleProfile}
              />

              {user?.role === "admin" && (
                <ProfileMenuButton
                  icon={<Settings size={18} />}
                  title="Pengaturan Akun"
                  description="Kelola pengaturan akun"
                  onClick={handleSettings}
                />
              )}

              <ProfileMenuButton
                icon={<KeyRound size={18} />}
                title="Ganti Password"
                description="Perbarui keamanan akun"
                onClick={handleChangePassword}
              />
            </div>

            {/* ================================================ */}
            {/* LOGOUT */}
            {/* ================================================ */}

            <div className="border-t border-slate-100 p-2">
              <button
                type="button"
                onClick={handleLogout}
                className="
                flex
                w-full
                items-center
                gap-3
                rounded-xl
                px-3
                py-3
                text-left
                transition
                duration-200

                hover:bg-red-50

                focus-visible:outline-none
                focus-visible:ring-4
                focus-visible:ring-red-100
              "
              >
                <div
                  className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  bg-red-50
                  text-red-600
                "
                >
                  <LogOut size={18} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-red-600">Logout</p>

                  <p className="mt-0.5 text-xs text-slate-400">
                    Keluar dari sistem
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
      <ProfileModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        initialMode={profileInitialMode}
      />
      {changePasswordOpen && <ChangePasswordModal
        open
        onClose={() => setChangePasswordOpen(false)}
      />}
    </>
  );
}

// ============================================================
// MENU BUTTON
// ============================================================

function ProfileMenuButton({ icon, title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        flex
        w-full
        items-center
        gap-3
        rounded-xl
        px-3
        py-3
        text-left
        transition
        duration-200

        hover:bg-slate-50

        focus-visible:outline-none
        focus-visible:ring-4
        focus-visible:ring-blue-100
      "
    >
      <div
        className="
          flex
          h-9
          w-9
          shrink-0
          items-center
          justify-center
          rounded-lg
          bg-blue-50
          text-blue-600
        "
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800">{title}</p>

        <p className="mt-0.5 text-xs text-slate-400">{description}</p>
      </div>
    </button>
  );
}

export default ProfileMenu;
