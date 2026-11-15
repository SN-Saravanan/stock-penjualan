import {
  Boxes,
  LayoutDashboard,
  MoreHorizontal,
  Package,
  ShoppingCart,
} from "lucide-react";

import { NavLink, useLocation } from "react-router-dom";

import { useState } from "react";

import AdminMoreBottomSheet from "./AdminMoreBottomSheet";

// ============================================================
// MAIN TABS
// ============================================================

const tabs = [
  {
    label: "Home",
    path: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Produk",
    path: "/admin/products",
    icon: Package,
  },
  {
    label: "Stok",
    path: "/admin/stock",
    icon: Boxes,
  },
  {
    label: "Jual",
    path: "/admin/sales",
    icon: ShoppingCart,
  },
];

// ============================================================
// ADMIN BOTTOM TAB BAR
// ============================================================

function AdminBottomTabBar() {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const moreRouteActive =
    location.pathname.startsWith("/admin/reports") ||
    location.pathname.startsWith("/admin/users");

  return (
    <>
      {/* ==================================================== */}
      {/* FLOATING BOTTOM NAV */}
      {/* ==================================================== */}

      <nav
        aria-label="Navigasi Admin"
        className="
          fixed
          bottom-[max(12px,env(safe-area-inset-bottom))]
          left-1/2
          z-[70]
          w-[calc(100%-24px)]
          max-w-md
          -translate-x-1/2

          lg:hidden
        "
      >
        {/* GLOW */}
        <div
          className="
            pointer-events-none
            absolute
            -inset-3
            -z-10
            rounded-[28px]
            bg-blue-500/10
            blur-2xl
          "
        />

        {/* BAR */}
        <div
          className="
            relative
            grid
            grid-cols-5
            items-center
            gap-1

            rounded-[24px]
            border
            border-white/60

            bg-white/90
            px-2
            py-2

            shadow-[0_16px_50px_rgba(15,23,42,0.18)]

            backdrop-blur-2xl
            supports-[backdrop-filter]:bg-white/80
          "
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;

            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                aria-label={tab.label}
                className={({ isActive }) =>
                  [
                    `
                      group
                      relative
                      flex
                      min-w-0
                      flex-col
                      items-center
                      justify-center
                      gap-1

                      rounded-[18px]
                      px-1
                      py-2

                      text-[10px]
                      font-medium

                      transition-all
                      duration-300
                      ease-out

                      focus-visible:outline-none
                      focus-visible:ring-4
                      focus-visible:ring-blue-100
                      `,
                    isActive
                      ? `
                          bg-gradient-to-b
                          from-blue-500
                          to-blue-600
                          text-white

                          shadow-lg
                          shadow-blue-500/25

                          -translate-y-1
                        `
                      : `
                          text-slate-500
                          hover:bg-blue-50
                          hover:text-blue-600
                          active:scale-95
                        `,
                  ].join(" ")
                }
              >
                {({ isActive }) => (
                  <>
                    {/* ACTIVE GLOW */}
                    {isActive && (
                      <span
                        className="
                            pointer-events-none
                            absolute
                            inset-1
                            -z-10
                            rounded-2xl
                            bg-blue-400/40
                            blur-lg
                          "
                      />
                    )}

                    <Icon
                      size={20}
                      strokeWidth={isActive ? 2.4 : 2}
                      className="
                          transition-transform
                          duration-300
                          group-active:scale-90
                        "
                    />

                    <span className="max-w-full truncate">{tab.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}

          {/* MORE */}
          <button
            type="button"
            aria-label="Buka menu lainnya"
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen(true)}
            className={`
              group
              relative
              flex
              min-w-0
              flex-col
              items-center
              justify-center
              gap-1

              rounded-[18px]
              px-1
              py-2

              text-[10px]
              font-medium

              transition-all
              duration-300
              ease-out

              focus-visible:outline-none
              focus-visible:ring-4
              focus-visible:ring-blue-100

              ${
                moreOpen || moreRouteActive
                  ? `
                    -translate-y-1
                    bg-linear-to-b
                    from-blue-500
                    to-blue-600
                    text-white
                    shadow-lg
                    shadow-blue-500/25
                  `
                  : `
                    text-slate-500
                    hover:bg-blue-50
                    hover:text-blue-600
                    active:scale-95
                  `
              }
            `}
          >
            <MoreHorizontal
              size={21}
              strokeWidth={moreOpen || moreRouteActive ? 2.5 : 2}
              className="
                transition-transform
                duration-300
                group-active:scale-90
              "
            />

            <span>Lainnya</span>
          </button>
        </div>
      </nav>

      {/* ==================================================== */}
      {/* MORE BOTTOM SHEET */}
      {/* ==================================================== */}

      <AdminMoreBottomSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
      />
    </>
  );
}

export default AdminBottomTabBar;
