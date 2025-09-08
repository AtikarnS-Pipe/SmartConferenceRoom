import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const ProfileContext = createContext();

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // ฟังก์ชันดึงข้อมูล profile
  const fetchProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("No token found");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get("/api1/account/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setProfile(response.data);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError(err.response?.data?.message || "Failed to fetch profile");
      
      // ถ้า token หมดอายุ ให้ clear profile
      if (err.response?.status === 401) {
        setProfile(null);
        localStorage.removeItem("token");
        localStorage.removeItem("role");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // เรียกข้อมูล profile เมื่อ token มีการเปลี่ยนแปลง
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && !profile) {
      fetchProfile();
    } else if (!token) {
      setProfile(null);
    }
  }, []);

  // ฟังก์ชันรีเฟรช profile (สำหรับกรณีที่ต้องการอัพเดทข้อมูล)
  const refreshProfile = () => {
    fetchProfile();
  };

  // ฟังก์ชันล้างข้อมูล profile (สำหรับ logout)
  const clearProfile = () => {
    setProfile(null);
    setError(null);
  };

  const value = {
    profile,
    isLoading,
    error,
    refreshProfile,
    clearProfile,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}

// Custom hook สำหรับใช้ Profile context
export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
