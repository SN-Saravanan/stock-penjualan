import NotificationMenu from "../header/NotificationMenu";
import ProfileMenu from "../header/ProfileMenu";
import { useLocation } from "react-router-dom";

const pageTitles = {
  "/admin/dashboard": {
    title: "Dashboard Admin",
    subtitle: "Ringkasan data stok dan penjualan toko Anda",
  },

  "/admin/products": {
    title: "Kelola Produk",
    subtitle: "Kelola data produk dan informasi barang",
  },

  "/admin/stock": {
    title: "Stok Barang",
    subtitle: "Pantau dan kelola perubahan stok barang",
  },

  "/admin/sales": {
    title: "Penjualan",
    subtitle: "Kelola transaksi dan riwayat penjualan",
  },

  "/admin/reports": {
    title: "Laporan Penjualan",
    subtitle: "Analisis performa penjualan dan pendapatan",
  },

  "/admin/users": {
    title: "Manajemen User",
    subtitle: "Kelola akun Admin dan Karyawan",
  },
};

function AdminHeader() {
  const location = useLocation();

  const currentPage = pageTitles[location.pathname] || {
    title: "Sistem Stok Penjualan",
    subtitle: "Management System",
  };

  return (
    <header
      className="
    sticky
    top-0
    z-30

    border-b
    border-slate-200/80

    bg-white/90
    backdrop-blur-xl
  "
    >
      <div
        className="
      flex
      min-h-16
      items-center
      justify-between
      gap-2

      px-3

      sm:min-h-20
      sm:px-5

      lg:px-8
    "
      >
        {/* LEFT */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="min-w-0 flex-1">
            <h1
              className="
      truncate
      text-lg
      font-bold
      text-slate-950

      sm:text-2xl
    "
            >
              {currentPage.title}
            </h1>

            <p
              className="
      mt-1
      hidden
      truncate
      text-sm
      text-slate-500

      sm:block
    "
            >
              {currentPage.subtitle}
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <NotificationMenu />

          <div className="hidden h-9 w-px bg-slate-200 sm:block" />

          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;
