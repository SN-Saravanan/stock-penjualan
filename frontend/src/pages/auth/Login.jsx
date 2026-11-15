import { ArrowRight, Mail, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { AuthInput, AuthPasswordField } from "../../components/auth/AuthFields";
import AuthLayout from "../../components/auth/AuthLayout";
import useAuth from "../../hooks/useAuth";

function Login() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({ email: "", password: "" });

  useEffect(() => {
    if (user?.role === "admin") {
      navigate("/admin/dashboard", { replace: true });
    } else if (user?.role === "karyawan") {
      navigate("/karyawan/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    if (errorMessage) setErrorMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;

    if (!formData.email.trim() || !formData.password) {
      const message = "Email dan password wajib diisi";
      setErrorMessage(message);
      toast.error(message);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      const message = "Format email tidak valid";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      const loggedInUser = await login(
        formData.email.trim(),
        formData.password,
      );
      toast.success("Login berhasil");
      if (loggedInUser.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/karyawan/dashboard", { replace: true });
      }
    } catch (error) {
      const message =
        error.response?.data?.message || "Login gagal. Periksa koneksi server.";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Kelola stok dan penjualan dengan lebih cerdas."
      description="Pantau persediaan, transaksi, dan performa bisnis dalam satu platform modern yang terintegrasi."
    >
      <div className="auth-form-enter">
        <span className="auth-form-eyebrow">
          <span className="auth-status-dot" /> WELCOME BACK
        </span>
        <h2 className="auth-form-title">
          Selamat datang <span>kembali.</span>
        </h2>
        <p className="auth-form-description">
          Masuk ke akun Anda untuk melanjutkan pengelolaan stok dan penjualan.
        </p>

        <form
          noValidate
          onSubmit={handleSubmit}
          className="auth-form"
          aria-busy={loading}
        >
          <AuthInput
            id="login-email"
            label="Alamat email"
            icon={Mail}
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="nama@perusahaan.com"
            autoComplete="email"
            inputMode="email"
            required
          />
          <AuthPasswordField
            id="login-password"
            label="Password"
            name="password"
            show={showPassword}
            onToggle={() => setShowPassword((value) => !value)}
            value={formData.password}
            onChange={handleChange}
            placeholder="Masukkan password"
            autoComplete="current-password"
            required
          />
          {errorMessage ? (
            <div className="auth-error-banner" role="alert">
              {errorMessage}
            </div>
          ) : null}
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? (
              <>
                <span className="auth-spinner" aria-hidden="true" /> Memproses
                login...
              </>
            ) : (
              <>
                Masuk ke Dashboard <ArrowRight size={19} />
              </>
            )}
          </button>
        </form>

        <p className="auth-switch">
          Belum memiliki akun?{" "}
          <Link to="/register">
            Daftar sekarang <ArrowRight size={14} />
          </Link>
        </p>
        <div className="auth-assurance">
          <ShieldCheck size={17} /> Akses dashboard disesuaikan dengan peran
          akun
        </div>
      </div>
    </AuthLayout>
  );
}

export default Login;
