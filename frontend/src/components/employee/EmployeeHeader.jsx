import NotificationMenu from "../header/NotificationMenu";
import ProfileMenu from "../header/ProfileMenu";
import { useLocation } from "react-router-dom";

const pageTitles = {
  "/karyawan/dashboard": {
    title: "Dashboard Karyawan",
    subtitle: "Ringkasan aktivitas stok dan penjualan Anda",
  },

  "/karyawan/products": {
    title: "Daftar Produk",
    subtitle: "Lihat produk, harga, dan ketersediaan stok",
  },

  "/karyawan/stock": {
    title: "Update Stok",
    subtitle: "Tambah atau kurangi stok barang",
  },

  "/karyawan/sales": {
    title: "Input Penjualan",
    subtitle: "Proses transaksi penjualan",
  },
};

function EmployeeHeader() {
  const location = useLocation();

  const currentPage = pageTitles[location.pathname] || {
    title: "Sistem Stok Penjualan",
    subtitle: "Area Karyawan",
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

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <NotificationMenu />

          <div className="hidden h-9 w-px bg-slate-200 sm:block" />

          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}

export default EmployeeHeader;
