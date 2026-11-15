import { Outlet } from "react-router-dom";
import EmployeeHeader from "../../components/employee/EmployeeHeader";
import EmployeeSidebar from "../../components/employee/EmployeeSidebar";
import EmployeeBottomTabBar from "../../components/navigation/EmployeeBottomTabBar";

function EmployeeLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <EmployeeSidebar />

      <div className="min-h-screen lg:pl-64">
        <EmployeeHeader />

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

      <EmployeeBottomTabBar />
    </div>
  );
}

export default EmployeeLayout;
