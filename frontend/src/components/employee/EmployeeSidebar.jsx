import {
  Boxes,
  LayoutDashboard,
  LogOut,
  PackageSearch,
  ShoppingCart,
  Warehouse,
  X,
} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";

import { toast } from "sonner";

import useAuth from "../../hooks/useAuth";

const menuItems = [
  {
    name: "Dashboard Karyawan",
    path: "/karyawan/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Daftar Produk",
    path: "/karyawan/products",
    icon: PackageSearch,
  },
  {
    name: "Update Stok",
    path: "/karyawan/stock",
    icon: Warehouse,
  },
  {
    name: "Input Penjualan",
    path: "/karyawan/sales",
    icon: ShoppingCart,
  },
];

function EmployeeSidebar({ onClose }) {
  const { user, logout } = useAuth();

  const navigate = useNavigate();

  const handleLogout = () => {
    logout();

    toast.success("Logout berhasil");

    navigate("/login", {
      replace: true,
    });
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* BRAND */}
      <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
            <Boxes size={24} className="text-white" />
          </div>

          <div>
            <h1 className="text-base font-bold leading-tight text-white">
              Sistem Stok
            </h1>

            <p className="text-sm font-semibold text-blue-100">Penjualan</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-blue-100 transition hover:bg-white/10 lg:hidden"
        >
          <X size={21} />
        </button>
      </div>

      {/* MENU */}
      <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-6">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
                  isActive
                    ? "bg-blue-500 text-white shadow-lg shadow-blue-950/20"
                    : "text-blue-100 hover:bg-white/10 hover:text-white",
                ].join(" ")
              }
            >
              <Icon size={20} />

              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* PROFILE */}
      <div className="border-t border-white/10 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/10 p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
            {user?.name?.charAt(0)?.toUpperCase() || "K"}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {user?.name || "Karyawan"}
            </p>

            <p className="text-xs text-blue-200">Karyawan</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-blue-100 transition hover:bg-red-500/20 hover:text-white"
        >
          <LogOut size={19} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* DESKTOP */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-linear-to-b from-blue-950 via-blue-900 to-blue-700 lg:block">
        {sidebarContent}
      </aside>
    </>
  );
}

export default EmployeeSidebar;
