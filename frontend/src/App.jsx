import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminPlaceholder = lazy(() => import("./pages/admin/AdminPlaceholder"));
const EmployeeDashboard = lazy(() => import("./pages/employee/EmployeeDashboard"));
import AdminLayout from "./layouts/admin/AdminLayout";
import ProtectedRoute from "./components/routes/ProtectedRoute";
import RoleRoute from "./components/routes/RoleRoute";
import useAuth from "./hooks/useAuth";
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminStock = lazy(() => import("./pages/admin/AdminStock"));
const AdminSales = lazy(() => import("./pages/admin/AdminSales"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
import EmployeeLayout from "./layouts/employee/EmployeeLayout";
const EmployeeProducts = lazy(() => import("./pages/employee/EmployeeProducts"));
const EmployeeStock = lazy(() => import("./pages/employee/EmployeeStock"));
const EmployeeSales = lazy(() => import("./pages/employee/EmployeeSales"));

function HomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/karyawan/dashboard" replace />;
}

function App() {
  return (
    <Suspense fallback={<div role="status" className="flex min-h-screen items-center justify-center text-blue-600">Memuat halaman...</div>}>
    <Routes>
      <Route path="/" element={<HomeRedirect />} />

      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<Register />} />

      {/* ==================================================== */}
      {/* ADMIN */}
      {/* ==================================================== */}

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["admin"]}>
              <AdminLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />

        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="stock" element={<AdminStock />} />
        <Route path="sales" element={<AdminSales />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="*" element={<AdminPlaceholder />} />
      </Route>

      {/* ==================================================== */}
      {/* KARYAWAN */}
      {/* ==================================================== */}

      <Route
        path="/karyawan"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["karyawan"]}>
              <EmployeeLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<EmployeeDashboard />} />
        <Route path="products" element={<EmployeeProducts />} />
        <Route path="stock" element={<EmployeeStock />} />
        <Route path="sales" element={<EmployeeSales />} />
      </Route>

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
    </Suspense>
  );
}

export default App;
