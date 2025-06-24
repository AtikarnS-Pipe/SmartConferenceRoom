import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";


function Verify( {setAuth} ) {
  const [formData, setFormData] = useState({email: '',password: ''});
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
        ...formData,
        [e.target.name]: e.target.value
    });
  }
  const handleSubmit = async (e) => {
    e.preventDefault();
    try{
      const res = await axios.post('/account/auth', formData);
      alert("Login successful");
      localStorage.setItem('token', res.data.token);
      setAuth(true);
      navigate('/login/ms');
    } catch (error) {
      setError("Invalid email or password");
      alert("Email and Password, please try again later.");
      console.error("Login error:", error);

      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", error.response.data);
      }
    }
}

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8] font-display">
      <div className="bg-white shadow-xl rounded-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-[#000042] mb-6">Signin</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4 ">
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
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export { Verify };
