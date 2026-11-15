import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserPlus,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import AuthLayout from "../../components/auth/AuthLayout";

import { useNavigate } from "react-router-dom";

import useAuth from "../../hooks/useAuth";

function Register() {
  const navigate = useNavigate();

  const { register } = useAuth();

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      toast.error("Semua field wajib diisi");

      return;
    }

    if (formData.password.length < 8 || new TextEncoder().encode(formData.password).length > 72) {
      toast.error("Password minimal 8 karakter dan maksimal 72 byte");

      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Konfirmasi password tidak sama");

      return;
    }

    try {
      setLoading(true);

      await register(formData);

      toast.success("Registrasi berhasil. Silakan login.");

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error("Register error:", error);

      toast.error(error.response?.data?.message || "Registrasi gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Buat akun dan mulai mengelola penjualan."
      description="Sistem membantu karyawan melakukan transaksi, memantau stok, dan bekerja lebih efisien dalam satu dashboard."
    >
      <div>
        <div className="mb-7">
          <span className="mb-3 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            Buat Akun Baru
          </span>

          <h2 className="text-3xl font-bold tracking-tight text-slate-950">
            Register
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Lengkapi data berikut untuk membuat akun.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* NAME */}
          <InputField
            id="name"
            name="name"
            type="text"
            label="Nama Lengkap"
            placeholder="Masukkan nama lengkap"
            value={formData.name}
            onChange={handleChange}
            icon={<UserRound size={19} />}
            autoComplete="name"
          />

          {/* EMAIL */}
          <InputField
            id="email"
            name="email"
            type="email"
            label="Email"
            placeholder="Masukkan email"
            value={formData.email}
            onChange={handleChange}
            icon={<Mail size={19} />}
            autoComplete="email"
          />

          {/* PASSWORD */}
          <PasswordField
            id="password"
            name="password"
            label="Password"
            value={formData.password}
            onChange={handleChange}
            show={showPassword}
            onToggle={() => setShowPassword((previous) => !previous)}
            autoComplete="new-password"
          />

          {/* CONFIRM */}
          <PasswordField
            id="confirmPassword"
            name="confirmPassword"
            label="Konfirmasi Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            show={showConfirmPassword}
            onToggle={() => setShowConfirmPassword((previous) => !previous)}
            autoComplete="new-password"
          />

          {/* ROLE INFO */}
          <div className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <ShieldCheck size={21} className="mt-0.5 shrink-0 text-blue-600" />

            <div>
              <p className="text-sm font-semibold text-blue-900">
                Akun Karyawan
              </p>

              <p className="mt-1 text-xs leading-5 text-blue-700">
                Registrasi publik otomatis mendapatkan role Karyawan. Role Admin
                hanya dapat dikelola oleh Owner/Admin.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Membuat akun...
              </>
            ) : (
              <>
                <UserPlus size={19} />
                Register
              </>
            )}
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-slate-500">
          Sudah mempunyai akun?{" "}
          <Link
            to="/login"
            className="font-semibold text-blue-600 transition hover:text-blue-700"
          >
            Login di sini
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

function InputField({
  id,
  name,
  type,
  label,
  placeholder,
  value,
  onChange,
  icon,
  autoComplete,
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold text-slate-700"
      >
        {label}
      </label>

      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </span>

        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-12 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />
      </div>
    </div>
  );
}

function PasswordField({
  id,
  name,
  label,
  value,
  onChange,
  show,
  onToggle,
  autoComplete,
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold text-slate-700"
      >
        {label}
      </label>

      <div className="relative">
        <LockKeyhole
          size={19}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={`Masukkan ${label.toLowerCase()}`}
          autoComplete={autoComplete}
          className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-12 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-blue-600"
          aria-label="Tampilkan atau sembunyikan password"
        >
          {show ? <EyeOff size={19} /> : <Eye size={19} />}
        </button>
      </div>
    </div>
  );
}

export default Register;
