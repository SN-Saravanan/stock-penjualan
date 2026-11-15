import axios from "axios";

const TOKEN_KEY = "stock_sales_token";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api",
  timeout: 15000,

  headers: {
    "Content-Type": "application/json",
  },
});

// ============================================================
// REQUEST INTERCEPTOR
// Otomatis menambahkan JWT ke request protected
// ============================================================

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  },
);

// ============================================================
// RESPONSE INTERCEPTOR
// Token kedaluwarsa / akun dinonaktifkan (401) saat sesi berjalan:
// hapus token lalu beri tahu AuthProvider agar user diarahkan ke login.
// Login & register dikecualikan karena 401 di sana = kredensial salah.
// ============================================================

api.interceptors.response.use(
  (response) => response,

  (error) => {
    const status = error.response?.status;

    const url = error.config?.url || "";

    const isAuthAttempt =
      url.includes("/auth/login") || url.includes("/auth/register");

    const currentToken = localStorage.getItem(TOKEN_KEY);
    const requestToken = error.config?.headers?.Authorization;
    if (status === 401 && !isAuthAttempt && currentToken &&
        requestToken === `Bearer ${currentToken}`) {
      localStorage.removeItem(TOKEN_KEY);

      window.dispatchEvent(new Event("auth:unauthorized"));
    }

    return Promise.reject(error);
  },
);

export default api;
