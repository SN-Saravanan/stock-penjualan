import ModalPortal from "../../components/ui/ModalPortal";
import { Eye, Package, RefreshCw, Search, X } from "lucide-react";

import { useCallback, useEffect, useMemo, useState } from "react";

import { toast } from "sonner";

import api from "../../services/api";

import { formatRupiah } from "../../utils/formatters";

function EmployeeProducts() {
  const [products, setProducts] = useState([]);

  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");

  const [categoryFilter, setCategoryFilter] = useState("");

  const [statusFilter, setStatusFilter] = useState("");

  const [selectedProduct, setSelectedProduct] = useState(null);

  // ==========================================================
  // FETCH PRODUCTS
  // ==========================================================

  const fetchProducts = useCallback(async (showToast = false) => {
    try {
      const response = await api.get("/products");

      setProducts(response.data.data || []);

      if (showToast) {
        toast.success("Data produk diperbarui");
      }
    } catch (error) {
      console.error(error);

      toast.error(error.response?.data?.message || "Gagal mengambil produk");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch data awal secara asinkron, dengan cleanup untuk mengabaikan
  // respons request ketika komponen sudah dilepas.
  useEffect(() => {
    let ignore = false;

    api
      .get("/products")
      .then((response) => {
        if (!ignore) {
          setProducts(response.data.data || []);
        }
      })
      .catch((error) => {
        if (ignore) return;

        console.error(error);
        toast.error(error.response?.data?.message || "Gagal mengambil produk");
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    api
      .get("/categories")
      .then((response) => {
        if (!ignore) {
          setCategories(response.data.data || []);
        }
      })
      .catch((error) => {
        if (!ignore) {
          console.error(error);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  // ==========================================================
  // FILTER
  // ==========================================================

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return products.filter((product) => {
      const searchMatch =
        !keyword ||
        product.code?.toLowerCase().includes(keyword) ||
        product.name?.toLowerCase().includes(keyword);

      const categoryMatch =
        !categoryFilter ||
        String(product.category_id) === String(categoryFilter);

      const statusMatch =
        !statusFilter || product.stock_status?.toLowerCase() === statusFilter;

      return searchMatch && categoryMatch && statusMatch;
    });
  }, [products, search, categoryFilter, statusFilter]);

  const handleRefresh = async () => {
    setRefreshing(true);

    await fetchProducts(true);
  };

  const resetFilters = () => {
    setSearch("");
    setCategoryFilter("");
    setStatusFilter("");
  };

  return (
    <div className="space-y-6">
      {/* FILTER */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari kode atau nama produk..."
              className="h-11 w-full rounded-xl border border-slate-300 pl-11 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm"
          >
            <option value="">Semua Kategori</option>

            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

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

          <button
            type="button"
            onClick={resetFilters}
            className="h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-600"
          >
            Reset
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-600"
          >
            <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </section>

      {/* TABLE */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div>
            <h3 className="font-bold text-slate-950">Daftar Produk</h3>

            <p className="mt-1 text-sm text-slate-500">
              {filteredProducts.length} produk ditemukan.
            </p>
          </div>

          <Package size={23} className="text-blue-600" />
        </div>

        {loading ? (
          <ProductSkeleton />
        ) : filteredProducts.length === 0 ? (
          <EmptyProducts />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase text-slate-500">
                  <th className="px-6 py-4">No.</th>

                  <th className="px-6 py-4">Kode</th>

                  <th className="px-6 py-4">Produk</th>

                  <th className="px-6 py-4">Kategori</th>

                  <th className="px-6 py-4">Harga</th>

                  <th className="px-6 py-4 text-center">Stok</th>

                  <th className="px-6 py-4">Status</th>

                  <th className="px-6 py-4 text-center">Detail</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product, index) => (
                  <tr
                    key={product.id}
                    className="text-sm transition hover:bg-blue-50/30"
                  >
                    <td className="px-6 py-4 text-slate-500">{index + 1}</td>

                    <td className="px-6 py-4">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold text-blue-700">
                        {product.code}
                      </span>
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

                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedProduct(product)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}

// ============================================================
// DETAIL
// ============================================================

function ProductDetailModal({ product, onClose }) {
  return (
    <ModalPortal onClose={onClose}>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <button
          type="button"
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
        />

        <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 p-5">
            <div>
              <h2 className="text-xl font-bold text-slate-950">
                Detail Produk
              </h2>

              <p className="mt-1 font-mono text-xs text-blue-600">
                {product.code}
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

          <div className="space-y-5 p-6">
            <div>
              <p className="text-xs uppercase text-slate-400">Nama Produk</p>

              <p className="mt-2 text-lg font-bold text-slate-900">
                {product.name}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <DetailItem
                label="Kategori"
                value={product.category_name || "-"}
              />

              <DetailItem
                label="Harga Jual"
                value={formatRupiah(product.selling_price)}
              />

              <DetailItem label="Stok" value={product.stock} />

              <DetailItem label="Minimum Stok" value={product.minimum_stock} />
            </div>

            <div>
              <p className="text-xs uppercase text-slate-400">Status</p>

              <div className="mt-2">
                <StockBadge status={product.stock_status} />
              </div>
            </div>

            <div>
              <p className="text-xs uppercase text-slate-400">Deskripsi</p>

              <p className="mt-2 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                {product.description || "Tidak ada deskripsi."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <p className="text-xs text-slate-400">{label}</p>

      <p className="mt-2 font-semibold text-slate-800">{value}</p>
    </div>
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

function ProductSkeleton() {
  return (
    <div className="animate-pulse space-y-3 p-6">
      {[1, 2, 3, 4, 5].map((item) => (
        <div key={item} className="h-14 rounded-xl bg-slate-100" />
      ))}
    </div>
  );
}

function EmptyProducts() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center">
      <Package size={40} className="text-slate-300" />

      <p className="mt-4 text-sm text-slate-400">Produk tidak ditemukan.</p>
    </div>
  );
}

export default EmployeeProducts;
