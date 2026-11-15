import ModalPortal from "../../components/ui/ModalPortal";
import {
  Eye,
  Filter,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { useCallback, useEffect, useRef, useState } from "react";

import { toast, toastPromise } from "../../utils/toast";

import api from "../../services/api";

import { formatRupiah } from "../../utils/formatters";

const initialForm = {
  code: "",
  name: "",
  category_id: "",
  purchase_price: "",
  selling_price: "",
  stock: "",
  minimum_stock: "5",
  description: "",
};

function AdminProducts() {
  const latestProductsRequest = useRef(0);
  const [products, setProducts] = useState([]);

  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");

  const [categoryFilter, setCategoryFilter] = useState("");

  const [stockFilter, setStockFilter] = useState("");

  const [modalMode, setModalMode] = useState(null);

  const [selectedProduct, setSelectedProduct] = useState(null);

  const [deleteProduct, setDeleteProduct] = useState(null);

  const [formData, setFormData] = useState(initialForm);

  const [submitting, setSubmitting] = useState(false);

  // ==========================================================
  // FETCH CATEGORIES
  // ==========================================================

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get("/categories");

      setCategories(response.data.data || []);
    } catch (error) {
      console.error("Categories error:", error);

      toast.error("Gagal mengambil kategori");
    }
  }, []);

  // ==========================================================
  // FETCH PRODUCTS
  // ==========================================================

  const fetchProducts = useCallback(
    async (showToast = false) => {
      const requestId = ++latestProductsRequest.current;
      try {
        const params = {};

        if (search.trim()) {
          params.search = search.trim();
        }

        if (categoryFilter) {
          params.category = categoryFilter;
        }

        if (stockFilter) {
          params.stock_status = stockFilter;
        }

        const response = await api.get("/products", {
          params,
        });

        if (requestId !== latestProductsRequest.current) return;
        setProducts(response.data.data || []);

        if (showToast) {
          toast.success("Data produk diperbarui");
        }
      } catch (error) {
        if (requestId !== latestProductsRequest.current) return;
        console.error("Products error:", error);

        toast.error(error.response?.data?.message || "Gagal mengambil produk");
      } finally {
        if (requestId === latestProductsRequest.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [search, categoryFilter, stockFilter],
  );

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Sedikit debounce untuk search
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchProducts();
    }, 350);

    return () => {
      clearTimeout(timeout);
    };
  }, [fetchProducts]);

  // ==========================================================
  // FORM
  // ==========================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const openCreateModal = () => {
    setSelectedProduct(null);

    setFormData(initialForm);

    setModalMode("create");
  };

  const openDetailModal = (product) => {
    setSelectedProduct(product);

    setModalMode("detail");
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);

    setFormData({
      code: product.code || "",

      name: product.name || "",

      category_id: product.category_id ? String(product.category_id) : "",

      purchase_price: product.purchase_price ?? "",

      selling_price: product.selling_price ?? "",

      // Update stock tidak dilakukan
      // lewat edit produk.
      stock: product.stock || 0,

      minimum_stock: product.minimum_stock ?? 5,

      description: product.description || "",
    });

    setModalMode("edit");
  };

  const closeModal = () => {
    if (submitting) {
      return;
    }

    setModalMode(null);
    setSelectedProduct(null);
    setFormData(initialForm);
  };

  // ==========================================================
  // CREATE / UPDATE
  // ==========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !formData.code.trim() ||
      !formData.name.trim() ||
      !formData.category_id ||
      formData.purchase_price === "" ||
      formData.selling_price === ""
    ) {
      toast.error("Lengkapi data produk wajib");

      return;
    }

    if (
      Number(formData.purchase_price) < 0 ||
      Number(formData.selling_price) < 0 ||
      Number(formData.minimum_stock) < 0
    ) {
      toast.error("Harga dan stok minimum tidak boleh negatif");

      return;
    }

    try {
      setSubmitting(true);

      if (modalMode === "create") {
        await toastPromise(
          api.post("/products", {
            code: formData.code,

            name: formData.name,

            category_id: Number(formData.category_id),

            purchase_price: Number(formData.purchase_price),

            selling_price: Number(formData.selling_price),

            stock: Number(formData.stock || 0),

            minimum_stock: Number(formData.minimum_stock || 0),

            description: formData.description,
          }),
          {
            loading: "Menyimpan produk...",
            success: "Produk berhasil ditambahkan",
            error: (err) =>
              err.response?.data?.message || "Gagal menyimpan produk",
          },
        );
      }

      if (modalMode === "edit") {
        await toastPromise(
          api.put(`/products/${selectedProduct.id}`, {
            code: formData.code,

            name: formData.name,

            category_id: Number(formData.category_id),

            purchase_price: Number(formData.purchase_price),

            selling_price: Number(formData.selling_price),

            minimum_stock: Number(formData.minimum_stock),

            description: formData.description,
          }),
          {
            loading: "Menyimpan perubahan...",
            success: "Produk berhasil diubah",
            error: (err) =>
              err.response?.data?.message || "Gagal menyimpan produk",
          },
        );
      }

      setModalMode(null);
      setSelectedProduct(null);
      setFormData(initialForm);

      await fetchProducts();
    } catch (error) {
      console.error("Save product error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================================
  // DELETE
  // ==========================================================

  const confirmDelete = async () => {
    if (!deleteProduct) {
      return;
    }

    try {
      setSubmitting(true);

      await toastPromise(api.delete(`/products/${deleteProduct.id}`), {
        loading: "Menghapus produk...",
        success: "Produk berhasil dihapus",
        error: (err) =>
          err.response?.data?.message || "Produk gagal dihapus",
      });

      setDeleteProduct(null);

      await fetchProducts();
    } catch (error) {
      console.error("Delete product error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================================
  // RESET FILTER
  // ==========================================================

  const resetFilters = () => {
    setSearch("");
    setCategoryFilter("");
    setStockFilter("");
  };

  // ==========================================================
  // REFRESH
  // ==========================================================

  const handleRefresh = async () => {
    setRefreshing(true);

    await fetchProducts(true);
  };

  return (
    <div className="space-y-6">
      {/* ==================================================== */}
      {/* ACTION BAR */}
      {/* ==================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 flex-col gap-3 md:flex-row">
            {/* SEARCH */}
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari kode atau nama produk..."
                className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            {/* CATEGORY */}
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="">Semua Kategori</option>

              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            {/* STATUS */}
            <select
              value={stockFilter}
              onChange={(event) => setStockFilter(event.target.value)}
              className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="">Semua Status</option>

              <option value="tersedia">Tersedia</option>

              <option value="menipis">Menipis</option>

              <option value="habis">Habis</option>
            </select>

            <button
              type="button"
              onClick={resetFilters}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <Filter size={17} />
              Reset
            </button>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex h-11 items-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
            >
              <Plus size={18} />
              Tambah Produk
            </button>
          </div>
        </div>
      </section>

      {/* ==================================================== */}
      {/* TABLE */}
      {/* ==================================================== */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h3 className="font-bold text-slate-950">Daftar Produk</h3>

            <p className="mt-1 text-sm text-slate-500">
              {formatNumberLocal(products.length)} produk ditemukan
            </p>
          </div>

          <Package size={24} className="text-blue-600" />
        </div>

        {loading ? (
          <ProductTableSkeleton />
        ) : products.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
            <Package size={42} className="text-slate-300" />

            <h4 className="mt-4 font-bold text-slate-700">
              Produk tidak ditemukan
            </h4>

            <p className="mt-2 text-sm text-slate-400">
              Coba ubah pencarian atau filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-4">No.</th>

                  <th className="px-6 py-4">Kode</th>

                  <th className="px-6 py-4">Nama Produk</th>

                  <th className="px-6 py-4">Kategori</th>

                  <th className="px-6 py-4">Harga Beli</th>

                  <th className="px-6 py-4">Harga Jual</th>

                  <th className="px-6 py-4 text-center">Stok</th>

                  <th className="px-6 py-4">Status</th>

                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {products.map((product, index) => (
                  <tr
                    key={product.id}
                    className="text-sm transition hover:bg-blue-50/30"
                  >
                    <td className="px-6 py-4 text-slate-500">{index + 1}</td>

                    <td className="px-6 py-4">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700">
                        {product.code}
                      </span>
                    </td>

                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {product.name}
                    </td>

                    <td className="px-6 py-4 text-slate-500">
                      {product.category_name || "-"}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {formatRupiah(product.purchase_price)}
                    </td>

                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {formatRupiah(product.selling_price)}
                    </td>

                    <td className="px-6 py-4 text-center font-bold">
                      {product.stock}
                    </td>

                    <td className="px-6 py-4">
                      <StockBadge status={product.stock_status} />
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <ActionButton
                          title="Detail"
                          variant="blue"
                          onClick={() => openDetailModal(product)}
                        >
                          <Eye size={16} />
                        </ActionButton>

                        <ActionButton
                          title="Edit"
                          variant="amber"
                          onClick={() => openEditModal(product)}
                        >
                          <Pencil size={16} />
                        </ActionButton>

                        <ActionButton
                          title="Hapus"
                          variant="red"
                          onClick={() => setDeleteProduct(product)}
                        >
                          <Trash2 size={16} />
                        </ActionButton>
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
      {/* CREATE / EDIT / DETAIL MODAL */}
      {/* ==================================================== */}

      {modalMode && (
        <ProductModal
          mode={modalMode}
          product={selectedProduct}
          categories={categories}
          formData={formData}
          onChange={handleChange}
          onClose={closeModal}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      )}

      {/* ==================================================== */}
      {/* DELETE CONFIRMATION */}
      {/* ==================================================== */}

      {deleteProduct && (
        <DeleteModal
          product={deleteProduct}
          loading={submitting}
          onCancel={() => setDeleteProduct(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

// ============================================================
// PRODUCT MODAL
// ============================================================

function ProductModal({
  mode,
  product,
  categories,
  formData,
  onChange,
  onClose,
  onSubmit,
  submitting,
}) {
  const isDetail = mode === "detail";

  const isEdit = mode === "edit";

  const title =
    mode === "create"
      ? "Tambah Produk"
      : mode === "edit"
        ? "Edit Produk"
        : "Detail Produk";

  return (
    <ModalWrapper onClose={onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-950">{title}</h2>

            <p className="mt-1 text-sm text-slate-500">
              {isDetail
                ? "Informasi lengkap produk."
                : "Lengkapi informasi produk."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={21} />
          </button>
        </div>

        {isDetail ? (
          <ProductDetail product={product} />
        ) : (
          <form onSubmit={onSubmit} className="p-6">
            <div className="grid gap-5 md:grid-cols-2">
              <FormField label="Kode Barang" required>
                <input
                  name="code"
                  value={formData.code}
                  onChange={onChange}
                  placeholder="Contoh: BRG006"
                  className="form-input"
                />
              </FormField>

              <FormField label="Nama Produk" required>
                <input
                  name="name"
                  value={formData.name}
                  onChange={onChange}
                  placeholder="Nama produk"
                  className="form-input"
                />
              </FormField>

              <FormField label="Kategori" required>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={onChange}
                  className="form-input"
                >
                  <option value="">Pilih kategori</option>

                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Minimum Stok" required>
                <input
                  type="number"
                  min="0"
                  name="minimum_stock"
                  value={formData.minimum_stock}
                  onChange={onChange}
                  className="form-input"
                />
              </FormField>

              <FormField label="Harga Beli" required>
                <input
                  type="number"
                  min="0"
                  name="purchase_price"
                  step="0.01"
                  value={formData.purchase_price}
                  onChange={onChange}
                  placeholder="0"
                  className="form-input"
                />
              </FormField>

              <FormField label="Harga Jual" required>
                <input
                  type="number"
                  min="0"
                  name="selling_price"
                  step="0.01"
                  value={formData.selling_price}
                  onChange={onChange}
                  placeholder="0"
                  className="form-input"
                />
              </FormField>

              {mode === "create" && (
                <FormField label="Stok Awal">
                  <input
                    type="number"
                    min="0"
                    name="stock"
                    value={formData.stock}
                    onChange={onChange}
                    placeholder="0"
                    className="form-input"
                  />
                </FormField>
              )}

              {isEdit && (
                <FormField label="Stok Saat Ini">
                  <input
                    value={formData.stock}
                    disabled
                    className="form-input cursor-not-allowed bg-slate-100"
                  />

                  <p className="mt-1 text-xs text-slate-400">
                    Stok diubah melalui menu Stok Barang.
                  </p>
                </FormField>
              )}
            </div>

            <FormField label="Deskripsi" className="mt-5">
              <textarea
                name="description"
                value={formData.description}
                onChange={onChange}
                rows="4"
                placeholder="Deskripsi produk..."
                className="form-input min-h-28 resize-none py-3"
              />
            </FormField>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting
                  ? "Menyimpan..."
                  : isEdit
                    ? "Simpan Perubahan"
                    : "Tambah Produk"}
              </button>
            </div>
          </form>
        )}
      </div>
    </ModalWrapper>
  );
}

// ============================================================
// DETAIL
// ============================================================

function ProductDetail({ product }) {
  if (!product) {
    return null;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4 rounded-2xl bg-blue-50 p-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-white">
          <Package size={26} />
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-950">{product.name}</h3>

          <p className="mt-1 font-mono text-sm text-blue-600">{product.code}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <DetailItem label="Kategori" value={product.category_name || "-"} />

        <DetailItem label="Status" value={product.stock_status} />

        <DetailItem
          label="Harga Beli"
          value={formatRupiah(product.purchase_price)}
        />

        <DetailItem
          label="Harga Jual"
          value={formatRupiah(product.selling_price)}
        />

        <DetailItem label="Stok" value={product.stock} />

        <DetailItem label="Minimum Stok" value={product.minimum_stock} />
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Deskripsi
        </p>

        <p className="mt-2 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          {product.description || "Tidak ada deskripsi."}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// DELETE MODAL
// ============================================================

function DeleteModal({ product, loading, onCancel, onConfirm }) {
  return (
    <ModalWrapper onClose={onCancel}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
          <Trash2 size={25} />
        </div>

        <div className="mt-5 text-center">
          <h2 className="text-xl font-bold text-slate-950">Hapus Produk?</h2>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Produk <strong className="text-slate-700">{product.name}</strong>{" "}
            akan dihapus secara permanen.
          </p>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-600"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Menghapus..." : "Ya, Hapus"}
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}

// ============================================================
// SHARED SMALL COMPONENTS
// ============================================================

function ModalWrapper({ children, onClose }) {
  return (
    <ModalPortal onClose={onClose}>
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Tutup modal"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="modal-wrapper relative z-10 flex w-full justify-center">
        {children}
      </div>
    </div>
    </ModalPortal>
  );
}

function FormField({ label, required, children, className = "" }) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}

        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      {children}
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <p className="text-xs font-medium text-slate-400">{label}</p>

      <p className="mt-2 font-semibold text-slate-800">{value}</p>
    </div>
  );
}

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

function ActionButton({ children, title, variant, onClick }) {
  const variants = {
    blue: "bg-blue-50 text-blue-600 hover:bg-blue-100",

    amber: "bg-amber-50 text-amber-600 hover:bg-amber-100",

    red: "bg-red-50 text-red-600 hover:bg-red-100",
  };

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${variants[variant]}`}
    >
      {children}
    </button>
  );
}

function ProductTableSkeleton() {
  return (
    <div className="animate-pulse space-y-3 p-6">
      {[1, 2, 3, 4, 5].map((item) => (
        <div key={item} className="h-14 rounded-xl bg-slate-100" />
      ))}
    </div>
  );
}

function formatNumberLocal(value) {
  return new Intl.NumberFormat("id-ID").format(Number(value) || 0);
}

export default AdminProducts;
