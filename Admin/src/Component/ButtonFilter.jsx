import React, { useState, useEffect, useRef } from 'react';
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
  preserveAvailabilityFilter,
  icons // เพิ่ม icons prop สำหรับการ filter
}) {
  const [openMenu1, setOpenMenu1] = useState(false);
  const [openAvailabilityMenu, setOpenAvailabilityMenu] = useState(false);
  const [selectedAvailability, setSelectedAvailability] = useState(preserveAvailabilityFilter || "Availability");
  const { darkMode } = useDarkMode();
  const location = useLocation();
  const navigate = useNavigate();

  // refs สำหรับตรวจคลิกนอก dropdown
  const availabilityRef = useRef(null);
  const sizeRef = useRef(null);

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

  // ปิด dropdown เมื่อคลิกนอกกรอบ/กด Esc
  useEffect(() => {
    const handlePointerDown = (e) => {
      if (!openAvailabilityMenu && !openMenu1) return;
      const inAvailability = availabilityRef.current?.contains(e.target);
      const inSize = sizeRef.current?.contains(e.target);
      if (!inAvailability && !inSize) {
        setOpenAvailabilityMenu(false);
        setOpenMenu1(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpenAvailabilityMenu(false);
        setOpenMenu1(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown, { passive: true });
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openAvailabilityMenu, openMenu1]);

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

  // คำนวดจำนวนห้องว่าง/ไม่ว่างจาก events
  let availableCount = 0;
  let unavailableCount = 0;

  if (events && Array.isArray(events)) {
    events.forEach(room => {
      const isBusy = room.events && room.events.some(ev => {
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

  // ฟังก์ชันสำหรับ filter ตาม room size
  const filterByRoomSize = (size, currentRooms = events) => {
    if (!icons || !Array.isArray(icons)) return [];
    
    // หาห้องที่มี people = size
    const filteredIcons = icons.filter(icon => icon.people === size);
    
    // จับคู่กับข้อมูล events
    const filteredRooms = filteredIcons.map(icon => {
      const matchingRoom = currentRooms.find(room => {
        const roomNumber = String(room.room || '').trim();
        const iconRoom = String(icon.room || '').trim();
        return roomNumber === iconRoom;
      });

      return {
        ...icon,
        events: matchingRoom?.events || [],
        room: icon.room
      };
    });

    return filteredRooms;
  };

  // ฟังก์ชันสำหรับ apply availability filter
  const applyAvailabilityFilter = (rooms, filterType) => {
    if (filterType === "Available") {
      const availableRooms = rooms
        .map(room => {
          const isBusy = room.events && room.events.some(ev => {
            const start = new Date(ev.start.dateTime);
            const end = new Date(ev.end.dateTime);
            start.setHours(start.getHours() + 7);
            end.setHours(end.getHours() + 7);
            return currentTime >= start && currentTime <= end;
          });
          return { ...room, isAvailable: !isBusy };
        })
        .filter(room => room.isAvailable);
      
      return availableRooms;
    } else if (filterType === "Occupied") {
      const unavailableRooms = rooms
        .map(room => {
          const isBusy = room.events && room.events.some(ev => {
            const start = new Date(ev.start.dateTime);
            const end = new Date(ev.end.dateTime);
            start.setHours(start.getHours() + 7);
            end.setHours(end.getHours() + 7);
            return currentTime >= start && currentTime <= end;
          });
          return { ...room, isAvailable: isBusy };
        })
        .filter(room => room.isAvailable);
      
      return unavailableRooms;
    }
    return rooms;
  };

  // ---------- availability handlers ----------
  const handleClickAvailable = () => {
    let roomsToFilter = events;
    
    // ถ้ามี size filter อยู่แล้ว ใช้ห้องที่ถูก filter แล้ว
    if (selectedSize !== "Room") {
      const size = selectedSize === "S" ? 4 : selectedSize === "M" ? 6 : selectedSize === "L" ? 10 : null;
      if (size) {
        roomsToFilter = filterByRoomSize(size);
      }
    }

    const filteredRooms = applyAvailabilityFilter(roomsToFilter, "Available");
    
    if (filteredRooms.length === 0) {
      onFilter([], "available", "There are no rooms available.");
    } else {
      onFilter(filteredRooms, "available");
    }
    
    setSelectedAvailability("Available");
    pushAvailabilityStateToRoute("Available");
    setOpenAvailabilityMenu(false);
  };

  const handleClickUnavailable = () => {
    let roomsToFilter = events;
    
    // ถ้ามี size filter อยู่แล้ว ใช้ห้องที่ถูก filter แล้ว
    if (selectedSize !== "Room") {
      const size = selectedSize === "S" ? 4 : selectedSize === "M" ? 6 : selectedSize === "L" ? 10 : null;
      if (size) {
        roomsToFilter = filterByRoomSize(size);
      }
    }

    const filteredRooms = applyAvailabilityFilter(roomsToFilter, "Occupied");
    
    if (filteredRooms.length === 0) {
      onFilter([], "unavailable", "There are no rooms unavailable.");
    } else {
      onFilter(filteredRooms, "unavailable");
    }
    
    setSelectedAvailability("Occupied");
    pushAvailabilityStateToRoute("Occupied");
    setOpenAvailabilityMenu(false);
  };

  // ---------- size handlers ----------
  const handleSizeChange = (size) => {
    const label = size === 4 ? "S" : size === 6 ? "M" : size === 10 ? "L" : "Room";
    setSelectedSize(label);
    
    // Filter ตาม room size
    const filteredRooms = filterByRoomSize(size);
    
    // ถ้ามี availability filter อยู่ด้วย ให้ apply ด้วย
    let finalRooms = filteredRooms;
    if (selectedAvailability === "Available") {
      finalRooms = applyAvailabilityFilter(filteredRooms, "Available");
    } else if (selectedAvailability === "Occupied") {
      finalRooms = applyAvailabilityFilter(filteredRooms, "Occupied");
    }
    
    if (finalRooms.length === 0) {
      const sizeLabel = size === 4 ? "Small" : size === 6 ? "Medium" : "Large";
      onFilter([], "size", `No ${sizeLabel} rooms found.`);
    } else {
      onFilter(finalRooms, "size");
    }
    
    setOpenMenu1(false);
    console.log("Size filtered:", size, "Label:", label, "Rooms found:", finalRooms.length);
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-stretch sm:justify-end gap-3">
      {/* Availability Dropdown */}
      <div className="relative w-full sm:w-auto" ref={availabilityRef}>
        <RefreshButton
          type="button"
          className={`w-full sm:w-auto rounded-lg px-3 py-2 cursor-pointer text-sm md:text-base border-b-2 ${
            darkMode
              ? "text-white hover:text-blue-400 border-transparent hover:border-blue-400 bg-gray-600"
              : "text-black hover:text-blue-400 border-transparent hover:border-blue-400 bg-gray-300"
          }`}
          onClick={toggleAvailabilityDropdown}
          aria-haspopup="menu"
          aria-expanded={openAvailabilityMenu}
        >
          {selectedAvailability} {openAvailabilityMenu ? "▴" : "▾"}
        </RefreshButton>

        {openAvailabilityMenu && (
          <ul
            role="menu"
            className={`absolute left-0 top-full mt-2 rounded-md shadow-lg z-20 w-full overflow-hidden ${
              darkMode ? "bg-blue-600" : "bg-gray-800"
            }`}
          >
            <li role="none">
              <RefreshButton
                role="menuitem"
                className={`block w-full text-center px-4 py-2 text-white rounded-t-md ${
                  darkMode ? "hover:bg-blue-700" : "hover:bg-gray-700"
                }`}
                onClick={handleClickAvailable}
              >
                Available
              </RefreshButton>
            </li>
            <li role="none">
              <RefreshButton
                role="menuitem"
                className={`block w-full text-center px-4 py-2 text-white rounded-b-md ${
                  darkMode ? "hover:bg-blue-700" : "hover:bg-gray-700"
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
        <div className="relative w-full sm:w-auto" ref={sizeRef}>
          <div
            role="button"
            aria-haspopup="menu"
            aria-expanded={openMenu1}
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
              role="menu"
              className={`absolute left-0 top-full mt-2 rounded-md shadow-lg z-20 w-full overflow-hidden ${
                darkMode ? "bg-blue-600" : "bg-gray-800"
              }`}
            >
              {[4, 6, 10].map((size) => (
                <li key={size} role="none">
                  <RefreshButton
                    role="menuitem"
                    className={`flex justify-center items-center w-full text-center px-4 py-2 text-white whitespace-nowrap ${
                      darkMode ? "hover:bg-blue-700" : "hover:bg-gray-700"
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