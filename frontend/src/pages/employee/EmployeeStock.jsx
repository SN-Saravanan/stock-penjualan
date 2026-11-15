import ModalPortal from "../../components/ui/ModalPortal";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Minus,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import { useCallback, useEffect, useMemo, useState } from "react";

import { toast, toastPromise } from "../../utils/toast";

import api from "../../services/api";

import { formatDateTime } from "../../utils/formatters";

function EmployeeStock() {
  const [products, setProducts] = useState([]);

  const [history, setHistory] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("");

  const [historyType, setHistoryType] = useState("");

  const [selectedProduct, setSelectedProduct] = useState(null);

  const [type, setType] = useState("in");

  const [quantity, setQuantity] = useState("");

  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);

  // ==========================================================
  // FETCH
  // ==========================================================

  const fetchProducts = useCallback(async () => {
    try {
      const response = await api.get("/products");

      setProducts(response.data.data || []);
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal mengambil produk");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const params = {};

      if (historyType) {
        params.type = historyType;
      }

      const response = await api.get("/stock/my-history", {
        params,
      });

      setHistory(response.data.data || []);
      return true;
    } catch (error) {
      console.error(error);

      toast.error("Gagal mengambil riwayat stok");
      return false;
    }
  }, [historyType]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // ==========================================================
  // FILTER
  // ==========================================================

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !keyword ||
        product.code?.toLowerCase().includes(keyword) ||
        product.name?.toLowerCase().includes(keyword);

      const matchesStatus =
        !statusFilter || product.stock_status?.toLowerCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [products, search, statusFilter]);

  // ==========================================================
  // MODAL
  // ==========================================================

  const openModal = (product, updateType) => {
    setSelectedProduct(product);

    setType(updateType);

    setQuantity("");
    setNotes("");
  };

  const closeModal = () => {
    if (submitting) {
      return;
    }

    setSelectedProduct(null);

    setQuantity("");
    setNotes("");
    setType("in");
  };

  // ==========================================================
  // UPDATE STOCK
  // ==========================================================

  const submitStock = async (event) => {
    event.preventDefault();

    const number = Number(quantity);

    if (!Number.isInteger(number) || number <= 0) {
      toast.error("Jumlah stok harus lebih dari 0");

      return;
    }

    if (type === "out" && number > Number(selectedProduct.stock)) {
      toast.error(`Stok hanya ${selectedProduct.stock}`);

      return;
    }

    try {
      setSubmitting(true);

      await toastPromise(
        api.post("/stock/update", {
          product_id: selectedProduct.id,

          type,

          quantity: number,

          notes: notes.trim() || null,
        }),
        {
          loading: "Memperbarui stok...",
          success: (res) => res.data.message || "Stok berhasil diperbarui",
          error: (err) =>
            err.response?.data?.message || "Gagal memperbarui stok",
        },
      );

      setSelectedProduct(null);
      setQuantity("");
      setNotes("");
      setType("in");

      await Promise.all([fetchProducts(), fetchHistory()]);
    } catch (error) {
      console.error("Update stock error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      const results = await Promise.all([fetchProducts(), fetchHistory()]);
      if (results.every(Boolean)) toast.success("Data diperbarui");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* PRODUCT TABLE */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div>
              <h3 className="font-bold text-slate-950">Update Stok Barang</h3>

              <p className="mt-1 text-sm text-slate-500">
                Tambah atau kurangi stok sesuai aktivitas operasional.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-600"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          <div className="mt-5 flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari kode atau produk..."
                className="h-11 w-full rounded-xl border border-slate-300 pl-11 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm"
            >
              <option value="">Semua Status</option>

              <option value="tersedia">Tersedia</option>

              <option value="menipis">Menipis</option>

              <option value="habis">Habis</option>
            </select>
          </div>
        </div>

        {loading ? (
          <StockSkeleton />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-225">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase text-slate-500">
                  <th className="px-6 py-4">Kode</th>

                  <th className="px-6 py-4">Produk</th>

                  <th className="px-6 py-4">Kategori</th>

                  <th className="px-6 py-4 text-center">Minimum</th>

                  <th className="px-6 py-4 text-center">Stok</th>

                  <th className="px-6 py-4">Status</th>

                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="text-sm">
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-blue-700">
                      {product.code}
                    </td>

                    <td className="px-6 py-4 font-semibold">{product.name}</td>

                    <td className="px-6 py-4 text-slate-500">
                      {product.category_name || "-"}
                    </td>

                    <td className="px-6 py-4 text-center text-slate-500">
                      {product.minimum_stock}
                    </td>

                    <td className="px-6 py-4 text-center font-bold">
                      {product.stock}
                    </td>

                    <td className="px-6 py-4">
                      <StockBadge status={product.stock_status} />
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openModal(product, "in")}
                          className="flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"
                        >
                          <Plus size={15} />
                          Tambah
                        </button>

                        <button
                          type="button"
                          disabled={Number(product.stock) === 0}
                          onClick={() => openModal(product, "out")}
                          className="flex items-center gap-1 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 disabled:opacity-40"
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

      {/* HISTORY */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h3 className="font-bold text-slate-950">Riwayat Stok Anda</h3>

          <p className="mt-1 text-sm text-slate-500">
            Hanya perubahan stok yang dilakukan akun Anda.
          </p>

          <div className="mt-4">
            <select
              value={historyType}
              onChange={(event) => setHistoryType(event.target.value)}
              className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm"
            >
              <option value="">Semua Jenis</option>

              <option value="in">Stok Masuk</option>

              <option value="out">Stok Keluar</option>

              <option value="sale">Penjualan</option>
            </select>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="flex min-h-48 items-center justify-center text-sm text-slate-400">
            Belum ada riwayat stok.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-212.5">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase text-slate-500">
                  <th className="px-6 py-4">Waktu</th>

                  <th className="px-6 py-4">Produk</th>

                  <th className="px-6 py-4">Jenis</th>

                  <th className="px-6 py-4 text-center">Jumlah</th>

                  <th className="px-6 py-4">Perubahan</th>

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
                      <p className="font-semibold">{item.product_name}</p>

                      <p className="mt-1 font-mono text-xs text-blue-600">
                        {item.product_code}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <MovementBadge type={item.type} />
                    </td>

                    <td className="px-6 py-4 text-center font-bold">
                      {item.quantity}
                    </td>

                    <td className="px-6 py-4 text-slate-500">
                      {item.stock_before}
                      {" → "}
                      {item.stock_after}
                    </td>

                    <td className="px-6 py-4 text-slate-500">
                      {item.notes || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedProduct && (
        <StockModal
          product={selectedProduct}
          type={type}
          quantity={quantity}
          notes={notes}
          submitting={submitting}
          onTypeChange={setType}
          onQuantityChange={setQuantity}
          onNotesChange={setNotes}
          onClose={closeModal}
          onSubmit={submitStock}
        />
      )}
    </div>
  );
}

// ============================================================
// STOCK MODAL
// ============================================================

function StockModal({
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
  const number = Number(quantity) || 0;

  const before = Number(product.stock);

  const after = type === "in" ? before + number : Math.max(before - number, 0);

  return (
    <ModalPortal onClose={onClose}>
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <div>
            <h2 className="text-xl font-bold">Update Stok</h2>

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

        <form onSubmit={onSubmit} className="space-y-5 p-6">
          <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4">
            <div>
              <p className="text-xs text-slate-400">Stok Saat Ini</p>

              <p className="mt-1 text-xl font-bold">{before}</p>
            </div>

            <div>
              <p className="text-xs text-slate-400">Minimum</p>

              <p className="mt-1 text-xl font-bold">{product.minimum_stock}</p>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Jenis Update
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onTypeChange("in")}
                className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${
                  type === "in"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-slate-300 text-slate-600"
                }`}
              >
                <ArrowUpCircle size={18} />
                Tambah
              </button>

              <button
                type="button"
                onClick={() => onTypeChange("out")}
                disabled={before === 0}
                className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold disabled:opacity-40 ${
                  type === "out"
                    ? "border-amber-500 bg-amber-50 text-amber-700"
                    : "border-slate-300 text-slate-600"
                }`}
              >
                <ArrowDownCircle size={18} />
                Kurangi
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Jumlah
            </label>

            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(event) => onQuantityChange(event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />

            {type === "out" && number > before && (
              <p className="mt-2 text-xs font-semibold text-red-600">
                Jumlah melebihi stok tersedia.
              </p>
            )}
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl bg-blue-50 p-4 text-center">
            <div>
              <p className="text-xs text-blue-500">Sebelum</p>

              <p className="mt-1 text-xl font-bold text-blue-950">{before}</p>
            </div>

            <span>→</span>

            <div>
              <p className="text-xs text-blue-500">Sesudah</p>

              <p className="mt-1 text-xl font-bold text-blue-950">{after}</p>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Catatan
            </label>

            <textarea
              rows="3"
              value={notes}
              onChange={(event) => onNotesChange(event.target.value)}
              placeholder="Contoh: Restock barang..."
              className="w-full resize-none rounded-xl border border-slate-300 p-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={
                submitting || number <= 0 || (type === "out" && number > before)
              }
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {submitting ? "Memproses..." : "Update Stok"}
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
}

function StockBadge({ status }) {
  const styles = {
    Tersedia: "bg-emerald-100 text-emerald-700",
    Menipis: "bg-amber-100 text-amber-700",
    Habis: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status] || "bg-slate-100 text-slate-600"
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
  };

  const item = config[type] || {
    label: type,
    className: "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${item.className}`}
    >
      {item.label}
    </span>
  );
}

function StockSkeleton() {
  return (
    <div className="animate-pulse space-y-3 p-6">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="h-14 rounded-xl bg-slate-100" />
      ))}
    </div>
  );
}

export default EmployeeStock;
