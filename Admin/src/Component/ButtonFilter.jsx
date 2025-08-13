import React, { useState, useEffect } from 'react';
import { useDarkMode } from "./Context/DarkModeContext";
import RefreshButton from '../utils/refreshToken';
import { useLocation, useNavigate } from "react-router-dom";
import { X } from 'lucide-react';

function ButtonFilter ({
  selectedSize,
  setSelectedSize,
  clearAllFilters,
  events,
  onFilter,
  rooms,
  currentTime,
  preserveAvailabilityFilter
}) {
  const [openMenu1, setOpenMenu1] = useState(false);
  const [openAvailabilityMenu, setOpenAvailabilityMenu] = useState(false);
  const [selectedAvailability, setSelectedAvailability] = useState(preserveAvailabilityFilter || "Availability");
  const { darkMode } = useDarkMode();
  const location = useLocation();
  const navigate = useNavigate();

  // ---------- helpers ----------
  const getPeopleSizeFromPath = () => {
    const path = window.location.pathname || "";
    if (path.startsWith("/roomsize/")) {
      const last = path.split("/").pop();
      const n = parseInt(last, 10);
      return Number.isNaN(n) ? null : n;
    }
    return null;
  };

  // push state ซ้ำไปหน้าเดิมเมื่อเปลี่ยน availability (เพื่อให้ RoomSize sync ทันที)
  const pushAvailabilityStateToRoute = (availabilityLabel) => {
    const peopleSize = getPeopleSizeFromPath();
    if (!peopleSize) return;

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

    // อัปเดต state ที่ route เดิม เพื่อให้หน้า RoomSize อ่าน preserveAvailabilityFilter ใหม่และรีเฟรชทันที
    navigate(`/roomsize/${peopleSize}`, {
      state: {
        icons: iconClass,
        peopleSize,
        rooms: [],
        selectedSize,
        resetFilter: false,
        preserveAvailabilityFilter: availabilityLabel,
      },
      replace: true,
    });
  };

  // ---------- effects ----------
  // sync จาก navigation state -> local state
  useEffect(() => {
    if (location.state?.preserveAvailabilityFilter && location.state.preserveAvailabilityFilter !== "Availability") {
      setSelectedAvailability(location.state.preserveAvailabilityFilter);
    }
  }, [location.state]);

  // sync จาก props -> local state
  useEffect(() => {
    if (preserveAvailabilityFilter && preserveAvailabilityFilter !== "Availability") {
      setSelectedAvailability(preserveAvailabilityFilter);
    }
  }, [preserveAvailabilityFilter]);

  const showSizeRoom = true;

  // เปิดทีละเมนู ไม่ให้ทับกัน
  const toggleAvailabilityDropdown = () => {
    setOpenAvailabilityMenu(prev => {
      const next = !prev;
      if (next) setOpenMenu1(false);
      return next;
    });
  };
  const toggleDropdown1 = () => {
    setOpenMenu1(prev => {
      const next = !prev;
      if (next) setOpenAvailabilityMenu(false);
      return next;
    });
  };

  // มีการ filter อะไรอยู่ไหม
  const hasActiveFilters = selectedSize !== "Room" || selectedAvailability !== "Availability";

  // คำนวณจำนวนห้องว่าง/ไม่ว่างจาก events
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

  // ---------- availability handlers ----------
  const handleClickAvailable = () => {
    if (availableCount === 0) {
      onFilter([], "available", "There are no rooms available.");
      setSelectedAvailability("Available");
      pushAvailabilityStateToRoute("Available");
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
    setSelectedAvailability("Available");
    // 👉 สำคัญ: อัปเดต route state เพื่อกระตุ้น RoomSize ให้รีเฟรชตาม availability ทันที
    pushAvailabilityStateToRoute("Available");
    setOpenAvailabilityMenu(false);
  };

  const handleClickUnavailable = () => {
    if (unavailableCount === 0) {
      onFilter([], "unavailable", "There are no rooms unavailable.");
      setSelectedAvailability("Occupied");
      pushAvailabilityStateToRoute("Occupied");
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
    setSelectedAvailability("Occupied");
    // 👉 สำคัญ: อัปเดต route state เพื่อกระตุ้น RoomSize ให้รีเฟรชตาม availability ทันที
    pushAvailabilityStateToRoute("Occupied");
    setOpenAvailabilityMenu(false);
  };

  // ---------- size handlers ----------
  const handleSizeChange = (size) => {
    const label = size === 4 ? "S" : size === 6 ? "M" : size === 10 ? "L" : "Room";
    setSelectedSize(label);
    handleSizeNavigate(size, label);
    console.log("Size clicked:", size, "Label:", label, "Events:", events?.length || 0);
  };

  const handleSizeNavigate = (peopleSize, label) => {
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

    const currentPath = window.location.pathname;
    const statePayload = {
      icons: iconClass,
      peopleSize,
      rooms: [],
      selectedSize: label,
      resetFilter: false,
      preserveAvailabilityFilter: selectedAvailability, // ส่งค่าปัจจุบันไปด้วย
    };

    if (currentPath === `/roomsize/${peopleSize}`) {
      navigate(`/roomsize/${peopleSize}`, { state: statePayload, replace: true });
    } else {
      navigate(`/roomsize/${peopleSize}`, { state: statePayload, replace: true });
    }
    setOpenMenu1(false);
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-stretch sm:justify-end gap-3">
      {/* Availability Dropdown */}
      <div className="relative w-full sm:w-auto">
        <RefreshButton
          className={`w-full sm:w-auto rounded-lg px-3 py-2 cursor-pointer text-sm md:text-base border-b-2 ${
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
            className={`absolute left-0 top-full mt-2 rounded-md shadow-lg z-20 w-full overflow-hidden ${
              darkMode ? "bg-blue-700" : "bg-gray-800"
            }`}
          >
            <li>
              <RefreshButton
                className={`block w-full text-center px-4 py-2 text-white rounded-t-md ${
                  darkMode ? "hover:bg-gray-600" : "hover:bg-gray-700"
                }`}
                onClick={handleClickAvailable}
              >
                Available
              </RefreshButton>
            </li>
            <li>
              <RefreshButton
                className={`block w-full text-center px-4 py-2 text-white rounded-b-md ${
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
            className={`w-full sm:w-auto rounded-lg px-3 py-2 cursor-pointer text-sm md:text-base border-b-2 ${
              darkMode
                ? "text-white hover:text-blue-400 border-transparent hover:border-blue-400 bg-gray-600"
                : "text-black hover:text-blue-400 border-transparent hover:border-blue-400 bg-gray-300"
            }`}
            onClick={toggleDropdown1}
          >
            {selectedSize === "Room" ? `${selectedSize} Size` : `Size ${selectedSize}`} {openMenu1 ? "▴" : "▾"}
          </div>

          {openMenu1 && (
            <ul
              className={`absolute left-0 top-full mt-2 rounded-md shadow-lg z-20 w-full overflow-hidden ${
                darkMode ? "bg-blue-700" : "bg-gray-800"
              }`}
            >
              {[4, 6, 10].map((size) => (
                <li key={size}>
                  <RefreshButton
                    className={`flex justify-center items-center w-full text-center px-4 py-2 text-white whitespace-nowrap ${
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
        className={`w-full sm:w-auto rounded-lg px-3 py-2 text-sm md:text-base ${
          !hasActiveFilters
            ? darkMode
              ? "text-gray-500 cursor-not-allowed opacity-90 bg-gray-600 pointer-events-none"
              : "text-gray-400 cursor-not-allowed opacity-90 bg-gray-100 pointer-events-none"
            : darkMode
              ? "text-white cursor-pointer hover:text-blue-400 bg-gray-600"
              : "text-black cursor-pointer hover:text-blue-400 bg-gray-300"
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
