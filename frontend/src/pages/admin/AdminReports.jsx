import {
  BarChart3,
  Download,
  PackageCheck,
  Printer,
  ReceiptText,
  RefreshCw,
  TrendingUp,
  WalletCards,
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
import { escapeCsvCell } from "../../utils/csv";

import {
  formatDateTime,
  formatNumber,
  formatRupiah,
} from "../../utils/formatters";

// ============================================================
// HELPERS
// ============================================================

const formatInputDate = (date) => {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const createInitialRange = () => {
  const end = new Date();

  const start = new Date();

  start.setDate(end.getDate() - 29);

  return {
    start_date: formatInputDate(start),

    end_date: formatInputDate(end),
  };
};

// ============================================================
// ADMIN REPORT
// ============================================================

function AdminReports() {
  const [filters, setFilters] = useState(createInitialRange);

  const [appliedFilters, setAppliedFilters] = useState(createInitialRange);

  const [report, setReport] = useState(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  // ==========================================================
  // FETCH REPORT
  // ==========================================================

  const fetchReport = useCallback(
    async (showToast = false) => {
      try {
        const response = await api.get("/reports/sales", {
          params: appliedFilters,
        });

        setReport(response.data.data);

        if (showToast) {
          toast.success("Laporan berhasil diperbarui");
        }
      } catch (error) {
        console.error("Report error:", error);

        toast.error(error.response?.data?.message || "Gagal mengambil laporan");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [appliedFilters],
  );

  useEffect(() => {
    // Abaikan respons lama saat periode laporan berubah atau komponen dilepas.
    let active = true;

    api
      .get("/reports/sales", { params: appliedFilters })
      .then((response) => {
        if (active) {
          setReport(response.data.data);
        }
      })
      .catch((error) => {
        if (!active) return;

        console.error("Report error:", error);
        toast.error(error.response?.data?.message || "Gagal mengambil laporan");
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [appliedFilters]);

  // ==========================================================
  // FILTER
  // ==========================================================

  const handleFilterSubmit = (event) => {
    event.preventDefault();

    if (!filters.start_date || !filters.end_date) {
      toast.error("Tanggal awal dan akhir wajib diisi");

      return;
    }

    if (filters.start_date > filters.end_date) {
      toast.error("Tanggal awal tidak boleh melebihi tanggal akhir");

      return;
    }

    setLoading(true);

    setAppliedFilters({
      ...filters,
    });
  };

  // ==========================================================
  // REFRESH
  // ==========================================================

  const handleRefresh = async () => {
    setRefreshing(true);

    await fetchReport(true);
  };

  // ==========================================================
  // EXPORT CSV
  // ==========================================================

  const exportCsv = () => {
    if (!report?.sales?.length) {
      toast.error("Tidak ada data untuk diexport");

      return;
    }

    const headers = [
      "Invoice",
      "Kasir",
      "Role",
      "Jumlah Item",
      "Total",
      "Status",
      "Waktu",
    ];

    const rows = report.sales.map((sale) => [
      sale.invoice_number,
      sale.cashier_name,
      sale.cashier_role,
      sale.total_items,
      sale.total_amount,
      sale.status,
      formatDateTime(sale.created_at),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsvCell).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = `laporan-penjualan-${report.period.start_date}-${report.period.end_date}.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    toast.success("Laporan CSV berhasil dibuat");
  };

  // ==========================================================
  // PRINT
  // ==========================================================

  const printReport = () => {
    window.print();
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return <ReportSkeleton />;
  }

  if (!report) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <h2 className="font-bold text-red-900">Laporan gagal dimuat</h2>

        <p className="mt-2 text-sm text-red-700">
          Pastikan backend sedang berjalan.
        </p>
      </div>
    );
  }

  const { summary, daily_sales, top_products, sales, period } = report;

  return (
    <div className="space-y-6">
      {/* ==================================================== */}
      {/* FILTER */}
      {/* ==================================================== */}

      <section className="no-print rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <form
          onSubmit={handleFilterSubmit}
          className="flex flex-col gap-4 xl:flex-row xl:items-end"
        >
          <div className="flex-1">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Tanggal Awal
            </label>

            <input
              type="date"
              value={filters.start_date}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,

                  start_date: event.target.value,
                }))
              }
              className="h-11 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="flex-1">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Tanggal Akhir
            </label>

            <input
              type="date"
              value={filters.end_date}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,

                  end_date: event.target.value,
                }))
              }
              className="h-11 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <button
            type="submit"
            className="h-11 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
          >
            Tampilkan Laporan
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            type="button"
            onClick={exportCsv}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700"
          >
            <Download size={17} />
            Export CSV
          </button>

          <button
            type="button"
            onClick={printReport}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-600"
          >
            <Printer size={17} />
            Print
          </button>
        </form>
      </section>

      {/* ==================================================== */}
      {/* PRINT AREA */}
      {/* ==================================================== */}

      <div id="sales-report-print" className="space-y-6">
        {/* REPORT HEADER */}
        <section className="hidden print:block">
          <h1 className="text-2xl font-bold">Sistem Stok Penjualan</h1>

          <h2 className="mt-2 text-xl font-semibold">Laporan Penjualan</h2>

          <p className="mt-2 text-sm">
            Periode {period.start_date} s/d {period.end_date}
          </p>
        </section>

        {/* SUMMARY */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ReportCard
            icon={<WalletCards size={22} />}
            title="Total Omzet"
            value={formatRupiah(summary.total_revenue)}
            theme="blue"
          />

          <ReportCard
            icon={<ReceiptText size={22} />}
            title="Total Transaksi"
            value={formatNumber(summary.total_transactions)}
            theme="green"
          />

          <ReportCard
            icon={<PackageCheck size={22} />}
            title="Item Terjual"
            value={formatNumber(summary.total_items)}
            theme="amber"
          />

          <ReportCard
            icon={<TrendingUp size={22} />}
            title="Rata-rata Transaksi"
            value={formatRupiah(summary.average_transaction)}
            theme="purple"
          />
        </section>

        {/* CHART + TOP PRODUCT */}
        <section className="grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
          <SalesReportChart data={daily_sales} />

          <TopProductReport products={top_products} />
        </section>

        {/* SALES TABLE */}
        <SalesReportTable sales={sales} />
      </div>
    </div>
  );
}

// ============================================================
// CARD
// ============================================================

function ReportCard({ icon, title, value, theme }) {
  const themes = {
    blue: "bg-blue-100 text-blue-600",

    green: "bg-emerald-100 text-emerald-600",

    amber: "bg-amber-100 text-amber-600",

    purple: "bg-violet-100 text-violet-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{title}</p>

          <p className="mt-3 text-2xl font-bold text-slate-950">{value}</p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${themes[theme]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CHART
// ============================================================

function SalesReportChart({ data }) {
  const chartData = data.map((item) => ({
    ...item,

    total_revenue: Number(item.total_revenue),

    label: new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
    }).format(new Date(`${item.sale_date}T00:00:00`)),
  }));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <BarChart3 size={21} className="text-blue-600" />

        <div>
          <h3 className="font-bold text-slate-950">Grafik Penjualan</h3>

          <p className="mt-1 text-sm text-slate-500">
            Omzet berdasarkan tanggal.
          </p>
        </div>
      </div>

      {chartData.length === 0 ? (
        <EmptyReport text="Belum ada transaksi pada periode ini." />
      ) : (
        <div className="mt-6 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
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

              <Tooltip formatter={(value) => [formatRupiah(value), "Omzet"]} />

              <Line
                type="monotone"
                dataKey="total_revenue"
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
      )}
    </div>
  );
}

// ============================================================
// TOP PRODUCTS
// ============================================================

function TopProductReport({ products }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="font-bold text-slate-950">Produk Terlaris</h3>

      <p className="mt-1 text-sm text-slate-500">
        Top 5 berdasarkan item terjual.
      </p>

      {products.length === 0 ? (
        <EmptyReport text="Belum ada data produk." />
      ) : (
        <div className="mt-5 space-y-3">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="flex items-center gap-4 rounded-xl bg-slate-50 p-4"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 font-bold text-blue-700">
                {index + 1}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">
                  {product.name}
                </p>

                <p className="mt-1 text-xs text-slate-400">{product.code}</p>
              </div>

              <div className="text-right">
                <p className="font-bold text-slate-900">
                  {formatNumber(product.quantity_sold)}
                </p>

                <p className="text-xs text-slate-400">terjual</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// TABLE
// ============================================================

function SalesReportTable({ sales }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-5">
        <h3 className="font-bold text-slate-950">Detail Penjualan</h3>

        <p className="mt-1 text-sm text-slate-500">
          {sales.length} transaksi ditemukan.
        </p>
      </div>

      {sales.length === 0 ? (
        <EmptyReport text="Tidak ada transaksi pada periode ini." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase text-slate-500">
                <th className="px-6 py-4">Invoice</th>

                <th className="px-6 py-4">Kasir</th>

                <th className="px-6 py-4 text-center">Item</th>

                <th className="px-6 py-4">Total</th>

                <th className="px-6 py-4">Status</th>

                <th className="px-6 py-4">Waktu</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {sales.map((sale) => (
                <tr key={sale.id} className="text-sm">
                  <td className="px-6 py-4 font-mono text-xs font-bold text-blue-700">
                    {sale.invoice_number}
                  </td>

                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-800">
                      {sale.cashier_name}
                    </p>

                    <p className="mt-1 text-xs capitalize text-slate-400">
                      {sale.cashier_role}
                    </p>
                  </td>

                  <td className="px-6 py-4 text-center font-semibold">
                    {sale.total_items}
                  </td>

                  <td className="px-6 py-4 font-bold text-emerald-600">
                    {formatRupiah(sale.total_amount)}
                  </td>

                  <td className="px-6 py-4">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Selesai
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-xs text-slate-500">
                    {formatDateTime(sale.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function EmptyReport({ text }) {
  return (
    <div className="flex min-h-44 items-center justify-center p-8 text-center">
      <p className="text-sm text-slate-400">{text}</p>
    </div>
  );
}

function ReportSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-24 rounded-2xl bg-slate-200" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-32 rounded-2xl bg-slate-200" />
        ))}
      </div>

      <div className="h-96 rounded-2xl bg-slate-200" />
    </div>
  );
}

export default AdminReports;
