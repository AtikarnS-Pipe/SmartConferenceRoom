import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Roomdata from './Roomdata';
import Roomcard from './Roomcard';
import RefreshButton from "../utils/refreshToken";
import axios from 'axios';
import Header from './Header.jsx';
import Navbar from './navbar.jsx';
import { useDarkMode } from './Context/DarkModeContext';
import { CircularProgress } from '@mui/material';
import ButtonFilter from './ButtonFilter';
import Statscard from './Statscard';

function RoomSize() {
  const location = useLocation();
  const { size } = useParams();
  const peopleSize = Number(size);
  const [profile, setProfile] = useState(null);
  
  // ✅ Fix: รับข้อมูลจาก location.state แล้วใช้ข้อมูลสดจาก SSE
  const { rooms = [], icons = [], resetFilter = false } = location.state || {};
  
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
      // Reset filter state when size changes
      setFilteredRoom([]);
      setFilterType(null);
      setEmptyMessage("");
    }
  }, [peopleSize, selectedSize]);

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

  console.log("=== RoomSize Debug Info ===");
  console.log("People size:", peopleSize);
  console.log("Selected size:", selectedSize);
  console.log("Icons:", icons.length);
  console.log("Live events:", liveEvents.length);
  console.log("Filtered icons:", filteredIcons.length);
  console.log("Filtered rooms:", filteredRooms.length);
  console.log("Filtered rooms data:", filteredRooms.map(r => ({
    room: r.room,
    people: r.people,
    hasEvents: r.events?.length > 0
  })));

  // if (loading) {
  //   return (
  //     <div className={`font-display min-h-screen transition-colors duration-300 ${
  //       darkMode ? 'bg-gray-700' : 'bg-white'
  //     }`}>
  //       <Header 
  //         selectedSize={selectedSize} 
  //         setSelectedSize={setSelectedSize}
  //         events={liveEvents}
  //         clearAllFilters={clearAllFilters}
  //       />
  //       <div className="flex justify-center items-center py-20">
  //         <div className="text-center">
  //           <CircularProgress size="40px"/>
  //           <p className={`mt-4 ${darkMode ? 'text-white' : 'text-black'}`}>
  //             Loading room data...
  //           </p>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

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
      
         
      
      <div className={`p-4 mx-2 rounded-3xl shadow-xl transition-colors duration-300 ${
        darkMode ? 'bg-gray-800' : 'bg-gray-200'
      }`}>
        <div className='sm:flex items-center justify-between px-8 pb-4'>
            <h1 className={`text-xl font-semibold transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-black'
            }`}>
                Meeting Room Status
            </h1>
        <ButtonFilter
        selectedSize={selectedSize}
        setSelectedSize={setSelectedSize}
        clearAllFilters={clearAllFilters}
        events={filteredRooms}
        onFilter={handleRoomFilter}
        currentTime={currentTime}
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