// AccountLayout.jsx - ปรับปรุงแล้ว
import { useAuth } from "../Context/Authcontext";
import { useDarkMode } from "../Context/DarkModeContext";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";

export default function AccountLayout() {
  const { authStatus, isRedirecting, userData } = useAuth();
  const { darkMode } = useDarkMode();

  // แสดง loading ขณะตรวจสอบสิทธิ์
  if (authStatus === "checking" || isRedirecting) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        darkMode ? "bg-gray-900" : "bg-gray-50"
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={`transition-colors duration-300 ${
            darkMode ? "text-white" : "text-gray-600"
          }`}>
            Checking permissions...
          </p>
        </div>
      </div>
    );
  }

  // แสดง layout ปกติถ้า authorized
  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${
      darkMode ? "bg-gray-900" : "bg-gray-50"
    }`}>
      <Sidebar userData={userData} />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}