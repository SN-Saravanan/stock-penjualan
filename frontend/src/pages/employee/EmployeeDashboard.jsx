import {
  AlertTriangle,
  Boxes,
  Package,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";

import { useCallback, useEffect, useState } from "react";

import { toast } from "sonner";

import api from "../../services/api";

import {
  formatDateTime,
  formatNumber,
  formatRupiah,
} from "../../utils/formatters";

function EmployeeDashboard() {
  const [dashboard, setDashboard] = useState(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  // ==========================================================
  // FETCH DASHBOARD
  // ==========================================================

  const fetchDashboard = useCallback(async (showToast = false) => {
    try {
      const response = await api.get("/dashboard/employee");

      setDashboard(response.data.data);

      if (showToast) {
        toast.success("Dashboard berhasil diperbarui");
      }
    } catch (error) {
      console.error("Employee dashboard error:", error);

      toast.error(
        error.response?.data?.message || "Gagal mengambil dashboard karyawan",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleRefresh = async () => {
    setRefreshing(true);

    await fetchDashboard(true);
  };

  if (loading) {
    return <EmployeeDashboardSkeleton />;
  }

  if (!dashboard) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <AlertTriangle size={36} className="mx-auto text-red-500" />

        <h2 className="mt-4 font-bold text-red-900">Dashboard gagal dimuat</h2>

        <p className="mt-2 text-sm text-red-600">
          Pastikan backend sedang berjalan.
        </p>
      </div>
    );
  }

  const {
    summary = {},
    products = [],
    recent_sales = [],
    recent_stock_activities = [],
  } = dashboard;

  return (
    <div className="space-y-6">
      {/* REFRESH */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm disabled:opacity-50"
        >
          <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />

          {refreshing ? "Memperbarui..." : "Refresh"}
        </button>
      </div>

      {/* SUMMARY */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          title="Total Produk"
          value={formatNumber(summary.total_products)}
          description="Produk terdaftar"
          icon={<Package size={22} />}
          theme="blue"
        />

        <DashboardCard
          title="Stok Menipis"
          value={formatNumber(summary.low_stock)}
          description={`${formatNumber(summary.out_of_stock)} produk habis`}
          icon={<Boxes size={22} />}
          theme="amber"
        />

        <DashboardCard
          title="Penjualan Hari Ini"
          value={formatRupiah(summary.today_revenue)}
          description={`${formatNumber(
            summary.today_transactions,
          )} transaksi Anda`}
          icon={<ShoppingCart size={22} />}
          theme="green"
        />

        <DashboardCard
          title="Total Penjualan Anda"
          value={formatRupiah(summary.total_revenue)}
          description={`${formatNumber(
            summary.total_transactions,
          )} total transaksi`}
          icon={<TrendingUp size={22} />}
          theme="purple"
        />
      </section>

      {/* PRODUCTS */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h3 className="font-bold text-slate-950">Daftar Produk</h3>

          <p className="mt-1 text-sm text-slate-500">
            Informasi stok dan harga produk.
          </p>
        </div>

        {products.length === 0 ? (
          <EmptyState text="Belum ada produk." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase text-slate-500">
                  <th className="px-6 py-4">Kode</th>

                  <th className="px-6 py-4">Produk</th>

                  <th className="px-6 py-4">Kategori</th>

                  <th className="px-6 py-4">Harga</th>

                  <th className="px-6 py-4 text-center">Stok</th>

                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {products.map((product) => (
                  <tr key={product.id} className="text-sm">
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-blue-700">
                      {product.code}
                    </td>

                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {product.name}
                    </td>

                    <td className="px-6 py-4 text-slate-500">
                      {product.category_name || "-"}
                    </td>

                    <td className="px-6 py-4 font-semibold">
                      {formatRupiah(product.selling_price)}
                    </td>

                    <td className="px-6 py-4 text-center font-bold">
                      {product.stock}
                    </td>

                    <td className="px-6 py-4">
                      <StockBadge status={product.stock_status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* RECENT SALES + STOCK */}
      <section className="grid gap-6 xl:grid-cols-2">
        <RecentSales sales={recent_sales} />

        <RecentStock activities={recent_stock_activities} />
      </section>
    </div>
  );
}

// ============================================================
// SUMMARY CARD
// ============================================================

function DashboardCard({ title, value, description, icon, theme }) {
  const themes = {
    blue: "bg-blue-100 text-blue-600",

    amber: "bg-amber-100 text-amber-600",

    green: "bg-emerald-100 text-emerald-600",

    purple: "bg-violet-100 text-violet-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-slate-500">{title}</p>

          <p className="mt-3 truncate text-2xl font-bold text-slate-950">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${themes[theme]}`}
        >
          {icon}
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-400">{description}</p>
    </div>
  );
}

// ============================================================
// RECENT SALES
// ============================================================

function RecentSales({ sales }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="font-bold text-slate-950">Transaksi Terbaru Anda</h3>

      <p className="mt-1 text-sm text-slate-500">Lima transaksi terakhir.</p>

      {sales.length === 0 ? (
        <EmptyState text="Belum ada transaksi." />
      ) : (
        <div className="mt-5 space-y-3">
          {sales.map((sale) => (
            <div
              key={sale.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 p-4"
            >
              <div className="min-w-0">
                <p className="truncate font-mono text-xs font-bold text-blue-700">
                  {sale.invoice_number}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {formatDateTime(sale.created_at)}
                </p>
              </div>

              <p className="shrink-0 font-bold text-emerald-600">
                {formatRupiah(sale.total_amount)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// RECENT STOCK
// ============================================================

function RecentStock({ activities }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="font-bold text-slate-950">Aktivitas Stok Anda</h3>

      <p className="mt-1 text-sm text-slate-500">
        Lima perubahan stok terbaru.
      </p>

      {activities.length === 0 ? (
        <EmptyState text="Belum ada aktivitas stok." />
      ) : (
        <div className="mt-5 space-y-3">
          {activities.map((item) => (
            <div key={item.id} className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">
                    {item.product_name}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {item.product_code}
                  </p>
                </div>

                <MovementBadge type={item.type} />
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>
                  {item.stock_before}
                  {" → "}
                  {item.stock_after}
                </span>

                <span>{formatDateTime(item.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// BADGES
// ============================================================

function StockBadge({ status }) {
  const classes = {
    Tersedia: "bg-emerald-100 text-emerald-700",

    Menipis: "bg-amber-100 text-amber-700",

    Habis: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        classes[status] || "bg-slate-100 text-slate-600"
      }`}
    >
      {status}
    </span>
  );
}

function MovementBadge({ type }) {
  const config = {
    in: {
      label: "Stok Masuk",
      className: "bg-emerald-100 text-emerald-700",
    },

    out: {
      label: "Stok Keluar",
      className: "bg-amber-100 text-amber-700",
    },

    sale: {
      label: "Penjualan",
      className: "bg-blue-100 text-blue-700",
    },

    adjustment: {
      label: "Penyesuaian",
      className: "bg-violet-100 text-violet-700",
    },
  };

  const item = config[type] || {
    label: type,
    className: "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.className}`}
    >
      {item.label}
    </span>
  );
}

function EmptyState({ text }) {
  return (
    <div className="flex min-h-32 items-center justify-center">
      <p className="text-sm text-slate-400">{text}</p>
    </div>
  );
}

function EmployeeDashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-36 rounded-2xl bg-slate-200" />
        ))}
      </div>

      <div className="h-80 rounded-2xl bg-slate-200" />

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-72 rounded-2xl bg-slate-200" />

        <div className="h-72 rounded-2xl bg-slate-200" />
      </div>
    </div>
  );
}

export default EmployeeDashboard;
