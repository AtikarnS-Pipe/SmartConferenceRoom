import React, { useState, useEffect } from 'react';
import { useDarkMode } from "./Context/DarkModeContext";
import RefreshButton from '../utils/refreshToken';
import { useLocation, useNavigate } from "react-router-dom";
import { X } from 'lucide-react';

function ButtonFilter ({selectedSize, setSelectedSize, clearAllFilters, events, onFilter, rooms, currentTime, preserveAvailabilityFilter}){
const [openMenu1, setOpenMenu1] = useState(false);
const [openAvailabilityMenu, setOpenAvailabilityMenu] = useState(false);
const [selectedAvailability, setSelectedAvailability] = useState(preserveAvailabilityFilter || "Availability"); // ✅ ใช้ค่าจาก props
const { darkMode, toggleDarkMode } = useDarkMode();
const location = useLocation();

// ✅ Add: useEffect เพื่อ sync กับ navigation state
useEffect(() => {
  // ดึงค่าจาก location.state ถ้ามี
  if (location.state?.preserveAvailabilityFilter && location.state.preserveAvailabilityFilter !== "Availability") {
    setSelectedAvailability(location.state.preserveAvailabilityFilter);
  }
}, [location.state]);

// ✅ Add: อัพเดท selectedAvailability เมื่อได้รับค่าใหม่จาก props
useEffect(() => {
  if (preserveAvailabilityFilter && preserveAvailabilityFilter !== "Availability") {
    setSelectedAvailability(preserveAvailabilityFilter);
  }
}, [preserveAvailabilityFilter]);
const showSizeRoom = true;
const toggleDropdown1 = () => setOpenMenu1((prev) => !prev);
const toggleAvailabilityDropdown = () => setOpenAvailabilityMenu((prev) => !prev);
const navigate = useNavigate();

// เช็คว่ามีการ filter อะไรไหม (ไม่อิงจาก path)
const hasActiveFilters = selectedSize !== "Room" || selectedAvailability !== "Availability";

// คำนวณจำนวนห้องว่างและไม่ว่าง
let availableCount = 0;
let unavailableCount = 0;

if (events && Array.isArray(events)) {
  events.forEach(room => {
    const isBusy = room.events.some(ev => {
      const start = new Date(ev.start.dateTime);
      const end = new Date(ev.end.dateTime);
      start.setHours(start.getHours() + 7);
      end.setHours(end.getHours() + 7);
      return currentTime >= start && currentTime <= end;
    });
    if (isBusy) {
      unavailableCount++;
    } else {
      availableCount++;
    }
  }); 
}

const handleClickAvailable = () => {
  // ✅ เช็คว่ามีห้องว่างไหม
  if (availableCount === 0) {
    // ส่งข้อมูลว่างพร้อมกับ message
    onFilter([], "available", "There are no rooms available.");
    setSelectedAvailability("Available"); // เปลี่ยนข้อความปุ่ม
    setOpenAvailabilityMenu(false);
    return;
  }

  const availableRooms = events
    .map(room => {
      const isBusy = room.events.some(ev => {
        const start = new Date(ev.start.dateTime);
        const end = new Date(ev.end.dateTime);
        start.setHours(start.getHours() + 7);
        end.setHours(end.getHours() + 7);
        return currentTime >= start && currentTime <= end;
      });
      return { ...room, isAvailable: !isBusy };
    })
    .filter(room => room.isAvailable);

  onFilter(availableRooms, "available");
  setSelectedAvailability("Available"); // เปลี่ยนข้อความปุ่ม
  setOpenAvailabilityMenu(false);
};

const handleClickUnavailable = () => {
  // ✅ เช็คว่ามีห้องไม่ว่างไหม
  if (unavailableCount === 0) {
    // ส่งข้อมูลว่างพร้อมกับ message
    onFilter([], "unavailable", "There are no rooms unavailable.");
    setSelectedAvailability("Occupied"); // เปลี่ยนข้อความปุ่ม
    setOpenAvailabilityMenu(false);
    return;
  }

  const unavailableRooms = events
    .map(room => {
      const isBusy = room.events.some(ev => {
        const start = new Date(ev.start.dateTime);
        const end = new Date(ev.end.dateTime);
        start.setHours(start.getHours() + 7);
        end.setHours(end.getHours() + 7);
        return currentTime >= start && currentTime <= end;
      });
      return { ...room, isAvailable: isBusy };
    })
    .filter(room => room.isAvailable);

  onFilter(unavailableRooms, "unavailable");
  setSelectedAvailability("Occupied"); // เปลี่ยนข้อความปุ่ม
  setOpenAvailabilityMenu(false);
};

const handleSizeChange = (size) => {
    const label =
      size === 4 ? "S" : size === 6 ? "M" : size === 10 ? "L" : "Room";
    setSelectedSize(label); // ✅ อัพเดท state ทันที
    handleSizeNavigate(size, label);
    console.log("Size clicked:", size, "Label:", label, "Events:", events?.length || 0);
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

    // ✅ Fix: ส่ง availability filter state ไปด้วย
    const currentPath = window.location.pathname;
    
    if (currentPath === `/roomsize/${peopleSize}`) {
      // ถ้าอยู่หน้าเดิม ให้ reset filter
      console.log("Same page - preserving availability filter");
      navigate(`/roomsize/${peopleSize}`, {
        state: {
          icons: iconClass,
          peopleSize: peopleSize,
          rooms: [], // ✅ ส่งเป็น array ว่าง ให้ RoomSize ดึงข้อมูลสดเอง
          selectedSize: label,
          resetFilter: false, // ✅ เปลี่ยนเป็น false เพื่อไม่ให้ reset filter
          // ✅ เพิ่ม: ส่ง availability filter state ไปด้วย
          preserveAvailabilityFilter: selectedAvailability,
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
          // ✅ เพิ่ม: ส่ง availability filter state ไปด้วย
          preserveAvailabilityFilter: selectedAvailability,
        },
        replace: true,
      });
    }
    setOpenMenu1(false);
  };

    return(
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-stretch sm:justify-end gap-3">
          {/* Availability Dropdown */}
          <div className="relative w-full sm:w-auto">
            <RefreshButton 
              className={`w-full sm:w-auto rounded-md px-3 py-2 cursor-pointer text-sm md:text-base border-b-2 ${
                darkMode
                  ? "text-white hover:text-blue-400 border-transparent hover:border-blue-400 bg-gray-600"
                  : "text-black hover:text-blue-400 border-transparent hover:border-blue-400 bg-gray-300"
              }`}
              onClick={toggleAvailabilityDropdown}
            >
              {selectedAvailability} {openAvailabilityMenu ? "▴" : "▾"}
            </RefreshButton>

            {openAvailabilityMenu && (
              <ul
                className={`absolute left-0 top-full mt-2 rounded-md shadow-lg z-20 min-w-[8rem] ${
                  darkMode ? "bg-blue-700" : "bg-gray-800"
                }`}
              >
                <li>
                  <RefreshButton
                    className={`block w-full text-center px-4 py-2 text-white ${
                      darkMode ? "hover:bg-gray-600" : "hover:bg-gray-700 "
                    }`}
                    onClick={handleClickAvailable}
                  >
                    Available 
                  </RefreshButton>
                </li>
                <li>
                  <RefreshButton
                    className={`block w-full text-center px-4 py-2 text-white ${
                      darkMode ? "hover:bg-gray-600" : "hover:bg-gray-700"
                    }`}
                    onClick={handleClickUnavailable}
                  >
                    Occupied
                  </RefreshButton>
                </li>
              </ul>
            )}
          </div>

          {/* Size Room Dropdown */}
          {showSizeRoom && (
            <div className="relative w-full sm:w-auto">
              <div
                className={`w-full sm:w-auto rounded-md px-3 py-2 cursor-pointer text-sm md:text-base border-b-2
                ${  darkMode
                    ? "text-white hover:text-blue-400 border-transparent hover:border-blue-400 bg-gray-600"
                    : "text-black hover:text-blue-400 border-transparent hover:border-blue-400 bg-gray-300"
                }`}
                onClick={toggleDropdown1}
              >
                {selectedSize === "Room" ? `${selectedSize} Size` : `Size ${selectedSize}`} {openMenu1 ? "▴" : "▾"}
              </div>

              {openMenu1 && (
                <ul
                  className={`absolute left-0 top-full mt-2 rounded-md shadow-lg z-20 min-w-[8rem] ${
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
                        {size === 4 ? "Small" : size === 6 ? "Medium" : "Large"}
                      </RefreshButton>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Clear Filter Button */}
          <RefreshButton
            className={`w-full sm:w-auto rounded-md px-3 py-2 text-sm md:text-base cursor-pointer ${
              !hasActiveFilters 
                ? darkMode 
                    ? "text-gray-500 cursor-not-allowed opacity-90 bg-gray-600" 
                    : "text-gray-400 cursor-not-allowed opacity-90 bg-gray-100"
                : darkMode 
                    ? "text-white hover:text-blue-400 bg-gray-600 " 
                    : "text-black hover:text-blue-400 bg-gray-300"
            }`}
            onClick={() => {
              if (!hasActiveFilters) return;
              setSelectedSize("Room");
              setSelectedAvailability("Availability");
              setOpenMenu1(false);
              setOpenAvailabilityMenu(false);
              if (clearAllFilters) {
                clearAllFilters();
              } else {
                navigate("/admin/api");
              }
            }}
          >
            <div className="flex items-center justify-center gap-1">
              <X className="w-4 h-4" />
              Clear filter
            </div>
          </RefreshButton>
        </div>
          );
        }
export default ButtonFilter;