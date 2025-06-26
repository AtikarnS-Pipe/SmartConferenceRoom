import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Verify({ setAuth }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [popup, setPopup] = useState({ show: false, message: '', success: null });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPopup({ show: true, message: 'Logging in...', success: null });

    try {
      const res = await axios.post('/account/auth', formData);
      localStorage.setItem('token', res.data.token);
      setAuth(true);
      setPopup({ show: true, message: 'Login success', success: true });

      // รอ 5 วิแล้ว navigate
      setTimeout(() => {
        navigate('/login/ms');
      }, 5000);
    } catch (error) {
      console.error("Login error:", error);
      setPopup({ show: true, message: 'Login Failed', success: false });

      // ซ่อน popup หลัง 5 วิถ้า login ล้มเหลว
      setTimeout(() => {
        setPopup({ show: false, message: '', success: null });
      }, 5000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8] font-display relative">
      {/* Popup + Progress bar */}
      {popup.show && (
        <div
          className={`absolute top-4 w-full max-w-md z-10`}
        >
          <div
            className={`
              px-6 py-3 rounded-t-md shadow-lg text-white font-normal relative overflow-hidden
              ${popup.success === null ? 'bg-gray-500' :
                popup.success ? 'bg-green-500' : 'bg-red-500'}
            `}
          >
            {/* Progress bar */}
            {(popup.success !== null || loading) && (
              <div className="absolute bottom-0 left-0 w-full h-1 bg-white/30 overflow-hidden">
                <div className="h-full bg-white animate-loading-bar"></div>
              </div>
            )}
            {popup.message}
          </div>
        </div>
      )}

      <div className="bg-white shadow-xl rounded-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-[#000042] mb-6">Signin</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium text-gray-700">Email</label>
            <input
              name="email"
              type="email"
              className="w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#000042] placeholder-opacity-20"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="admin@example.com"
            />
          </div>

          <div className="mb-6">
            <label className="block mb-1 text-sm font-medium text-gray-700">Password</label>
            <input
              name="password"
              type="password"
              className="w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#000042]"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#000042] text-white py-2 px-4 rounded-md hover:bg-[#1c1c7d] transition"
            disabled={loading}
          >
            {loading ? "Loading..." : "Login"}
          </button>
        </form>
      </div>

      {/* Tailwind animation styles */}
      <style>
        {`
          @keyframes loading-bar {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .animate-loading-bar {
            animation: loading-bar 5s linear forwards;
          }
        `}
      </style>
    </div>
  );
}

export { Verify };
