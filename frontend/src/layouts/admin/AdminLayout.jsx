import { Outlet } from "react-router-dom";

import AdminHeader from "../../components/admin/AdminHeader";

import AdminSidebar from "../../components/admin/AdminSidebar";

import AdminBottomTabBar from "../../components/navigation/AdminBottomTabBar";

function AdminLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar />

      <div className="min-h-screen lg:pl-64">
        <AdminHeader />

        <main
          className="
    min-w-0
    p-3
    pb-28

    sm:p-5
    sm:pb-28

    md:p-6
    md:pb-28

    lg:p-8
    lg:pb-8
  "
        >
          <Outlet />
        </main>
      </div>

      <AdminBottomTabBar />
    </div>
  );
}

export default AdminLayout;
