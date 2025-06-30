import { useState } from "react";
import { useNavigate } from "react-router-dom";
import bgImage from '../../../assets/pic.jpg'; // ปรับ path ตามจริง
import axios from "axios";
import { RiLockPasswordLine } from "react-icons/ri";

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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPopup({ show: true, message: 'Logging in...', success: null });

    try {
      const res = await axios.post('/account/auth', formData);
      localStorage.setItem('token', res.data.token);
      setAuth(true);
      setPopup({ show: true, message: 'Login successful', success: true });

      setTimeout(() => {
        navigate('/admin/api');
      }, 5000);
    } catch (error) {
      console.error("Login error:", error);
      setPopup({ show: true, message: 'Login failed', success: false });

      setTimeout(() => {
        setPopup({ show: false, message: '', success: null });
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-display relative">
      {/* Popup */}
      {popup.show && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 w-full max-w-md z-50">
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

      {/* Left side */}
      <div className="w-1/2 bg-gray-200 flex items-center justify-center p-10">
        <div className="text-center">
          <h1 className="text-4xl font-semibold text-gray-700 mb-2 tracking-widest">T C C</h1>
          <div className="w-20 h-0.5 bg-gray-400 mx-auto mb-2" />
          <h2 className="text-xl text-[#2f3f9f] tracking-widest">TECHNOLOGY</h2>
        </div>
      </div>

      {/* Right side */}
      <div
        className="w-1/2 relative bg-cover bg-center flex items-center justify-center"
        style={{
          backgroundImage: `url(${bgImage})`,
        }}
      >
        <div className="bg-white bg-opacity-90 p-8 rounded-xl shadow-xl w-full max-w-md z-10">
          <div className="flex flex-col items-center mb-6">
            <div className="bg-[#e2e8f0] p-3 rounded-full">
              <RiLockPasswordLine className="w-7 h-6 text-[#000042]" />
            </div>
            <h2 className="text-xl font-bold text-[#000042] mt-4">Admin Authentication</h2>
            <p className="text-sm text-gray-600 mt-1">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block mb-1 text-sm font-medium text-gray-700">Email Address</label>
              <input
                name="email"
                type="email"
                className="w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#000042]"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email address"
              />
            </div>

            <div className="mb-4">
              <label className="block mb-1 text-sm font-medium text-gray-700">Password</label>
              <input
                name="password"
                type="password"
                className="w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#000042]"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter password"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#000042] text-white py-2 px-4 rounded-md hover:bg-[#1c1c7d] transition"
              disabled={loading}
            >
              {loading ? "Loading..." : "Sign in"}
            </button>

            <div className="text-right mt-2">
              <a href="#" className="text-sm text-blue-600 hover:underline">Forgot your password?</a>
            </div>
          </form>
        </div>
      </div>

      {/* Progress bar animation */}
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
