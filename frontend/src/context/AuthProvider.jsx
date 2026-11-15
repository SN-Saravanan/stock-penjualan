import { useEffect, useState } from "react";

import api from "../services/api";
import AuthContext from "./authContext";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);

  // ==========================================================
  // CHECK LOGIN WHEN APP STARTS
  // ==========================================================

  useEffect(() => {
    const controller = new AbortController();
    const checkAuthentication = async () => {
      const token = localStorage.getItem("stock_sales_token");

      if (!token) {
        setLoading(false);

        return;
      }

      try {
        const response = await api.get("/auth/me", { signal: controller.signal });

        if (localStorage.getItem("stock_sales_token") === token) setUser(response.data.data);
      } catch (error) {
        if (controller.signal.aborted || localStorage.getItem("stock_sales_token") !== token) return;
        console.error("Authentication check failed:", error);

        // Hanya hapus token jika memang ditolak server (401/403).
        // Server mati / jaringan putus / error 500 tidak boleh
        // membuat user ter-logout.
        const status = error.response?.status;

        if (status === 401 || status === 403) {
          localStorage.removeItem("stock_sales_token");
        }

        setUser(null);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    checkAuthentication();
    return () => controller.abort();
  }, []);

  // ==========================================================
  // SESI BERAKHIR (401 dari interceptor axios)
  // ==========================================================

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    const handleStorage = (event) => {
      if (event.key === "stock_sales_token") {
        if (!event.newValue) setUser(null);
        else window.location.reload();
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  // ==========================================================
  // LOGIN
  // ==========================================================

  const login = async (email, password) => {
    const response = await api.post("/auth/login", {
      email,
      password,
    });

    const { token, user: loggedInUser } = response.data;

    localStorage.setItem("stock_sales_token", token);

    setUser(loggedInUser);

    return loggedInUser;
  };

  // ==========================================================
  // REGISTER
  // ==========================================================

  const register = async (formData) => {
    const response = await api.post("/auth/register", formData);

    return response.data;
  };

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const logout = () => {
    localStorage.removeItem("stock_sales_token");

    setUser(null);
  };

  const updateProfile = async (form) => {
    const response = await api.patch("/auth/profile", form);
    localStorage.setItem("stock_sales_token", response.data.token);
    setUser(response.data.data);
    return response.data.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,

        isAuthenticated: Boolean(user),

        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

