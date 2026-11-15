import {
  Boxes,
  LayoutDashboard,
  PackageSearch,
  ShoppingCart,
} from "lucide-react";

import { NavLink } from "react-router-dom";

// ============================================================
// EMPLOYEE NAVIGATION
// ============================================================

const tabs = [
  {
    label: "Home",
    path: "/karyawan/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Produk",
    path: "/karyawan/products",
    icon: PackageSearch,
  },
  {
    label: "Stok",
    path: "/karyawan/stock",
    icon: Boxes,
  },
  {
    label: "Jual",
    path: "/karyawan/sales",
    icon: ShoppingCart,
  },
];

// ============================================================
// EMPLOYEE BOTTOM TAB BAR
// ============================================================

function EmployeeBottomTabBar() {
  return (
    <nav
      aria-label="Navigasi Karyawan"
      className="
        fixed
        bottom-[max(12px,env(safe-area-inset-bottom))]
        left-1/2
        z-[70]

        w-[calc(100%-24px)]
        max-w-[430px]

        -translate-x-1/2

        lg:hidden
      "
    >
      {/* ==================================================== */}
      {/* OUTER GLOW */}
      {/* ==================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          -inset-3
          -z-10

          rounded-[30px]

          bg-blue-500/10

          blur-2xl
        "
      />

      {/* ==================================================== */}
      {/* FLOATING BAR */}
      {/* ==================================================== */}

      <div
        className="
          relative

          grid
          grid-cols-4
          items-center
          gap-1.5

          rounded-[26px]

          border
          border-white/70

          bg-white/90

          px-2
          py-2

          shadow-[0_18px_55px_rgba(15,23,42,0.18)]

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

                    gap-1.5

                    rounded-[19px]

                    px-2
                    py-2.5

                    text-[10px]
                    font-semibold

                    transition-all
                    duration-300
                    ease-out

                    focus-visible:outline-none
                    focus-visible:ring-4
                    focus-visible:ring-blue-100
                    `,

                  isActive
                    ? `
                        -translate-y-1

                        bg-gradient-to-b
                        from-blue-500
                        to-blue-600

                        text-white

                        shadow-[0_8px_22px_rgba(37,99,235,0.28)]
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
                  {/* ACTIVE BACK GLOW */}

                  {isActive && (
                    <span
                      className="
                          pointer-events-none

                          absolute
                          inset-1
                          -z-10

                          rounded-2xl

                          bg-blue-400/40

                          blur-xl
                        "
                    />
                  )}

                  {/* ICON AREA */}

                  <div
                    className={`
                        relative

                        flex
                        h-7
                        w-7
                        items-center
                        justify-center

                        rounded-xl

                        transition-all
                        duration-300

                        ${
                          isActive
                            ? `
                              bg-white/15
                              scale-105
                            `
                            : `
                              group-hover:bg-blue-100/70
                            `
                        }
                      `}
                  >
                    <Icon
                      size={20}
                      strokeWidth={isActive ? 2.5 : 2}
                      className="
                          transition-transform
                          duration-300

                          group-active:scale-90
                        "
                    />
                  </div>

                  {/* LABEL */}

                  <span className="max-w-full truncate">{tab.label}</span>

                  {/* ACTIVE DOT */}

                  {isActive && (
                    <span
                      className="
                          absolute
                          -bottom-[3px]

                          h-1
                          w-5

                          rounded-full

                          bg-white/90

                          shadow-sm

                          animate-[employeeTabIndicator_280ms_ease-out]
                        "
                    />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

export default EmployeeBottomTabBar;
