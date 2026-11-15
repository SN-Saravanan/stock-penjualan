import {
  AlertTriangle,
  Bell,
  CheckCheck,
  PackageCheck,
  PackageX,
  RefreshCw,
} from "lucide-react";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import api from "../../services/api";
import useAuth from "../../hooks/useAuth";

function NotificationMenu() {
  const { user } = useAuth();
  return user ? <UserNotifications key={user.id} userId={user.id} /> : null;
}

function UserNotifications({ userId }) {
  const storageKey = `stock_sales_notifications_read_${userId}`;

  const containerRef = useRef(null);

  const [open, setOpen] = useState(false);

  const [notifications, setNotifications] = useState([]);

  const [readIds, setReadIds] = useState(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  });

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  // ==========================================================
  // LOCAL STORAGE KEY PER USER
  // ==========================================================

  // ==========================================================
  // LOAD READ STATE
  // ==========================================================

  // ==========================================================
  // FETCH NOTIFICATIONS
  // ==========================================================

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/products");

      const products = response.data.data || [];

      const result = products
        .map((product) => {
          const stock = Number(product.stock) || 0;

          const minimumStock = Number(product.minimum_stock) || 0;

          // ==============================
          // HABIS
          // ==============================

          if (stock <= 0) {
            return {
              id: `stock-out-${product.id}-${stock}`,

              productId: product.id,

              type: "out",

              title: "Stok Habis",

              message: `${product.name} (${product.code}) sudah habis.`,

              stock,

              priority: 1,
            };
          }

          // ==============================
          // MENIPIS
          // ==============================

          if (stock <= minimumStock) {
            return {
              id: `stock-low-${product.id}-${stock}`,

              productId: product.id,

              type: "low",

              title: "Stok Menipis",

              message: `${product.name} (${product.code}) tersisa ${stock}.`,

              stock,

              priority: 2,
            };
          }

          return null;
        })
        .filter(Boolean)
        .sort((a, b) => {
          if (a.priority !== b.priority) {
            return a.priority - b.priority;
          }

          return a.message.localeCompare(b.message);
        });

      setNotifications(result);
    } catch (error) {
      console.error("Fetch notifications:", error);

      setError("Notifikasi gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================================
  // FETCH SAAT APP DIMUAT
  // ==========================================================

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ==========================================================
  // REFRESH SETIAP DROPDOWN DIBUKA
  // ==========================================================

  // ==========================================================
  // UNREAD
  // ==========================================================

  const unreadNotifications = useMemo(
    () =>
      notifications.filter(
        (notification) => !readIds.includes(notification.id),
      ),
    [notifications, readIds],
  );

  const unreadCount = unreadNotifications.length;

  // ==========================================================
  // SAVE READ STATE
  // ==========================================================

  const saveReadIds = (ids) => {
    setReadIds(ids);

    if (!storageKey) {
      return;
    }

    try {
      localStorage.setItem(storageKey, JSON.stringify(ids));
    } catch (error) {
      console.error("Save notification state:", error.name);
    }
  };

  // ==========================================================
  // MARK ONE
  // ==========================================================

  const markAsRead = (notificationId) => {
    if (readIds.includes(notificationId)) {
      return;
    }

    saveReadIds([...readIds, notificationId]);
  };

  // ==========================================================
  // MARK ALL
  // ==========================================================

  const markAllAsRead = () => {
    const allIds = notifications.map((notification) => notification.id);

    saveReadIds(Array.from(new Set([...readIds, ...allIds])));
  };

  // ==========================================================
  // CLICK OUTSIDE
  // ==========================================================

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);

      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div ref={containerRef} className="relative">
      {/* BELL BUTTON */}
      <button
        type="button"
        aria-label="Buka notifikasi"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => {
          if (!open) fetchNotifications();
          setOpen((previous) => !previous);
        }}
        className="
          relative
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-xl
          border
          border-slate-200
          bg-white
          text-slate-600
          transition
          duration-200
          ease-out
          hover:border-blue-200
          hover:bg-blue-50
          hover:text-blue-600
          active:scale-95
          focus-visible:outline-none
          focus-visible:ring-4
          focus-visible:ring-blue-100
        "
      >
        <Bell size={20} />

        {/* BADGE */}
        {unreadCount > 0 && (
          <span
            className="
              absolute
              -right-1
              -top-1
              flex
              min-h-4.5
              min-w-4.5
              items-center
              justify-center
              rounded-full
              bg-blue-600
              px-1
              text-[10px]
              font-bold
              leading-none
              text-white
              ring-2
              ring-white
            "
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN */}
      {open && (
        <div
          className="
            fixed
            left-3
            right-3
            top-20
            z-80
            max-h-[min(520px,calc(100vh-100px))]
            overflow-hidden
            rounded-2xl
            border
            border-slate-200
            bg-white
            shadow-2xl
            shadow-slate-900/10

            animate-[notificationIn_220ms_ease-out]

            sm:absolute
            sm:left-auto
            sm:right-0
            sm:top-12
            sm:w-95
          "
        >
          {/* HEADER */}
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h3 className="font-bold text-slate-950">Notifikasi</h3>

              <p className="mt-1 text-xs text-slate-500">
                {unreadCount > 0
                  ? `${unreadCount} belum dibaca`
                  : "Tidak ada notifikasi baru"}
              </p>
            </div>

            <button
              type="button"
              aria-label="Perbarui notifikasi"
              onClick={fetchNotifications}
              disabled={loading}
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-xl
                text-slate-400
                transition
                hover:bg-slate-100
                hover:text-blue-600
                disabled:opacity-50
                focus-visible:outline-none
                focus-visible:ring-4
                focus-visible:ring-blue-100
              "
            >
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          {/* CONTENT */}
          <div className="max-h-92.5 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <NotificationSkeleton />
            ) : error ? (
              <div className="px-5 py-10 text-center">
                <AlertTriangle size={30} className="mx-auto text-red-400" />

                <p className="mt-3 text-sm font-medium text-red-600">{error}</p>

                <button
                  type="button"
                  onClick={fetchNotifications}
                  className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Coba lagi
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <PackageCheck size={25} />
                </div>

                <p className="mt-4 font-semibold text-slate-700">
                  Semua stok aman
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Tidak ada stok menipis atau habis.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((notification) => {
                  const isRead = readIds.includes(notification.id);

                  return (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => markAsRead(notification.id)}
                      className={`
                          relative
                          flex
                          w-full
                          gap-3
                          px-5
                          py-4
                          text-left
                          transition
                          duration-200
                          hover:bg-slate-50
                          focus-visible:outline-none
                          focus-visible:ring-2
                          focus-visible:ring-inset
                          focus-visible:ring-blue-500

                          ${!isRead ? "bg-blue-50/40" : "bg-white"}
                        `}
                    >
                      <NotificationIcon type={notification.type} />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900">
                            {notification.title}
                          </p>

                          {!isRead && (
                            <span
                              aria-label="Belum dibaca"
                              className="h-2 w-2 shrink-0 rounded-full bg-blue-600"
                            />
                          )}
                        </div>

                        <p className="mt-1 text-sm leading-5 text-slate-500">
                          {notification.message}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* FOOTER */}
          {notifications.length > 0 && (
            <div className="border-t border-slate-100 bg-slate-50/60 p-3">
              <button
                type="button"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="
                  flex
                  h-10
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  text-sm
                  font-semibold
                  text-blue-600
                  transition
                  hover:bg-blue-50
                  disabled:cursor-default
                  disabled:text-slate-400
                  focus-visible:outline-none
                  focus-visible:ring-4
                  focus-visible:ring-blue-100
                "
              >
                <CheckCheck size={17} />

                {unreadCount > 0 ? "Tandai semua dibaca" : "Semua sudah dibaca"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// ICON
// ============================================================

function NotificationIcon({ type }) {
  if (type === "out") {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
        <PackageX size={19} />
      </div>
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
      <AlertTriangle size={19} />
    </div>
  );
}

// ============================================================
// SKELETON
// ============================================================

function NotificationSkeleton() {
  return (
    <div className="animate-pulse space-y-1 p-3">
      {[1, 2, 3].map((item) => (
        <div key={item} className="flex gap-3 rounded-xl p-3">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-200" />

          <div className="flex-1 space-y-2">
            <div className="h-3 w-28 rounded bg-slate-200" />

            <div className="h-3 w-full rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default NotificationMenu;
