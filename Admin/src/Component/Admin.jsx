// Admin.jsx - พร้อมการป้องกัน infinite loop
import { useState, useEffect, useRef } from "react";
import { jwtDecode } from "jwt-decode"; // เพิ่มบรรทัดนี้
import Roomcard from "./Roomcard";
import Statscard from "./Statscard";
import { useLocation } from "react-router-dom";
import { useDarkMode } from "./Context/DarkModeContext";
import { useAuth } from "./Context/Authcontext";
import { CircularProgress } from "@mui/material";
import Header from "./Header";
import ButtonFilter from "./ButtonFilter";
import { Users } from "lucide-react";

// ส่วนที่เหลือของโค้ดคงเดิม
function RoomPage() {
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState("Room");
  const [events, setEvents] = useState([]);
  const [filteredRoom, setFilteredRoom] = useState([]);
  const [filterType, setFilterType] = useState(null);
  const [emptyMessage, setEmptyMessage] = useState("");

  const location = useLocation();
  const { darkMode } = useDarkMode();
  const { authStatus, isRedirecting, logout, retryConnection } = useAuth();

  // ใช้ ref เพื่อป้องกัน multiple connections และเก็บ EventSource reference
  const connectionInitialized = useRef(false);
  const roomDataSource = useRef(null);
  const retryCount = useRef(0);
  const maxRetries = 3;

  useEffect(() => {
    // Reset connection flag เมื่อ component mount
    console.log("🚀 Admin component mounted, resetting flags");
    connectionInitialized.current = false;
    retryCount.current = 0;
    setLoading(true); // เริ่มต้นด้วย loading state

    return () => {
      console.log("🧹 Admin component unmounting, cleaning up");
      if (roomDataSource.current) {
        roomDataSource.current.close();
        roomDataSource.current = null;
      }
      connectionInitialized.current = false;
    };
  }, []); // ลบ dependency เพื่อให้รันแค่ครั้งเดียวตอน mount

  useEffect(() => {
    console.log("🔍 AuthStatus changed:", authStatus, "Connection initialized:", connectionInitialized.current);
    
    // ⭐ ตรวจสอบ forceLogout flag ก่อนทำอะไร
    const forceLogout = localStorage.getItem("forceLogout");
    if (forceLogout === "true") {
      console.log("🚨 Admin useEffect: ForceLogout flag detected - letting Authcontext handle redirect");
      // ปิด connection ถ้ามี
      if (roomDataSource.current) {
        roomDataSource.current.close();
        roomDataSource.current = null;
      }
      connectionInitialized.current = false;
      setLoading(false);
      // ⭐ ไม่ redirect ที่นี่ ให้ Authcontext.jsx จัดการ
      return;
    }
    
    // ถ้า authStatus เป็น authorized และยังไม่ได้ initialize connection
    if (authStatus === "authorized" && !connectionInitialized.current) {
      console.log("✅ Starting room data initialization");
      initializeRoomData();
      connectionInitialized.current = true;
    } else if (authStatus === "unauthorized") {
      console.log("❌ Unauthorized, cleaning up connections");
      setLoading(false);
      // ปิด connection ถ้ามี
      if (roomDataSource.current) {
        roomDataSource.current.close();
        roomDataSource.current = null;
      }
      connectionInitialized.current = false;
    } else if (authStatus === "checking") {
      console.log("⏳ Auth checking, setting loading state");
      setLoading(true);
    }
  }, [authStatus]); // ลบ roomDataSource dependency เพราะใช้ ref แล้ว

  // useEffect สำหรับ handle route changes
  useEffect(() => {
    console.log("🛤️ Route changed, current path:", location.pathname);
    
    // ถ้ากลับมาที่หน้า admin และ authStatus เป็น authorized แต่ไม่มี connection
    if (location.pathname.includes('/admin/api') && authStatus === "authorized" && !connectionInitialized.current) {
      console.log("🔄 Route back to admin, reinitializing connection");
      setLoading(true);
      initializeRoomData();
      connectionInitialized.current = true;
    }
  }, [location.pathname, authStatus]);

  const initializeRoomData = () => {
    console.log("🔌 Initializing room data connection");
    
    // ⭐ ตรวจสอบ forceLogout flag ก่อนทำอะไร
    const forceLogout = localStorage.getItem("forceLogout");
    if (forceLogout === "true") {
      console.log("🚨 Admin: ForceLogout flag detected - letting Authcontext handle redirect");
      // ⭐ ไม่ redirect ที่นี่ ให้ Authcontext.jsx จัดการ
      setLoading(false);
      return;
    }
    
    const code = new URLSearchParams(location.search).get("code");
    const token = localStorage.getItem("token");

    // เช็คซ้ำอีกครั้งก่อนสร้าง connection
    if (!token) {
      console.log("❌ No token found, redirecting to home for login");
      window.location.href = "/";
      return;
    }

    // เพิ่มการตรวจสอบ token validity
    try {
      if (token.split(".").length === 3) {
        const decodedToken = jwtDecode(token); // ตอนนี้จะทำงานได้แล้วเพราะมี import
        const currentTime = Date.now() / 1000; // Current time in seconds

        if (decodedToken.exp <= currentTime) {
          // Token หมดอายุ
          console.log("❌ Token expired, redirecting to login");
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          window.location.href = "/";
          return;
        }
      } else {
        // Token ไม่ถูกต้อง
        console.log("❌ Invalid token format, redirecting to login");
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        window.location.href = "/";
        return;
      }
    } catch (error) {
      console.error("❌ Error decoding token:", error);
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      window.location.href = "/";
      return;
    }

    // ปิด connection เดิมถ้ามี
    if (roomDataSource.current) {
      console.log("🔌 Closing existing SSE connection");
      roomDataSource.current.close();
      roomDataSource.current = null;
    }

    console.log("🔌 Creating new SSE connection to /api1/admin/sse");
    setLoading(true); // เซ็ต loading เมื่อเริ่มสร้าง connection

    // ⭐ สร้าง SSE connection สำหรับข้อมูลห้อง โดยไม่ส่ง code (ใช้ token ที่มีอยู่)
    console.log("🔗 Creating room data SSE connection with existing token (no code)");
    const es = new EventSource(`/api1/admin/sse`);
    roomDataSource.current = es;

    es.onopen = () => {
      console.log("✅ Room data SSE connection opened successfully");
      retryCount.current = 0; // Reset retry count เมื่อเชื่อมต่อสำเร็จ
    };

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        // เพิ่มเงื่อนไขให้ console.log แสดงเฉพาะเมื่ออยู่ในหน้า Admin
        if (location.pathname.includes('/admin/api')) {
          console.log("📨 Received room data:", data);
        }

        if (data.results) {
          if (location.pathname.includes('/admin/api')) {
            console.log("✅ Setting events data and stopping loading");
          }
          setEvents(data.results);
          setLoading(false);
        }
      } catch (err) {
        console.error("❌ Error parsing room data:", err);
        setLoading(false);
      }
    };

    es.onerror = (err) => {
      console.error("❌ Room data SSE error:", err);
      setLoading(false);

      // ปิด connection
      es.close();
      roomDataSource.current = null;
      connectionInitialized.current = false;

      // จำกัดจำนวนครั้งในการ retry
      if (retryCount.current < maxRetries) {
        retryCount.current++;
        console.log(
          `🔄 Retrying connection (${retryCount.current}/${maxRetries})...`
        );

        // รอ 2 วินาทีก่อน retry
        setTimeout(() => {
          if (authStatus === "authorized") {
            console.log("🔄 Retrying room data initialization");
            initializeRoomData();
            connectionInitialized.current = true;
          }
        }, 2000);
      } else {
        console.log("❌ Max retries reached, redirecting to home for login");
        // ถ้า retry เกินจำนวนที่กำหนด ให้กลับไปหน้าแรกเพื่อ login ใหม่
        window.location.href = "/";
      }
    };

    // ⭐ เพิ่ม forceLogout event listener สำหรับ room data SSE
    es.addEventListener("forceLogout", (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("🚨 Admin: Force logout received:", data.error);
        
        // ปิด SSE connection ทันที
        es.close();
        roomDataSource.current = null;
        connectionInitialized.current = false;
        
        // ⭐ ตั้ง flag แต่ไม่ redirect (ให้ Authcontext.jsx จัดการ)
        localStorage.setItem("forceLogout", "true");
        localStorage.setItem("unauthorizedReason", data.error || "Access denied");
        
        console.log("🚨 Admin: ForceLogout flag set, letting Authcontext handle redirect");
      } catch (err) {
        console.error("❌ Error in Admin forceLogout:", err);
        es.close();
        roomDataSource.current = null;
        connectionInitialized.current = false;
        localStorage.setItem("forceLogout", "true");
        localStorage.setItem("unauthorizedReason", "Session error");
      }
    });
  };

  // ส่วนที่เหลือของโค้ดคงเดิม...
  const handleRoomFilter = (rooms, type, message = "") => {
    setFilteredRoom(rooms);
    setFilterType(type);
    setEmptyMessage(message);
  };

  const clearAllFilters = () => {
    console.log("Clear all filters called from Admin");
    setFilteredRoom([]);
    setFilterType(null);
    setEmptyMessage("");
    setSelectedSize("Room");
  };

  const handleRetryConnection = () => {
    console.log("🔄 Manual retry requested");
    retryCount.current = 0;
    connectionInitialized.current = false;
    setLoading(true);
    setEvents([]); // Clear existing data
    setFilteredRoom([]); // Clear filters

    if (authStatus === "authorized") {
      initializeRoomData();
      connectionInitialized.current = true;
    }
  };

  const iconClass = [
    { id: 1, room: "1501", icons: 1, people: 4 },
    { id: 2, room: "1502", icons: 1, people: 4 },
    { id: 3, room: "1503", icons: 1, people: 4 },
    { id: 4, room: "1504", icons: 1, people: 4 },
    { id: 5, room: "1505", icons: 1, people: 6 },
    { id: 6, room: "1506", icons: 1, people: 6 },
    { id: 7, room: "1514", icons: 1, people: 10 },
    { id: 8, room: "1515", icons: 1, people: 10 },
    { id: 9, room: "1519", icons: 1, people: 4 },
    { id: 10, room: "1520", icons: 1, people: 4 },
  ];

  // แสดง loading screen ขณะตรวจสอบสิทธิ์
  if (authStatus === "checking" || isRedirecting) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
          darkMode ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p
            className={`transition-colors duration-300 ${
              darkMode ? "text-white" : "text-gray-600"
            }`}
          >
            Checking permissions...
          </p>
        </div>
      </div>
    );
  }


  return (
    <div
      className={`font-display min-h-screen transition-colors duration-300 ${
        darkMode ? "bg-gray-900" : "bg-gray-50"
      }`}
    >
      <Header showPin={false} />

      <Statscard
        darkMode={darkMode}
        rooms={events}
        currentTime={new Date()}
        onFilter={handleRoomFilter}
        showHousekeeper={false}
        showAdmin={false}
        showRoomStatus={true}
      />

      <div
        className={`pb-4 mx-[8px] md:mx-[24px] rounded-xl shadow-sm transition-colors duration-300 ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"
        }`}
      >
        <div className="flex gap-2 flex-col items-start md:flex-row md:items-center md:justify-between p-[24px]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <h1
              className={`text-lg font-medium transition-colors duration-300 ${
                darkMode ? "text-white" : "text-black"
              }`}
            >
              Meeting Room
            </h1>
          </div>

          <ButtonFilter
            onFilter={handleRoomFilter}
            events={events}
            currentTime={new Date()}
            selectedSize={selectedSize}
            setSelectedSize={setSelectedSize}
            clearAllFilters={clearAllFilters}
            icons={iconClass}
          />
        </div>

        {loading ? (
          <div
            className={`flex flex-col items-center justify-center py-20 gap-4 transition-colors duration-300 ${
              darkMode ? "text-white" : "text-black"
            }`}
          >
            <div className="flex items-center gap-2">
              <span>Loading Room Data...</span>
              <CircularProgress size="25px" />
            </div>
          </div>
        ) : (
          <Roomcard
            data={filteredRoom.length > 0 ? filteredRoom : events}
            icons={iconClass}
            filterType={filterType}
            emptyMessage={emptyMessage}
            selectedSize={selectedSize}
            setSelectedSize={setSelectedSize}
            events={events}
            clearAllFilters={clearAllFilters}
          />
        )}
      </div>
    </div>
  );
}

export default RoomPage;