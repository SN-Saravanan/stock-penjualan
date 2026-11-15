import ModalPortal from "../../components/ui/ModalPortal";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Boxes,
  Minus,
  Package,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import { useCallback, useEffect, useMemo, useState } from "react";

import { toast } from "sonner";

import api from "../../services/api";

import { formatDateTime, formatRupiah } from "../../utils/formatters";

// ============================================================
// ADMIN STOCK PAGE
// ============================================================

function AdminStock() {
  const [products, setProducts] = useState([]);

  const [history, setHistory] = useState([]);

  const [loadingProducts, setLoadingProducts] = useState(true);

  const [loadingHistory, setLoadingHistory] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("");

  const [historyProductFilter, setHistoryProductFilter] = useState("");

  const [historyTypeFilter, setHistoryTypeFilter] = useState("");

  const [selectedProduct, setSelectedProduct] = useState(null);

  const [updateType, setUpdateType] = useState("in");

  const [quantity, setQuantity] = useState("");

  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);

  // ==========================================================
  // FETCH PRODUCTS
  // ==========================================================

  const fetchProducts = useCallback(async () => {
    try {
      const response = await api.get("/products");

      setProducts(response.data.data || []);
      return true;
    } catch (error) {
      console.error("Fetch stock products error:", error);

      toast.error(
        error.response?.data?.message || "Gagal mengambil data produk",
      );
      return false;
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  // ==========================================================
  // FETCH HISTORY
  // ==========================================================

  const fetchHistory = useCallback(async () => {
    try {
      const params = {};

      if (historyProductFilter) {
        params.product_id = historyProductFilter;
      }

      if (historyTypeFilter) {
        params.type = historyTypeFilter;
      }

      const response = await api.get("/stock/history", {
        params,
      });

      setHistory(response.data.data || []);
      return true;
    } catch (error) {
      console.error("Fetch stock history error:", error);

      toast.error(
        error.response?.data?.message || "Gagal mengambil riwayat stok",
      );
      return false;
    } finally {
      setLoadingHistory(false);
    }
  }, [historyProductFilter, historyTypeFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // ==========================================================
  // FILTER STATE (level komponen)
  // ==========================================================

  const keyword = search.trim().toLowerCase();

  const hasProductFilter = Boolean(keyword || statusFilter);

  const activeProductFilterCount = [keyword, statusFilter].filter(
    Boolean,
  ).length;

  // ==========================================================
  // FILTERED PRODUCTS
  // ==========================================================

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        !keyword ||
        product.code?.toLowerCase().includes(keyword) ||
        product.name?.toLowerCase().includes(keyword);

      const normalizedStatus = product.stock_status?.toLowerCase();

      const matchesStatus = !statusFilter || normalizedStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [products, keyword, statusFilter]);

  // ==========================================================
  // OPEN UPDATE MODAL
  // ==========================================================

  const openStockModal = (product, type = "in") => {
    setSelectedProduct(product);

    setUpdateType(type);

    setQuantity("");

    setNotes("");
  };

  const closeStockModal = () => {
    if (submitting) {
      return;
    }

    setSelectedProduct(null);

    setQuantity("");

    setNotes("");

    setUpdateType("in");
  };

  // ==========================================================
  // UPDATE STOCK
  // ==========================================================

  const handleUpdateStock = async (event) => {
    event.preventDefault();

    if (!selectedProduct) {
      return;
    }

    const numericQuantity = Number(quantity);

    if (!Number.isInteger(numericQuantity) || numericQuantity <= 0) {
      toast.error("Jumlah stok harus lebih dari 0");

      return;
    }

    if (
      updateType === "out" &&
      numericQuantity > Number(selectedProduct.stock)
    ) {
      toast.error(
        `Stok tidak mencukupi. Stok tersedia: ${selectedProduct.stock}`,
      );

      return;
    }

    try {
      setSubmitting(true);

      const response = await api.post("/stock/update", {
        product_id: selectedProduct.id,

        type: updateType,

        quantity: numericQuantity,

        notes: notes.trim() || null,
      });

      toast.success(response.data.message || "Stok berhasil diperbarui");

      setSelectedProduct(null);
      setQuantity("");
      setNotes("");
      setUpdateType("in");

      await Promise.all([fetchProducts(), fetchHistory()]);
    } catch (error) {
      console.error("Update stock error:", error);

      toast.error(error.response?.data?.message || "Gagal memperbarui stok");
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================================
  // REFRESH
  // ==========================================================

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      const results = await Promise.all([fetchProducts(), fetchHistory()]);
      if (results.every(Boolean)) toast.success("Data stok diperbarui");
    } finally {
      setRefreshing(false);
    }
  };

  const resetProductFilter = () => {
    setSearch("");
    setStatusFilter("");
  };

  const resetHistoryFilter = () => {
    setHistoryProductFilter("");

    setHistoryTypeFilter("");
  };

  return (
    <div className="space-y-6">
      {/* ==================================================== */}
      {/* SUMMARY */}
      {/* ==================================================== */}

      <StockSummary products={products} />

      {/* ==================================================== */}
      {/* PRODUCT STOCK */}
      {/* ==================================================== */}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5 sm:p-6">
          {/* HEADER */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                  <Boxes size={20} />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-950">
                      Stok Produk
                    </h3>

                    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {filteredProducts.length} produk
                    </span>

                    {hasProductFilter && (
                      <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">
                        {activeProductFilterCount} filter aktif
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    Tambah atau kurangi stok barang.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="
          inline-flex
          h-11
          items-center
          justify-center
          gap-2

          rounded-2xl
          border
          border-slate-300
          bg-white

          px-4

          text-sm
          font-semibold
          text-slate-600

          shadow-sm

          transition-all
          duration-200

          hover:-translate-y-0.5
          hover:border-blue-200
          hover:bg-blue-50
          hover:text-blue-700
          hover:shadow-md

          active:scale-[0.98]

          disabled:cursor-not-allowed
          disabled:opacity-50
        "
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          {/* FILTERS */}
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto]">
            {/* SEARCH */}
            <div className="col-span-2 lg:col-span-1">
              <label className="mb-1.5 block text-xs font-semibold text-slate-500 lg:hidden">
                Pencarian
              </label>

              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari kode atau nama produk..."
                  className="
              h-11
              w-full
              rounded-2xl
              border
              border-slate-300
              bg-white
              pl-11
              pr-4
              text-sm
              text-slate-700
              outline-none

              transition-all
              duration-200

              placeholder:text-slate-400

              hover:border-slate-400

              focus:border-blue-500
              focus:ring-4
              focus:ring-blue-100
            "
                />
              </div>
            </div>

            {/* STATUS */}
            <div className="min-w-0">
              <label className="mb-1.5 block text-xs font-semibold text-slate-500 lg:hidden">
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="
            h-11
            w-full
            rounded-2xl
            border
            border-slate-300
            bg-white
            px-4
            text-sm
            text-slate-700
            outline-none

            transition-all
            duration-200

            hover:border-slate-400

            focus:border-blue-500
            focus:ring-4
            focus:ring-blue-100
          "
              >
                <option value="">Semua Status</option>
                <option value="tersedia">Tersedia</option>
                <option value="menipis">Menipis</option>
                <option value="habis">Habis</option>
              </select>
            </div>

            {/* RESET */}
            <div className="flex flex-col">
              <label className="mb-1.5 block text-xs font-semibold text-transparent lg:hidden">
                Reset
              </label>

              <button
                type="button"
                onClick={resetProductFilter}
                disabled={!hasProductFilter}
                className="
            flex
            h-11
            w-full
            items-center
            justify-center

            rounded-2xl
            border
            border-slate-300
            bg-white

            px-5

            text-sm
            font-semibold
            text-slate-600

            transition-all
            duration-200

            hover:border-blue-200
            hover:bg-blue-50
            hover:text-blue-600

            active:scale-[0.98]

            disabled:cursor-not-allowed
            disabled:border-slate-200
            disabled:bg-slate-50
            disabled:text-slate-300

            lg:w-auto
          "
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {loadingProducts ? (
          <TableSkeleton />
        ) : filteredProducts.length === 0 ? (
          <EmptyState text="Produk tidak ditemukan." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px]">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-4">Kode</th>

                  <th className="px-6 py-4">Produk</th>

                  <th className="px-6 py-4">Kategori</th>

                  <th className="px-6 py-4">Harga Jual</th>

                  <th className="px-6 py-4 text-center">Minimum</th>

                  <th className="px-6 py-4 text-center">Stok</th>

                  <th className="px-6 py-4">Status</th>

                  <th className="px-6 py-4 text-center">Aksi Stok</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="text-sm transition hover:bg-blue-50/30"
                  >
                    <td className="px-6 py-4">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold">
                        {product.code}
                      </span>
                    </td>

                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {product.name}
                    </td>

                    <td className="px-6 py-4 text-slate-500">
                      {product.category_name || "-"}
                    </td>

                    <td className="px-6 py-4 font-medium text-slate-700">
                      {formatRupiah(product.selling_price)}
                    </td>

                    <td className="px-6 py-4 text-center text-slate-500">
                      {product.minimum_stock}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span
                        className={
                          Number(product.stock) <= Number(product.minimum_stock)
                            ? "font-bold text-red-600"
                            : "font-bold text-slate-900"
                        }
                      >
                        {product.stock}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <StockBadge status={product.stock_status} />
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openStockModal(product, "in")}
                          className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                        >
                          <Plus size={15} />
                          Tambah
                        </button>

                        <button
                          type="button"
                          disabled={Number(product.stock) === 0}
                          onClick={() => openStockModal(product, "out")}
                          className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Minus size={15} />
                          Kurangi
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ==================================================== */}
      {/* STOCK HISTORY */}
      {/* ==================================================== */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <RefreshCw size={19} />
            </div>

            <div>
              <h3 className="font-bold text-slate-950">
                Riwayat Perubahan Stok
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Aktivitas tambah, kurang, penjualan, dan penyesuaian stok.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto]">
            {/* PRODUCT FILTER */}
            <div className="col-span-2 lg:col-span-1">
              <label className="mb-1.5 block text-xs font-semibold text-slate-500 lg:hidden">
                Produk
              </label>

              <select
                value={historyProductFilter}
                onChange={(event) =>
                  setHistoryProductFilter(event.target.value)
                }
                className="
        h-11
        w-full
        rounded-xl
        border
        border-slate-300
        bg-white
        px-4
        text-sm
        text-slate-700
        outline-none

        transition
        duration-200

        hover:border-slate-400

        focus:border-blue-500
        focus:ring-4
        focus:ring-blue-100
      "
              >
                <option value="">Semua Produk</option>

                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.code} — {product.name}
                  </option>
                ))}
              </select>
            </div>

            {/* TYPE FILTER */}
            <div className="min-w-0">
              <label className="mb-1.5 block text-xs font-semibold text-slate-500 lg:hidden">
                Jenis
              </label>

              <select
                value={historyTypeFilter}
                onChange={(event) => setHistoryTypeFilter(event.target.value)}
                className="
        h-11
        w-full
        rounded-xl
        border
        border-slate-300
        bg-white
        px-4
        text-sm
        text-slate-700
        outline-none

        transition
        duration-200

        hover:border-slate-400

        focus:border-blue-500
        focus:ring-4
        focus:ring-blue-100
      "
              >
                <option value="">Semua Jenis</option>

                <option value="in">Stok Masuk</option>

                <option value="out">Stok Keluar</option>

                <option value="sale">Penjualan</option>

                <option value="adjustment">Penyesuaian</option>
              </select>
            </div>

            {/* RESET */}
            <div className="flex flex-col">
              <label className="mb-1.5 block text-xs font-semibold text-transparent lg:hidden">
                Reset
              </label>

              <button
                type="button"
                onClick={resetHistoryFilter}
                disabled={!historyProductFilter && !historyTypeFilter}
                className="
        flex
        h-11
        w-full
        items-center
        justify-center
        rounded-xl

        border
        border-slate-300

        bg-white

        px-5

        text-sm
        font-semibold
        text-slate-600

        transition-all
        duration-200

        hover:border-blue-200
        hover:bg-blue-50
        hover:text-blue-600

        active:scale-[0.98]

        disabled:cursor-not-allowed
        disabled:border-slate-200
        disabled:bg-slate-50
        disabled:text-slate-300

        lg:w-auto
      "
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {loadingHistory ? (
          <TableSkeleton />
        ) : history.length === 0 ? (
          <EmptyState text="Belum ada riwayat stok." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px]">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-4">Waktu</th>

                  <th className="px-6 py-4">Produk</th>

                  <th className="px-6 py-4">User</th>

                  <th className="px-6 py-4">Jenis</th>

                  <th className="px-6 py-4 text-center">Jumlah</th>

                  <th className="px-6 py-4 text-center">Sebelum</th>

                  <th className="px-6 py-4 text-center">Sesudah</th>

                  <th className="px-6 py-4">Catatan</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {history.map((item) => (
                  <tr key={item.id} className="text-sm">
                    <td className="whitespace-nowrap px-6 py-4 text-xs text-slate-500">
                      {formatDateTime(item.created_at)}
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">
                        {item.product_name}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {item.product_code}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-700">
                        {item.user_name}
                      </p>

                      <p className="mt-1 text-xs capitalize text-slate-400">
                        {item.user_role}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <MovementBadge type={item.type} />
                    </td>

                    <td className="px-6 py-4 text-center font-bold">
                      {item.quantity}
                    </td>

                    <td className="px-6 py-4 text-center text-slate-500">
                      {item.stock_before}
                    </td>

                    <td className="px-6 py-4 text-center font-semibold text-slate-900">
                      {item.stock_after}
                    </td>

                    <td className="max-w-64 px-6 py-4 text-slate-500">
                      <span className="line-clamp-2">{item.notes || "-"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ==================================================== */}
      {/* UPDATE STOCK MODAL */}
      {/* ==================================================== */}

      {selectedProduct && (
        <StockUpdateModal
          product={selectedProduct}
          type={updateType}
          quantity={quantity}
          notes={notes}
          submitting={submitting}
          onTypeChange={setUpdateType}
          onQuantityChange={setQuantity}
          onNotesChange={setNotes}
          onClose={closeStockModal}
          onSubmit={handleUpdateStock}
        />
      )}
    </div>
  );
}

// ============================================================
// SUMMARY
// ============================================================

function StockSummary({ products }) {
  const summary = useMemo(() => {
    const totalProducts = products.length;

    const available = products.filter(
      (item) => item.stock_status === "Tersedia",
    ).length;

    const low = products.filter(
      (item) => item.stock_status === "Menipis",
    ).length;

    const empty = products.filter(
      (item) => item.stock_status === "Habis",
    ).length;

    return {
      totalProducts,
      available,
      low,
      empty,
    };
  }, [products]);

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <SmallSummaryCard
        icon={<Package size={22} />}
        title="Total Produk"
        value={summary.totalProducts}
        className="bg-blue-100 text-blue-600"
      />

      <SmallSummaryCard
        icon={<Boxes size={22} />}
        title="Stok Tersedia"
        value={summary.available}
        className="bg-emerald-100 text-emerald-600"
      />

      <SmallSummaryCard
        icon={<ArrowDownCircle size={22} />}
        title="Stok Menipis"
        value={summary.low}
        className="bg-amber-100 text-amber-600"
      />

      <SmallSummaryCard
        icon={<X size={22} />}
        title="Stok Habis"
        value={summary.empty}
        className="bg-red-100 text-red-600"
      />
    </section>
  );
}

function SmallSummaryCard({ icon, title, value, className }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${className}`}
      >
        {icon}
      </div>

      <div>
        <p className="text-sm text-slate-500">{title}</p>

        <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
      </div>
    </div>
  );
}

// ============================================================
// UPDATE STOCK MODAL
// ============================================================

function StockUpdateModal({
  product,
  type,
  quantity,
  notes,
  submitting,
  onTypeChange,
  onQuantityChange,
  onNotesChange,
  onClose,
  onSubmit,
}) {
  const numericQuantity = Number(quantity) || 0;

  const stockBefore = Number(product.stock);

  const stockAfter =
    type === "in"
      ? stockBefore + numericQuantity
      : Math.max(stockBefore - numericQuantity, 0);

  return (
    <ModalPortal onClose={onClose}>
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Tutup modal"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              Update Stok Barang
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {product.code} — {product.name}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
          >
            <X size={21} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6">
          {/* PRODUCT INFO */}
          <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4">
            <div>
              <p className="text-xs text-slate-400">Stok Saat Ini</p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                {product.stock}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">Minimum Stok</p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                {product.minimum_stock}
              </p>
            </div>
          </div>

          {/* TYPE */}
          <div className="mt-5">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Jenis Update
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onTypeChange("in")}
                className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                  type === "in"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-slate-300 text-slate-600"
                }`}
              >
                <ArrowUpCircle size={18} />
                Tambah Stok
              </button>

              <button
                type="button"
                disabled={Number(product.stock) === 0}
                onClick={() => onTypeChange("out")}
                className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition disabled:opacity-40 ${
                  type === "out"
                    ? "border-amber-500 bg-amber-50 text-amber-700"
                    : "border-slate-300 text-slate-600"
                }`}
              >
                <ArrowDownCircle size={18} />
                Kurangi Stok
              </button>
            </div>
          </div>

          {/* QUANTITY */}
          <div className="mt-5">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Jumlah
            </label>

            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(event) => onQuantityChange(event.target.value)}
              placeholder="Masukkan jumlah"
              className="h-11 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />

            {type === "out" && numericQuantity > stockBefore && (
              <p className="mt-2 text-xs font-medium text-red-600">
                Jumlah melebihi stok tersedia.
              </p>
            )}
          </div>

          {/* STOCK PREVIEW */}
          <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-center">
            <div>
              <p className="text-xs text-blue-500">Sebelum</p>

              <p className="mt-1 text-xl font-bold text-blue-950">
                {stockBefore}
              </p>
            </div>

            <span className="text-blue-400">→</span>

            <div>
              <p className="text-xs text-blue-500">Sesudah</p>

              <p className="mt-1 text-xl font-bold text-blue-950">
                {stockAfter}
              </p>
            </div>
          </div>

          {/* NOTES */}
          <div className="mt-5">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Catatan
            </label>

            <textarea
              rows="3"
              value={notes}
              onChange={(event) => onNotesChange(event.target.value)}
              placeholder="Contoh: Restock supplier..."
              className="w-full resize-none rounded-xl border border-slate-300 p-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={
                submitting ||
                numericQuantity <= 0 ||
                (type === "out" && numericQuantity > stockBefore)
              }
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Memproses..."
                : type === "in"
                  ? "Tambah Stok"
                  : "Kurangi Stok"}
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
}

// ============================================================
// BADGES
// ============================================================

function StockBadge({ status }) {
  const config = {
    Tersedia: "bg-emerald-100 text-emerald-700",

    Menipis: "bg-amber-100 text-amber-700",

    Habis: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        config[status] || "bg-slate-100 text-slate-600"
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
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${item.className}`}
    >
      {item.label}
    </span>
  );
}

// ============================================================
// EMPTY / SKELETON
// ============================================================

function EmptyState({ text }) {
  return (
    <div className="flex min-h-52 items-center justify-center p-8">
      <p className="text-sm text-slate-400">{text}</p>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-3 p-6">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="h-14 rounded-xl bg-slate-100" />
      ))}
    </div>
  );
}

export default AdminStock;
