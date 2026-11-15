import { toast } from "sonner";

/**
 * Toast Promise Helper
 * Menampilkan loading → success/error secara otomatis.
 *
 * @param {Promise} promise - Promise yang akan dijalankan
 * @param {object} messages - Pesan toast
 * @param {string} messages.loading - Pesan saat loading
 * @param {string} messages.success - Pesan saat berhasil
 * @param {string|function} messages.error - Pesan saat gagal
 * @returns {Promise} - Promise asli yang di-resolve/reject
 *
 * Contoh:
 *   await toastPromise(
 *     api.delete(`/products/${id}`),
 *     {
 *       loading: "Menghapus produk...",
 *       success: "Produk berhasil dihapus",
 *       error: (err) => err.response?.data?.message || "Gagal menghapus",
 *     }
 *   );
 */
export function toastPromise(promise, messages) {
  toast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error:
      typeof messages.error === "function"
        ? messages.error
        : () => messages.error,
  });
  return promise;
}

export { toast };
