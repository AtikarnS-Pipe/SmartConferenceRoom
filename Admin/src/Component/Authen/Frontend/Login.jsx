import { useState, useEffect } from "react"; 
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import Logo from '../../../assets/Logotcc.png';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  CheckCircle,
  XCircle,
} from "lucide-react";

function Verify({ setAuth }) {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // ปรับปรุง useEffect เพื่อตรวจสอบ token ด้วย JWT decode และ redirect ถ้า token ยังไม่หมดอายุ
  useEffect(() => {
    
    // ตรวจสอบว่าเป็นผู้ใช้ที่ถูก force logout หรือไม่
    const wasForceLoggedOut = sessionStorage.getItem("forceLoggedOut");
    if (wasForceLoggedOut) {
      sessionStorage.removeItem("forceLoggedOut");
      // ล้าง token ที่อาจเหลืออยู่
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("name");
      return;
    }
    
    const checkValidToken = () => {
      const token = localStorage.getItem("token");
      
      if (!token) return false;
      
      // ตรวจสอบว่าเป็น JWT token ที่ถูกต้อง
      if (token.split('.').length !== 3) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        return false;
      }
      
      try {
        const decodedToken = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        
        // ตรวจสอบว่า token ยังไม่หมดอายุ (เพิ่ม buffer 30 วินาที)
        if (decodedToken.exp > currentTime + 30) {
          return true;
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          return false;
        }
      } catch (error) {
        console.error("❌ Login - Invalid token:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        return false;
      }
    };
    
    // เช็คว่าเป็น root path หรือไม่ (localhost:5170 หรือ localhost:5170/admin)
    const currentPath = window.location.pathname;
    const isRootAccess = currentPath === "/" || currentPath === "/admin" || currentPath === "/admin/";
    
    
    // ถ้าเป็น root access และ token ยังไม่หมดอายุ ให้ redirect ไปที่หน้า Admin
    if (isRootAccess && checkValidToken()) {
      setAuth(true);
      
      // ใช้ window.location.href เพื่อให้แน่ใจว่า redirect ทำงาน
      // path หน้าหลักคือ /admin/admin/api
      window.location.href = "/admin/admin/api";
      return;
    }
    
    // ถ้าไม่ใช่ root access หรือไม่มี valid token ให้อยู่ที่หน้า login
  }, [navigate, setAuth]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // สร้าง formData ใหม่โดยแปลง email เป็นตัวพิมพ์เล็กก่อนส่งไป backend
      const submitData = {
        ...formData,
        email: formData.email.toLowerCase()
      };
      
      const res = await axios.post("/api1/account/auth", submitData);
      
      // เก็บ token และ role
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      
      setAuth(true);
      setLoginSuccess(true);
      
      setTimeout(() => {
        navigate("/login/ms", { replace: true }); 
      }, 1000);
    } catch (error) {
      console.error("❌ Login failed:", error);
      setError("Invalid email or password");
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 4000);
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  // JSX ส่วนที่เหลือคงเดิม...
  return (
    <div className="min-h-screen flex flex-col">
      {/* Success Toast */}
      {loginSuccess && (
        <div className="fixed top-6 right-6 z-50">
          <div className="bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-slide-in">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">
              Login Successful! Redirecting...
            </span>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {showErrorToast && (
        <div className="fixed top-6 right-6 z-50">
          <div className="bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-slide-in">
            <XCircle className="w-5 h-5" />
            <span className="font-medium">Invalid email or password</span>
          </div>
        </div>
      )}

      <div className="flex flex-1">
        {/* Left Side - Logo */}
        <div className="hidden lg:flex flex-1 bg-[#0398fc] items-center justify-center p-8">
          <img
            src={Logo}
            alt="Logo"
            className="w-auto h-80 mx-auto mb-4"
          />
        </div>

        {/* Right Side - Login Form */}
        <div
          className="flex-1 lg:flex-1 relative flex items-center justify-center p-4 lg:p-8"
          style={{
            backgroundImage: `url('https://images.pexels.com/photos/273209/pexels-photo-273209.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-6 lg:p-8 w-full max-w-md mx-4 lg:mx-0">
            <div className="text-center mb-6 lg:mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">
                Admin Authentication
              </h1>
              <p className="text-gray-600 text-sm">Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2.5 lg:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50 text-gray-900 placeholder-gray-500"
                    placeholder="Enter your email address"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-10 py-2.5 lg:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50 text-gray-900 placeholder-gray-500"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || loginSuccess}
                className="w-full bg-blue-600 text-white py-2.5 lg:py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                <LogIn className="w-5 h-5 mr-2" />
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <div className="mt-4 lg:mt-6 text-center">
              <button
                onClick={handleForgotPassword}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
              >
                Forgot your password?
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes slideIn {
            0% {
              opacity: 0;
              transform: translateX(100%);
            }
            100% {
              opacity: 1;
              transform: translateX(0);
            }
          }

          .animate-slide-in {
            animation: slideIn 0.5s ease-out forwards;
          }
        `}
      </style>
    </div>
  );
}

export { Verify };