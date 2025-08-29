
import React from 'react';
import axios from "axios";
import { useNavigate } from 'react-router-dom';

export const refreshToken = async () => {
  try {
    const refreshRes = await axios.post("/api1/account/refreshtoken", {}, { withCredentials: true });
    console.log("Refresh response success:", refreshRes);
    const newToken = refreshRes.data.accessToken;
    if (!newToken) {
      console.error("No accessToken returned in refresh response.");
      return;
    }

    localStorage.setItem("token", newToken);
    // console.log("Access token refreshed successfully.");
  } catch (err) {
    console.error("Token refresh error:", err);
    // navigate('/');
  }
};

export default function RefreshButton({ onClick, children, ...props }) {
  const handleClick = async (e) => {
    try {
      await refreshToken();
      if (onClick) {
        onClick(e);
      }
    } catch (err) {
      console.error('Refresh token failed:', err);
      if (err.response?.status === 401) {
        console.log("Refresh token expired, redirecting to login");
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        window.location.href = "/admin/";
      }
    }
  };

  return (
    <button onClick={handleClick} {...props}>
      {children}
    </button>
  );
}