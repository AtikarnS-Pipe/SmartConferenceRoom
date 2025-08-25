import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Roomcard from './Roomcard';
import RefreshButton from "../utils/refreshToken";
import axios from 'axios';
import Header from './Header.jsx';
import { useDarkMode } from './Context/DarkModeContext';
import { CircularProgress } from '@mui/material';
import ButtonFilter from './ButtonFilter';
import Statscard from './Statscard';
import { Users } from 'lucide-react';

function RoomSize() {
  const location = useLocation();
  const { size } = useParams();
  const peopleSize = Number(size);
  const [profile, setProfile] = useState(null);
  
  // ✅ Fix: รับข้อมูลจาก location.state แล้วใช้ข้อมูลสดจาก SSE
  const { 
    rooms = [], 
    icons = [], 
    resetFilter = false,
    preserveAvailabilityFilter = "Availability" // ✅ เพิ่ม: รับค่า availability filter
  } = location.state || {};
  
  const [filteredRoom, setFilteredRoom] = useState([]);
  const [filterType, setFilterType] = useState(null);
  const [emptyMessage, setEmptyMessage] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate(); 
  const [openMenu1, setOpenMenu1] = useState(false); 
  const [selectedSize, setSelectedSize] = useState(location.state?.selectedSize || "Room");
  const { darkMode } = useDarkMode();
  
  // ✅ Add: state สำหรับข้อมูลสด
  const [liveEvents, setLiveEvents] = useState(rooms);
  const [loading, setLoading] = useState(false);

  // ✅ Add: state สำหรับ preserve availability filter
  const [currentAvailabilityFilter, setCurrentAvailabilityFilter] = useState(preserveAvailabilityFilter);

  // ✅ Add: อัพเดท current availability filter เมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    setCurrentAvailabilityFilter(preserveAvailabilityFilter);
  }, [preserveAvailabilityFilter]);

  // ✅ Add: ดึงข้อมูลสดจาก SSE เมื่อเข้าหน้า
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoading(true);
    const eventSource = new EventSource(`/admin/sse?token=${token}`);

    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        console.log("Live data received in RoomSize:", data.results?.length);
        setLiveEvents(data.results || []);
        setLoading(false);
      } catch (err) {
        console.error("Error parsing SSE data:", err);
        setLoading(false);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE error:", err);
      setLoading(false);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // ✅ Fix: Reset filter เมื่อมี resetFilter flag
  useEffect(() => {
    if (resetFilter) {
      console.log("Resetting filters due to resetFilter flag");
      setFilteredRoom([]);
      setFilterType(null);
      setEmptyMessage("");
    }
  }, [resetFilter]);

  // ✅ Add: ฟังก์ชันสำหรับ apply availability filter อัตโนมัติ
  const applyAvailabilityFilter = (rooms, filterType) => {
    if (filterType === "Available") {
      const availableRooms = rooms
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
      
      if (availableRooms.length === 0) {
        handleRoomFilter([], "available", "There are no rooms available.");
      } else {
        handleRoomFilter(availableRooms, "available");
      }
    } else if (filterType === "Occupied") {
      const unavailableRooms = rooms
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
      
      if (unavailableRooms.length === 0) {
        handleRoomFilter([], "unavailable", "There are no rooms unavailable.");
      } else {
        handleRoomFilter(unavailableRooms, "unavailable");
      }
    }
  };

  const handleGoHome = () => {
    navigate('/admin/api');
  };

  const handleSizeNavigate = (size) => {
    const label = size === 4 ? 'S' : size === 6 ? 'M' : size === 10 ? 'L' : 'Room';
    navigate(`/roomsize/${size}`, {
      state: {
        icons: icons,
        rooms: liveEvents, // ✅ ใช้ข้อมูลสด
        peopleSize: size,
        selectedSize: label
      }
    });
  };

  const toggleDropdown1 = () => setOpenMenu1(prev => !prev);
  
  useEffect(() => {
    // ✅ Fix: อัพเดท selectedSize ให้ตรงกับ peopleSize
    const label = peopleSize === 4 ? 'S' : peopleSize === 6 ? 'M' : peopleSize === 10 ? 'L' : 'Room';
    if (selectedSize !== label) {
      setSelectedSize(label);
    }

    // ✅ เฉพาะเมื่อ resetFilter = false ถึงจะไม่ reset filter
    if (resetFilter) {
      setFilteredRoom([]);
      setFilterType(null);
      setEmptyMessage("");
    }
  }, [peopleSize, selectedSize, resetFilter]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    axios.get('/account/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setProfile(res.data);
        console.log("Profile data fetched:", res.data);
      })
      .catch(err => console.error(err));
  }, []);

  const handleNavigateByRole = () => {
    const role = localStorage.getItem('role');
    console.log("Navigating based on role:", role);
    if (role === 'Superadmin') {
      navigate('/account/superadmin');
    } else if (role === 'Admin') {
      navigate('/account/admin');
    } else {
      navigate('/');
    }
  };

  // ✅ อัพเดทฟังก์ชัน handleRoomFilter เพื่อรับ message
  const handleRoomFilter = (rooms, type, message = "") => {
    setFilteredRoom(rooms);
    setFilterType(type);
    setEmptyMessage(message);
  };

  // ✅ FIX: ปรับปรุงฟังก์ชัน clearAllFilters ให้กลับไปหน้าหลัก
  const clearAllFilters = () => {
    console.log("Clear all filters called from RoomSize");
    // Navigate กลับไปหน้าหลัก (Admin.jsx) พร้อมรีเซ็ต state
    navigate('/admin/api', {
      state: {
        selectedSize: "Room",
        clearFilters: true
      }
    });
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ✅ Fix: ใช้ peopleSize แทน selectedSize ในการกรอง และใช้ข้อมูลสด
  const filteredIcons = icons.filter(icon => icon.people === peopleSize);

  // ✅ Fix: ปรับปรุงการจับคู่ข้อมูล - ใช้ข้อมูลสดแทน
  const filteredRooms = filteredIcons.map(icon => {
    const matchingRoom = liveEvents.find(room => {
      // ✅ เช็คทั้ง room property และ room number
      const roomNumber = String(room.room || '').trim();
      const iconRoom = String(icon.room || '').trim();
      return roomNumber === iconRoom;
    });

    console.log(`Matching room for icon ${icon.room}:`, matchingRoom ? 'Found' : 'Not found');

    return {
      ...icon,
      // ✅ ส่งข้อมูล events ที่ถูกต้อง
      events: matchingRoom?.events || [],
      room: icon.room // ให้แน่ใจว่า room number ถูกต้อง
    };
  });

  // ✅ Add: Apply availability filter อัตโนมัติเมื่อข้อมูลพร้อม
  useEffect(() => {
    if (filteredRooms.length > 0 && preserveAvailabilityFilter && preserveAvailabilityFilter !== "Availability") {
      console.log("Auto-applying availability filter:", preserveAvailabilityFilter);
      applyAvailabilityFilter(filteredRooms, preserveAvailabilityFilter);
    }
  }, [filteredRooms.length, preserveAvailabilityFilter, currentTime]);

  console.log("=== RoomSize Debug Info ===");
  console.log("People size:", peopleSize);
  console.log("Selected size:", selectedSize);
  console.log("Preserve availability filter:", preserveAvailabilityFilter);
  console.log("Icons:", icons.length);
  console.log("Live events:", liveEvents.length);
  console.log("Filtered icons:", filteredIcons.length);
  console.log("Filtered rooms:", filteredRooms.length);
  console.log("Filtered rooms data:", filteredRooms.map(r => ({
    room: r.room,
    people: r.people,
    hasEvents: r.events?.length > 0
  })));

  if (filteredRooms.length === 0) {
    return (
      <div className={`font-display min-h-screen transition-colors duration-300 ${
        darkMode ? 'bg-gray-900' : 'bg-white'
      }`}>
        <Header 
          selectedSize={selectedSize} 
          setSelectedSize={setSelectedSize}
          events={liveEvents}
          clearAllFilters={clearAllFilters}
        />
        <div className={`p-10 text-xl transition-colors duration-300 ${
          darkMode ? 'text-white' : 'text-black'
        }`}>
          ไม่พบห้องสำหรับ {peopleSize} คน
        </div>
      </div>
    );
  }

  return (
    <div className={`font-display min-h-screen transition-colors duration-300 ${
      darkMode ? 'bg-gray-700' : 'bg-white'
    }`}>
      <Header 
        selectedSize={selectedSize} 
        setSelectedSize={setSelectedSize}
        events={liveEvents} // ✅ ใช้ข้อมูลสด
        clearAllFilters={clearAllFilters}
      />
      <Statscard 
            darkMode={darkMode}
            rooms={filteredRooms}
            currentTime={new Date()}
            onFilter={handleRoomFilter}
            
            // ปิดการแสดง Housekeeper และ Admin cards
            showHousekeeper={false}
            showAdmin={false}
            showRoomStatus={true}  // แสดงเฉพาะ Room Status
      />
      
         
      
      <div className={`pb-4 mx-[8px] md:mx-[24px] rounded-xl shadow-sm transition-colors duration-300 ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
            }`}>
            <div className='flex gap-2 flex-col items-start md:flex-row md:items-center md:justify-between p-[24px]'>
              {/* โลโก้ + ชื่อ */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <h1
                  className={`text-lg font-medium transition-colors duration-300 ${
                    darkMode ? 'text-white' : 'text-black'
                  }`}
                >
                  Meeting Room
                </h1>
              </div>
        <ButtonFilter
        selectedSize={selectedSize}
        setSelectedSize={setSelectedSize}
        clearAllFilters={clearAllFilters}
        events={filteredRooms}
        onFilter={handleRoomFilter}
        currentTime={currentTime}
        preserveAvailabilityFilter={currentAvailabilityFilter} // ✅ ใช้ state แทน prop ตรงๆ
      /> 
      </div>
        {loading ? (
          <div className={`flex justify-center py-20 gap-[5px] transition-colors duration-300 ${
            darkMode ? 'text-white' : 'text-black'
          }`}>
            <span>Loading room data...</span>
            <CircularProgress size="25px"/>
          </div>
        ) : (
          <Roomcard 
            data={filteredRoom.length > 0 ? filteredRoom : filteredRooms} 
            icons={icons} 
            filterType={filterType}
            emptyMessage={emptyMessage}
            selectedSize={selectedSize} 
            setSelectedSize={setSelectedSize} 
            events={filteredRooms} 
            clearAllFilters={clearAllFilters}
          />
        )}
      </div>
    </div>
  );
}

export default RoomSize;