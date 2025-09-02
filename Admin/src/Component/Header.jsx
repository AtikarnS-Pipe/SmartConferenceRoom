import RefreshButton from "../utils/refreshToken";
import { useDarkMode } from "./Context/DarkModeContext";
import { useProfile } from "./Context/ProfileContext";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Sun, Moon, Eye, EyeOff } from "lucide-react";

function Header({ 
  title = "Dashboard", 
  subtitle = "Updated in real-time", 
  show,
  setShow,
  showPin = true, // เพิ่ม prop สำหรับควบคุมการแสดง PIN
}) {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const { profile } = useProfile(); // ใช้ profile จาก Context
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Time update
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

  return (
    <div
      className={`w-full h-auto py-4 ${
        darkMode ? "bg-gray-800 border-gray-700" 
                 : "bg-white  border-gray-200"
      } transition-colors duration-300 border-b`}
    >
     <div className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between px-4 md:px-6 gap-4">
        {/* ซ้าย - Title */}
        <div className="flex flex-col">
          <h1
            className={`text-xl md:text-2xl font-bold ${
              darkMode ? "text-white" : "text-black"
            }`}
          >
            {title}
          </h1>
          <p
            className={`text-sm ${
              darkMode ? "text-gray-300" : "text-gray-600"
            }`}
          >
            {subtitle}
          </p>
        </div>

        {/* ขวา - Controls */}
        <div className="flex justify-end items-center gap-4">
          {/* PIN Display - แสดงเฉพาะเมื่อมี profile และ showPin เป็น true */}
          {profile && showPin && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg w-fit ${
              darkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              <div className={`text-base tracking-widest ${
                darkMode ? 'text-white' : 'text-gray-700'
              }`}
               style={{ minWidth: `${(profile?.pin?.length || 4) * 0.65}rem`, textAlign: 'center' }}
               >
                {show ? profile?.pin || '0000' : '●'.repeat(profile?.pin?.length || 4)}
              </div>
              <RefreshButton
                type="button"
                onClick={() => setShow(!show)}
                className={`focus:outline-none ${darkMode ? 'text-white' : 'text-gray-500'}`}
                title={show ? "Hide PIN" : "Show PIN"}
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </RefreshButton>
            </div>
          )}

          {/* Dark Mode Toggle */}
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

          {/* Time Display */}
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