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

  // แสดงหน้า unauthorized
  if (authStatus === "unauthorized") {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        darkMode ? "bg-gray-900" : "bg-gray-50"
      }`}>
        <div className="text-center">
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className={`text-2xl font-bold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
            Access Denied
          </h2>
          <p className={`text-lg mb-6 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            คุณไม่มีสิทธิ์เข้าใช้งานระบบนี้
          </p>
          <p className={`text-sm mb-8 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            กรุณาติดต่อผู้ดูแลระบบหรือใช้บัญชีที่ได้รับอนุญาต
          </p>
          <div className="space-x-4">
            <button
              onClick={() => window.location.href = "/"}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors duration-200 font-medium"
            >
              เข้าสู่ระบบใหม่
            </button>
            <button
              onClick={() => window.location.href = "/admin/api"}
              className={`px-6 py-2 rounded-md transition-colors duration-200 font-medium ${
                darkMode 
                  ? "bg-gray-700 hover:bg-gray-600 text-white border border-gray-600" 
                  : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
              }`}
            >
              ลองใหม่
            </button>
          </div>
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