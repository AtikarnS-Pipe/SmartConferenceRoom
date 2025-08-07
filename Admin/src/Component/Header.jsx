import RefreshButton from "../utils/refreshToken";
import { useDarkMode } from "./Context/DarkModeContext";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Sun, Moon } from "lucide-react";

function Header({ selectedSize, setSelectedSize, events, clearAllFilters }) {
  const [openMenu1, setOpenMenu1] = useState(false);
  const { darkMode, toggleDarkMode } = useDarkMode();
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const isActive = (path) => location.pathname === path;
  const showSizeRoom = true;
  const toggleDropdown1 = () => setOpenMenu1((prev) => !prev);
  const navigate = useNavigate();

  // ✅ Fix: อัพเดท selectedSize เมื่อเปลี่ยนหน้า
  useEffect(() => {
    if (location.pathname.includes("/roomsize/")) {
      const size = parseInt(location.pathname.split("/roomsize/")[1]);
      const label =
        size === 4 ? "S" : size === 6 ? "M" : size === 10 ? "L" : "Room";
      setSelectedSize(label);
    }
  }, [location.pathname, setSelectedSize]);

  const handleNavigateByRole = () => {
    const role = localStorage.getItem("role");
    console.log("Navigating based on role:", role);
    if (role === "Superadmin") {
      navigate("/account/superadmin");
    } else if (role === "Admin") {
      navigate("/account/admin");
    } else {
      navigate("/");
    }
  };

  const handleSizeNavigate = (peopleSize, label) => {
    // ข้อมูล icons แบบเดียวกับใน Admin.jsx
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

    // ✅ Fix: ปรับปรุงการส่งข้อมูลให้ถูกต้อง - ไม่ส่งข้อมูลเก่า
    const currentPath = window.location.pathname;
    
    if (currentPath === `/roomsize/${peopleSize}`) {
      // ถ้าอยู่หน้าเดิม ให้ reset filter
      console.log("Same page - resetting filters");
      navigate(`/roomsize/${peopleSize}`, {
        state: {
          icons: iconClass,
          peopleSize: peopleSize,
          rooms: [], // ✅ ส่งเป็น array ว่าง ให้ RoomSize ดึงข้อมูลสดเอง
          selectedSize: label,
          resetFilter: true,
        },
        replace: true,
      });
    } else {
      // Navigate ไปหน้าใหม่
      navigate(`/roomsize/${peopleSize}`, {
        state: {
          icons: iconClass,
          peopleSize: peopleSize,
          rooms: [], // ✅ ส่งเป็น array ว่าง ให้ RoomSize ดึงข้อมูลสดเอง
          selectedSize: label,
          resetFilter: false,
        },
        replace: true,
      });
    }
    setOpenMenu1(false);
  };

  const handleSizeChange = (size) => {
    const label =
      size === 4 ? "S" : size === 6 ? "M" : size === 10 ? "L" : "Room";
    setSelectedSize(label); // ✅ อัพเดท state ทันที
    handleSizeNavigate(size, label);
    console.log("Size clicked:", size, "Label:", label, "Events:", events?.length || 0);
  };

  // Time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const dateString = currentTime.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Bangkok",
  });

  const timeString = currentTime.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Bangkok",
  });

  // ✅ เพิ่มการตรวจสอบและ log ข้อมูล events
  useEffect(() => {
    console.log("Header - Events data:", events?.length || 0);
    console.log("Header - Selected size:", selectedSize);
    console.log("Header - Current path:", location.pathname);
  }, [events, selectedSize, location.pathname]);

return (
  <div
  className={`w-full h-auto py-4 ${
    darkMode ? "bg-gray-800" : "bg-white"
  } transition-colors duration-300 border-b border-gray-200`}
>
  <div className="grid grid-cols-3 items-center px-4 md:px-6 gap-4">
    {/* ซ้าย */}
    <div className="flex flex-col">
      <h1
        className={`text-xl md:text-2xl font-bold ${
          darkMode ? "text-white" : "text-black"
        }`}
      >
        Dashboard
      </h1>
      <p
        className={`text-sm ${
          darkMode ? "text-gray-300" : "text-gray-600"
        }`}
      >
        Updated in real-time
      </p>
    </div>

    {/* กลาง */}
    <div className="flex justify-center items-center gap-4">
      {showSizeRoom && (
        <div className="relative">
          <div
            className={`cursor-pointer text-sm md:text-base ${
              selectedSize !== "Room"
                ? "text-blue-400 border-b-2 border-blue-400"
                : darkMode
                ? "text-white hover:text-blue-400"
                : "text-black hover:text-blue-400"
            }`}
            onClick={toggleDropdown1}
          >
            Size {selectedSize} {openMenu1 ? "▴" : "▾"}
          </div>

          {openMenu1 && (
            <ul
              className={`absolute left-0 top-full mt-2 w-24 rounded-md shadow-lg z-20 ${
                darkMode ? "bg-blue-700" : "bg-gray-800"
              }`}
            >
              {[4, 6, 10].map((size) => (
                <li key={size}>
                  <RefreshButton
                    className={`block w-full text-center px-4 py-2 text-white ${
                      darkMode ? "hover:bg-gray-600" : "hover:bg-gray-700"
                    }`}
                    onClick={() => handleSizeChange(size)}
                  >
                    Size {size === 4 ? "S" : size === 6 ? "M" : "L"}
                  </RefreshButton>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <RefreshButton
        className={`text-sm md:text-base cursor-pointer ${
          darkMode ? "text-white hover:text-blue-400" : "text-black hover:text-blue-400"
        }`}
        onClick={() => {
          setSelectedSize("Room");
          setOpenMenu1(false);
          // ✅ Fix: เรียกใช้ clearAllFilters ถ้ามี หรือ navigate กลับหน้าหลัก
          if (clearAllFilters) {
            clearAllFilters();
          } else {
            navigate("/admin/api");
          }
        }}
      >
        Clear filter
      </RefreshButton>
    </div>

    {/* ขวา */}
    <div className="flex justify-end items-center gap-4">
      <RefreshButton
        title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        onClick={toggleDarkMode}
      >
        {darkMode ? (
          <div className="bg-yellow-500 p-2 rounded-full hover:bg-yellow-400">
            <Sun className="w-4 h-4 text-white" />
          </div>
        ) : (
          <div className="bg-blue-500 p-2 rounded-full hover:bg-blue-400">
            <Moon className="w-4 h-4 text-white" />
          </div>
        )}
      </RefreshButton>

      <div className={`h-6 w-px ${darkMode ? "bg-gray-400" : "bg-black"}`} />

      <div className="flex flex-col text-sm md:text-base text-right">
        <span className={`${darkMode ? "text-white" : "text-black"}`}>
          {timeString}
        </span>
        <span className={`${darkMode ? "text-white" : "text-black"}`}>
          {dateString}
        </span>
      </div>
    </div>
  </div>
</div>

);
}

export default Header;