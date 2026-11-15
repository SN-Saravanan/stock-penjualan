import { Navigate } from "react-router-dom";

import useAuth from "../../hooks/useAuth";

function RoleRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  if (!allowedRoles.includes(user.role)) {
    if (user.role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }

    if (user.role === "karyawan") {
      return <Navigate to="/karyawan/dashboard" replace />;
    }

    return <Navigate to="/login" replace />;
  }

  return children;
}

export default RoleRoute;
