import ModalPortal from "../../components/ui/ModalPortal";
import {
  Eye,
  Minus,
  PackageSearch,
  Plus,
  ReceiptText,
  RefreshCw,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";

import { useCallback, useEffect, useMemo, useState } from "react";

import { toast } from "sonner";

import api from "../../services/api";

import { formatDateTime, formatRupiah } from "../../utils/formatters";

// ============================================================
// EMPLOYEE SALES
// ============================================================

function EmployeeSales() {
  const [products, setProducts] = useState([]);

  const [sales, setSales] = useState([]);

  const [cart, setCart] = useState([]);

  const [search, setSearch] = useState("");

  const [loadingProducts, setLoadingProducts] = useState(true);

  const [loadingSales, setLoadingSales] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const [selectedSale, setSelectedSale] = useState(null);

  const [loadingDetail, setLoadingDetail] = useState(false);

  // ==========================================================
  // FETCH PRODUCTS
  // ==========================================================

  const fetchProducts = useCallback(async () => {
    try {
      const response = await api.get("/products");

      setProducts(response.data.data || []);
      return true;
    } catch (error) {
      console.error("Employee sales products:", error);

      toast.error(error.response?.data?.message || "Gagal mengambil produk");
      return false;
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  // ==========================================================
  // FETCH MY SALES
  // ==========================================================

  const fetchMySales = useCallback(async () => {
    try {
      const response = await api.get("/sales/my");

      setSales(response.data.data || []);
      return true;
    } catch (error) {
      console.error("Employee sales history:", error);

      toast.error(
        error.response?.data?.message || "Gagal mengambil transaksi Anda",
      );
      return false;
    } finally {
      setLoadingSales(false);
    }
  }, []);

  useEffect(() => {
    // Ambil data awal. Abaikan respons apabila effect sudah dibersihkan.
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

        console.error("Employee sales products:", error);
        toast.error(error.response?.data?.message || "Gagal mengambil produk");
      })
      .finally(() => {
        if (!ignore) {
          setLoadingProducts(false);
        }
      });

    api
      .get("/sales/my")
      .then((response) => {
        if (!ignore) {
          setSales(response.data.data || []);
        }
      })
      .catch((error) => {
        if (ignore) return;

        console.error("Employee sales history:", error);
        toast.error(
          error.response?.data?.message || "Gagal mengambil transaksi Anda",
        );
      })
      .finally(() => {
        if (!ignore) {
          setLoadingSales(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  // ==========================================================
  // SEARCH PRODUCT
  // ==========================================================

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return products;
    }

    return products.filter(
      (product) =>
        product.code?.toLowerCase().includes(keyword) ||
        product.name?.toLowerCase().includes(keyword) ||
        product.category_name?.toLowerCase().includes(keyword),
    );
  }, [products, search]);

  // ==========================================================
  // CART
  // ==========================================================

  const addToCart = (product) => {
    const stock = Number(product.stock);

    if (stock <= 0) {
      toast.error("Produk sedang habis");

      return;
    }

    const existing = cart.find((item) => item.id === product.id);

    if (existing) {
      if (existing.quantity >= stock) {
        toast.error(`Stok ${product.name} hanya ${stock}`);

        return;
      }

      setCart((previous) =>
        previous.map((item) =>
          item.id === product.id
            ? {
                ...item,

                quantity: item.quantity + 1,
              }
            : item,
        ),
      );

      return;
    }

    setCart((previous) => [
      ...previous,

      {
        id: product.id,

        code: product.code,

        name: product.name,

        price: Number(product.selling_price),

        stock: stock,

        quantity: 1,
      },
    ]);
  };

  const increaseQuantity = (productId) => {
    setCart((previous) =>
      previous.map((item) => {
        if (item.id !== productId) {
          return item;
        }

        if (item.quantity >= item.stock) {
          toast.error(`Stok ${item.name} hanya ${item.stock}`);

          return item;
        }

        return {
          ...item,

          quantity: item.quantity + 1,
        };
      }),
    );
  };

  const decreaseQuantity = (productId) => {
    setCart((previous) =>
      previous
        .map((item) =>
          item.id === productId
            ? {
                ...item,

                quantity: item.quantity - 1,
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const removeFromCart = (productId) => {
    setCart((previous) => previous.filter((item) => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // ==========================================================
  // TOTAL
  // ==========================================================

  const totalQuantity = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart],
  );

  const grandTotal = useMemo(
    () => cart.reduce((total, item) => total + item.price * item.quantity, 0),
    [cart],
  );

  // ==========================================================
  // SALE DETAIL
  // ==========================================================

  const openSaleDetail = async (saleId) => {
    try {
      setLoadingDetail(true);

      const response = await api.get(`/sales/my/${saleId}`);

      setSelectedSale(response.data.data);
    } catch (error) {
      console.error("Employee sale detail:", error);

      toast.error(
        error.response?.data?.message || "Gagal mengambil detail transaksi",
      );
    } finally {
      setLoadingDetail(false);
    }
  };

  // ==========================================================
  // PROCESS SALE
  // ==========================================================

  const processSale = async () => {
    if (cart.length === 0) {
      toast.error("Keranjang masih kosong");

      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        items: cart.map((item) => ({
          product_id: item.id,

          quantity: item.quantity,
        })),
      };

      const response = await api.post("/sales", payload);

      const result = response.data.data;

      toast.success(`Transaksi ${result?.invoice_number || ""} berhasil`);

      setCart([]);

      await Promise.all([fetchProducts(), fetchMySales()]);

      if (result?.sale_id) {
        await openSaleDetail(result.sale_id);
      }
    } catch (error) {
      console.error("Employee process sale:", error);

      toast.error(error.response?.data?.message || "Transaksi gagal diproses");

      // Update stok terbaru apabila
      // transaksi gagal karena stok berubah.
      await fetchProducts();
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
      const results = await Promise.all([fetchProducts(), fetchMySales()]);
      if (results.every(Boolean)) toast.success("Data penjualan diperbarui");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ==================================================== */}
      {/* CASHIER */}
      {/* ==================================================== */}

      <section className="grid gap-6 xl:grid-cols-[1.45fr_0.8fr]">
        {/* PRODUCTS */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-bold text-slate-950">Pilih Produk</h3>

                <p className="mt-1 text-sm text-slate-500">
                  Tambahkan barang ke transaksi penjualan.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-600 disabled:opacity-50"
              >
                <RefreshCw
                  size={17}
                  className={refreshing ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>

            <div className="relative mt-5">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari kode, nama, atau kategori..."
                className="h-11 w-full rounded-xl border border-slate-300 pl-11 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          {loadingProducts ? (
            <ProductSkeleton />
          ) : filteredProducts.length === 0 ? (
            <EmptyProducts />
          ) : (
            <div className="grid gap-4 p-5 sm:grid-cols-2 2xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={() => addToCart(product)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ================================================== */}
        {/* CART */}
        {/* ================================================== */}

        <div className="xl:sticky xl:top-24 xl:self-start">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="flex items-center gap-2 font-bold text-slate-950">
                    <ShoppingCart size={20} className="text-blue-600" />
                    Keranjang
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {totalQuantity} item dipilih
                  </p>
                </div>

                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-xs font-semibold text-red-500 hover:text-red-700"
                  >
                    Kosongkan
                  </button>
                )}
              </div>
            </div>

            {cart.length === 0 ? (
              <div className="flex min-h-72 flex-col items-center justify-center p-6 text-center">
                <ShoppingCart size={44} className="text-slate-300" />

                <p className="mt-4 font-semibold text-slate-600">
                  Keranjang Kosong
                </p>

                <p className="mt-2 max-w-xs text-sm text-slate-400">
                  Pilih produk untuk memulai transaksi.
                </p>
              </div>
            ) : (
              <>
                <div className="max-h-[430px] space-y-3 overflow-y-auto p-4">
                  {cart.map((item) => (
                    <CartItem
                      key={item.id}
                      item={item}
                      onIncrease={() => increaseQuantity(item.id)}
                      onDecrease={() => decreaseQuantity(item.id)}
                      onRemove={() => removeFromCart(item.id)}
                    />
                  ))}
                </div>

                <div className="border-t border-slate-100 p-5">
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>Total Item</span>

                    <span>{totalQuantity}</span>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-dashed border-slate-200 pt-4">
                    <span className="font-semibold text-slate-900">
                      Grand Total
                    </span>

                    <span className="text-2xl font-bold text-blue-700">
                      {formatRupiah(grandTotal)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={processSale}
                    disabled={submitting || cart.length === 0}
                    className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ShoppingCart size={19} />

                    {submitting ? "Memproses..." : "Proses Penjualan"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ==================================================== */}
      {/* MY SALES */}
      {/* ==================================================== */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div>
            <h3 className="flex items-center gap-2 font-bold text-slate-950">
              <ReceiptText size={20} className="text-blue-600" />
              Transaksi Anda
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Hanya transaksi yang dilakukan akun Anda.
            </p>
          </div>

          <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {sales.length} transaksi
          </div>
        </div>

        {loadingSales ? (
          <TableSkeleton />
        ) : sales.length === 0 ? (
          <div className="flex min-h-60 flex-col items-center justify-center">
            <ReceiptText size={40} className="text-slate-300" />

            <p className="mt-4 text-sm text-slate-400">
              Anda belum memiliki transaksi.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase text-slate-500">
                  <th className="px-6 py-4">Invoice</th>

                  <th className="px-6 py-4 text-center">Item</th>

                  <th className="px-6 py-4">Total</th>

                  <th className="px-6 py-4">Status</th>

                  <th className="px-6 py-4">Waktu</th>

                  <th className="px-6 py-4 text-center">Detail</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {sales.map((sale) => (
                  <tr key={sale.id} className="text-sm hover:bg-blue-50/30">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-blue-700">
                      {sale.invoice_number}
                    </td>

                    <td className="px-6 py-4 text-center font-semibold">
                      {sale.total_items}
                    </td>

                    <td className="px-6 py-4 font-bold text-emerald-600">
                      {formatRupiah(sale.total_amount)}
                    </td>

                    <td className="px-6 py-4">
                      <SaleStatus status={sale.status} />
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-xs text-slate-500">
                      {formatDateTime(sale.created_at)}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => openSaleDetail(sale.id)}
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

      {/* ==================================================== */}
      {/* DETAIL */}
      {/* ==================================================== */}

      {(selectedSale || loadingDetail) && (
        <SaleDetailModal
          sale={selectedSale}
          loading={loadingDetail}
          onClose={() => {
            setSelectedSale(null);

            setLoadingDetail(false);
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// PRODUCT CARD
// ============================================================

function ProductCard({ product, onAdd }) {
  const stock = Number(product.stock);

  const isEmpty = stock <= 0;

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 p-4 transition hover:border-blue-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <PackageSearch size={20} />
        </div>

        <StockBadge status={product.stock_status} />
      </div>

      <div className="mt-4 flex-1">
        <p className="font-mono text-xs font-semibold text-blue-600">
          {product.code}
        </p>

        <h4 className="mt-1 font-bold text-slate-900">{product.name}</h4>

        <p className="mt-1 text-xs text-slate-400">
          {product.category_name || "Tanpa kategori"}
        </p>
      </div>

      <div className="mt-5 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs text-slate-400">Harga</p>

          <p className="mt-1 font-bold text-slate-900">
            {formatRupiah(product.selling_price)}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Stok: <strong>{stock}</strong>
          </p>
        </div>

        <button
          type="button"
          disabled={isEmpty}
          onClick={onAdd}
          className="flex h-10 items-center gap-1 rounded-xl bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <Plus size={16} />
          Tambah
        </button>
      </div>
    </div>
  );
}

// ============================================================
// CART ITEM
// ============================================================

function CartItem({ item, onIncrease, onDecrease, onRemove }) {
  const subtotal = item.price * item.quantity;

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">{item.name}</p>

          <p className="mt-1 text-xs text-slate-400">
            {item.code}
            {" • "}
            Stok {item.stock}
          </p>
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="text-slate-300 hover:text-red-500"
        >
          <Trash2 size={17} />
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex items-center rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={onDecrease}
            className="flex h-9 w-9 items-center justify-center"
          >
            <Minus size={15} />
          </button>

          <span className="min-w-9 text-center text-sm font-bold">
            {item.quantity}
          </span>

          <button
            type="button"
            onClick={onIncrease}
            disabled={item.quantity >= item.stock}
            className="flex h-9 w-9 items-center justify-center text-blue-600 disabled:text-slate-300"
          >
            <Plus size={15} />
          </button>
        </div>

        <div className="text-right">
          <p className="text-xs text-slate-400">
            {formatRupiah(item.price)}
            {" × "}
            {item.quantity}
          </p>

          <p className="mt-1 font-bold text-blue-700">
            {formatRupiah(subtotal)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// DETAIL MODAL
// ============================================================

function SaleDetailModal({ sale, loading, onClose }) {
  return (
    <ModalPortal onClose={onClose}>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <button
          type="button"
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
        />

        <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white p-5">
            <div>
              <h2 className="text-xl font-bold text-slate-950">
                Detail Transaksi
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Invoice transaksi Anda.
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

          {loading || !sale ? (
            <div className="p-12 text-center text-sm text-slate-400">
              Memuat transaksi...
            </div>
          ) : (
            <div className="p-6">
              <div className="rounded-2xl bg-gradient-to-r from-blue-700 to-blue-500 p-6 text-white">
                <p className="text-xs uppercase text-blue-100">Invoice</p>

                <p className="mt-2 font-mono text-lg font-bold">
                  {sale.invoice_number}
                </p>

                <div className="mt-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs text-blue-100">Kasir</p>

                    <p className="mt-1 font-semibold">{sale.cashier_name}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-blue-100">Grand Total</p>

                    <p className="mt-1 text-2xl font-bold">
                      {formatRupiah(sale.total_amount)}
                    </p>
                  </div>
                </div>

                <p className="mt-5 text-xs text-blue-100">
                  {formatDateTime(sale.created_at)}
                </p>
              </div>

              <div className="mt-6">
                <h3 className="font-bold text-slate-900">Item Penjualan</h3>

                <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                  <div className="divide-y divide-slate-100">
                    {sale.items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-4 p-4"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">
                            {item.product_name}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {item.product_code}
                            {" • "}
                            {item.quantity}
                            {" × "}
                            {formatRupiah(item.price)}
                          </p>
                        </div>

                        <p className="font-bold text-slate-900">
                          {formatRupiah(item.subtotal)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between rounded-xl bg-slate-50 p-5">
                <span className="font-semibold text-slate-600">
                  Grand Total
                </span>

                <span className="text-2xl font-bold text-blue-700">
                  {formatRupiah(sale.total_amount)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </ModalPortal>
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
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        classes[status] || "bg-slate-100 text-slate-600"
      }`}
    >
      {status}
    </span>
  );
}

function SaleStatus({ status }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        status === "completed"
          ? "bg-emerald-100 text-emerald-700"
          : "bg-red-100 text-red-700"
      }`}
    >
      {status === "completed" ? "Selesai" : "Dibatalkan"}
    </span>
  );
}

function ProductSkeleton() {
  return (
    <div className="grid animate-pulse gap-4 p-5 sm:grid-cols-2 2xl:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <div key={item} className="h-48 rounded-2xl bg-slate-100" />
      ))}
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

function EmptyProducts() {
  return (
    <div className="flex min-h-60 flex-col items-center justify-center">
      <PackageSearch size={40} className="text-slate-300" />

      <p className="mt-4 text-sm text-slate-400">Produk tidak ditemukan.</p>
    </div>
  );
}

export default EmployeeSales;
