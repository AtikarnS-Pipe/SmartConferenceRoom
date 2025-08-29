import React from "react";
import axios from "axios";

let isRefreshing = false;

export const refreshToken = async () => {
  if (isRefreshing) {
    console.log("⏩ Refresh already in progress, skipping...");
    return;
  }

  isRefreshing = true;
  let attempts = 0;

  try {
    while (attempts < 2) {
      try {
        const refreshRes = await axios.post(
          "/api1/account/refreshtoken",
          {},
          { withCredentials: true }
        );

        const newToken = refreshRes.data?.accessToken;
        if (!newToken) {
          throw new Error("No accessToken returned in refresh response.");
        }

        localStorage.setItem("token", newToken);
        console.log("✅ Access token refreshed successfully.");
        return newToken;
      } catch (err) {
        attempts++;
        if (err.code === "ERR_NETWORK" && attempts < 2) {
          console.warn("Network error, retrying refresh...");
          await new Promise((r) => setTimeout(r, 1000));
        } else {
          throw err;
        }
      }
    }
    throw new Error("Refresh token failed after 2 attempts.");
  } finally {
    isRefreshing = false;
  }
};

export default function RefreshButton({ onClick, children, ...props }) {
  const handleClick = async (e) => {
    try {
      await refreshToken();
      if (onClick) onClick(e);
    } catch (err) {
      console.error("❌ Refresh token failed:", err);
      if (err.response?.status === 401) {
        console.log("Refresh token expired, redirecting to login");
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        // Router basename="/admin" ใช้อยู่แล้ว ดังนั้นไปที่ root ภายในแอพเป็น '/'
        window.location.href = "/";
      }
    }
  };

  return (
    <button onClick={handleClick} {...props}>
      {children}
    </button>
  );
}
