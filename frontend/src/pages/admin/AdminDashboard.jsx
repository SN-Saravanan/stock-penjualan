import {
  AlertTriangle,
  Boxes,
  Package,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";

import { useCallback, useEffect, useState } from "react";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { toast } from "sonner";

import api from "../../services/api";

import {
  formatDateTime,
  formatNumber,
  formatRupiah,
} from "../../utils/formatters";

function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  // ==========================================================
  // FETCH DASHBOARD
  // ==========================================================

  const fetchDashboard = useCallback(async (showRefreshToast = false) => {
    try {
      const response = await api.get("/dashboard/admin");

      setDashboard(response.data.data);

      if (showRefreshToast) {
        toast.success("Dashboard berhasil diperbarui");
      }
    } catch (error) {
      console.error("Dashboard error:", error);

      toast.error(
        error.response?.data?.message || "Gagal mengambil data dashboard",
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

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return <DashboardSkeleton />;
  }

  // ==========================================================
  // EMPTY / ERROR
  // ==========================================================

  if (!dashboard) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <AlertTriangle size={36} className="mx-auto text-red-500" />

        <h2 className="mt-4 text-lg font-bold text-red-900">
          Dashboard gagal dimuat
        </h2>

        <p className="mt-2 text-sm text-red-700">
          Pastikan backend dan database sedang berjalan.
        </p>

        <button
          type="button"
          onClick={() => {
            setLoading(true);
            fetchDashboard();
          }}
          className="mt-5 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const {
    summary = {},
    sales_chart = [],
    top_products = [],
    low_stock_products = [],
    recent_stock_activities = [],
    recent_sales = [],
  } = dashboard;

  return (
    <div className="space-y-6">
      {/* ==================================================== */}
      {/* TOP ACTION */}
      {/* ==================================================== */}

      <section className="flex justify-end">
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />

          {refreshing ? "Memperbarui..." : "Refresh"}
        </button>
      </section>

      {/* ==================================================== */}
      {/* SUMMARY */}
      {/* ==================================================== */}

      <section
        className="
  grid
  grid-cols-1
  gap-3

  sm:grid-cols-2
  sm:gap-4

  xl:grid-cols-4
"
      >
        <SummaryCard
          icon={<Package size={23} />}
          title="Total Produk"
          value={formatNumber(summary.total_products)}
          description={`${formatNumber(summary.out_of_stock)} produk habis`}
          variant="blue"
        />

        <SummaryCard
          icon={<AlertTriangle size={23} />}
          title="Stok Menipis"
          value={formatNumber(summary.low_stock)}
          description="Perlu perhatian stok"
          variant="red"
        />

        <SummaryCard
          icon={<ShoppingCart size={23} />}
          title="Penjualan Hari Ini"
          value={formatRupiah(summary.today_revenue)}
          description={`${formatNumber(
            summary.today_transactions,
          )} transaksi hari ini`}
          variant="green"
        />

        <SummaryCard
          icon={<Users size={23} />}
          title="Total Karyawan"
          value={formatNumber(summary.total_employees)}
          description="Karyawan aktif"
          variant="purple"
        />
      </section>

      {/* ==================================================== */}
      {/* PRODUCT + CHART */}
      {/* ==================================================== */}

      <section className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <LowStockTable products={low_stock_products} />

        <SalesChart
          data={sales_chart}
          sevenDayRevenue={summary.seven_day_revenue}
        />
      </section>

      {/* ==================================================== */}
      {/* EXTRA SUMMARY */}
      {/* ==================================================== */}

      <section className="grid gap-4 md:grid-cols-2">
        <MiniSummary
          icon={<ShoppingCart size={21} />}
          title="Total Transaksi"
          value={formatNumber(summary.total_transactions)}
        />

        <MiniSummary
          icon={<TrendingUp size={21} />}
          title="Total Pendapatan"
          value={formatRupiah(summary.total_revenue)}
        />
      </section>

      {/* ==================================================== */}
      {/* TOP PRODUCTS + RECENT SALES */}
      {/* ==================================================== */}

      <section className="grid gap-6 xl:grid-cols-2">
        <TopProducts products={top_products} />

        <RecentSales sales={recent_sales} />
      </section>

      {/* ==================================================== */}
      {/* STOCK ACTIVITIES */}
      {/* ==================================================== */}

      <RecentStockActivities activities={recent_stock_activities} />
    </div>
  );
}

// ============================================================
// SUMMARY CARD
// ============================================================

function SummaryCard({ icon, title, value, description, variant }) {
  const variants = {
    blue: "bg-blue-100 text-blue-600",

    red: "bg-red-100 text-red-600",

    green: "bg-emerald-100 text-emerald-600",

    purple: "bg-violet-100 text-violet-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div
          className="
  min-w-0
  rounded-2xl
  border
  border-slate-200
  bg-white
  p-4
  shadow-sm

  sm:p-5
"
        >
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <p className="mt-3 wrap-break-word text-xl font-bold text-slate-950 sm:text-2xl">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${variants[variant]}`}
        >
          {icon}
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-400">{description}</p>
    </div>
  );
}

// ============================================================
// LOW STOCK TABLE
// ============================================================

function LowStockTable({ products }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-5">
        <div className="flex items-center gap-3">
          <Boxes size={21} className="text-blue-600" />

          <div>
            <h3 className="font-bold text-slate-950">Stok Perlu Perhatian</h3>

            <p className="mt-1 text-sm text-slate-500">
              Produk dengan stok menipis atau habis.
            </p>
          </div>
        </div>
      </div>

      {products.length === 0 ? (
        <EmptyState text="Semua stok dalam kondisi aman." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-162.5">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-6 py-4">Kode</th>

                <th className="px-6 py-4">Produk</th>

                <th className="px-6 py-4">Kategori</th>

                <th className="px-6 py-4 text-center">Stok</th>

                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {products.map((product) => (
                <tr key={product.id} className="text-sm">
                  <td className="px-6 py-4 font-semibold text-slate-700">
                    {product.code}
                  </td>

                  <td className="px-6 py-4 font-medium text-slate-900">
                    {product.name}
                  </td>

                  <td className="px-6 py-4 text-slate-500">
                    {product.category_name || "-"}
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
    </div>
  );
}

// ============================================================
// SALES CHART
// ============================================================

function SalesChart({ data, sevenDayRevenue }) {
  const chartData = data.map((item) => ({
    ...item,

    label: new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
    }).format(new Date(`${item.date}T00:00:00`)),

    total_sales: Number(item.total_sales) || 0,
  }));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h3 className="font-bold text-slate-950">Grafik Penjualan</h3>

        <p className="mt-1 text-sm text-slate-500">Performa 7 hari terakhir.</p>
      </div>

      <div className="mt-6 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 10,
              right: 10,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />

            <XAxis
              dataKey="label"
              tick={{
                fontSize: 11,
              }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              tick={{
                fontSize: 11,
              }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${Math.round(value / 1000)}k`}
            />

            <Tooltip
              formatter={(value) => [formatRupiah(value), "Penjualan"]}
            />

            <Line
              type="monotone"
              dataKey="total_sales"
              stroke="#2563eb"
              strokeWidth={3}
              dot={{
                r: 4,
                fill: "#2563eb",
              }}
              activeDot={{
                r: 6,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-5 rounded-xl bg-blue-50 p-4">
        <p className="text-xs font-medium text-blue-700">
          Total Penjualan 7 Hari
        </p>

        <p className="mt-1 text-xl font-bold text-blue-950">
          {formatRupiah(sevenDayRevenue)}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// MINI SUMMARY
// ============================================================

function MiniSummary({ icon, title, value }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        {icon}
      </div>

      <div>
        <p className="text-sm text-slate-500">{title}</p>

        <p className="mt-1 text-xl font-bold text-slate-950">{value}</p>
      </div>
    </div>
  );
}

// ============================================================
// TOP PRODUCTS
// ============================================================

function TopProducts({ products }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="font-bold text-slate-950">Produk Terlaris</h3>

      <p className="mt-1 text-sm text-slate-500">
        Berdasarkan jumlah produk terjual.
      </p>

      {products.length === 0 ? (
        <EmptyState text="Belum ada data penjualan." />
      ) : (
        <div className="mt-5 space-y-3">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="flex items-center gap-4 rounded-xl bg-slate-50 p-4"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-sm font-bold text-blue-700">
                {index + 1}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">
                  {product.name}
                </p>

                <p className="mt-1 text-xs text-slate-500">{product.code}</p>
              </div>

              <div className="text-right">
                <p className="font-bold text-slate-900">
                  {formatNumber(product.quantity_sold)}
                </p>

                <p className="text-xs text-slate-500">terjual</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// RECENT SALES
// ============================================================

function RecentSales({ sales }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="font-bold text-slate-950">Transaksi Terbaru</h3>

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
                <p className="truncate text-sm font-semibold text-slate-900">
                  {sale.invoice_number}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {sale.cashier_name} • {formatDateTime(sale.created_at)}
                </p>
              </div>

              <p className="shrink-0 text-sm font-bold text-emerald-600">
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
// RECENT STOCK ACTIVITIES
// ============================================================

function RecentStockActivities({ activities }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="font-bold text-slate-950">Aktivitas Stok Terbaru</h3>

      <p className="mt-1 text-sm text-slate-500">
        Perubahan stok terbaru dari Admin dan Karyawan.
      </p>

      {activities.length === 0 ? (
        <EmptyState text="Belum ada aktivitas stok." />
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-187.5">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
                <th className="pb-3">Produk</th>

                <th className="pb-3">User</th>

                <th className="pb-3">Jenis</th>

                <th className="pb-3">Jumlah</th>

                <th className="pb-3">Perubahan</th>

                <th className="pb-3">Waktu</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {activities.map((activity) => (
                <tr key={activity.id} className="text-sm">
                  <td className="py-4">
                    <p className="font-semibold text-slate-900">
                      {activity.product_name}
                    </p>

                    <p className="text-xs text-slate-400">
                      {activity.product_code}
                    </p>
                  </td>

                  <td className="py-4">
                    <p className="text-slate-700">{activity.user_name}</p>

                    <p className="text-xs capitalize text-slate-400">
                      {activity.user_role}
                    </p>
                  </td>

                  <td className="py-4">
                    <MovementBadge type={activity.type} />
                  </td>

                  <td className="py-4 font-semibold">{activity.quantity}</td>

                  <td className="py-4 text-slate-500">
                    {activity.stock_before} → {activity.stock_after}
                  </td>

                  <td className="py-4 text-xs text-slate-500">
                    {formatDateTime(activity.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
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
      text: "Stok Masuk",
      className: "bg-emerald-100 text-emerald-700",
    },

    out: {
      text: "Stok Keluar",
      className: "bg-amber-100 text-amber-700",
    },

    sale: {
      text: "Penjualan",
      className: "bg-blue-100 text-blue-700",
    },

    adjustment: {
      text: "Penyesuaian",
      className: "bg-violet-100 text-violet-700",
    },
  };

  const item = config[type] || {
    text: type,
    className: "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${item.className}`}
    >
      {item.text}
    </span>
  );
}

// ============================================================
// EMPTY
// ============================================================

function EmptyState({ text }) {
  return (
    <div className="flex min-h-40 items-center justify-center">
      <p className="text-sm text-slate-400">{text}</p>
    </div>
  );
}

// ============================================================
// SKELETON
// ============================================================

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-36 rounded-2xl bg-slate-200" />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <div className="h-96 rounded-2xl bg-slate-200" />

        <div className="h-96 rounded-2xl bg-slate-200" />
      </div>
    </div>
  );
}

export default AdminDashboard;
