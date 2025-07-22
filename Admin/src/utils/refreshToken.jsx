
import React from 'react';
import axios from "axios";
import { useNavigate } from 'react-router-dom';

const refreshToken = async () => {
  try {
    const refreshRes = await axios.post("/account/refreshtoken", {}, { withCredentials: true });
    console.log("Refresh response:", refreshRes);
    const newToken = refreshRes.data.accessToken;
    if (!newToken) {
      console.error("No accessToken returned in refresh response.");
      return;
    }

    localStorage.setItem("token", newToken);
    console.log("Access token refreshed successfully.");
  } catch (err) {
    console.error("Token refresh error:", err);
    // navigate('/');
  }
};

export default function AutoRefreshButton({ onClick, children, ...props }) {
  const handleClick = async (e) => {
    try {
      await refreshToken();
      if (onClick) {
        onClick(e);
      }
    } catch (err) {
      console.error('Refresh token failed:', err);
    }
  };

  return (
    <button onClick={handleClick} {...props}>
      {children}
    </button>
  );
}

{/* <AutoRefreshButton
  onClick={() => setShowModal(false)}
  className={`px-4 py-2 rounded-lg border ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
>
  Cancel
</AutoRefreshButton> */}