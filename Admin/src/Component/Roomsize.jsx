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

function RoomSize() {
  const location = useLocation();
  const { size } = useParams();
  const peopleSize = Number(size);
  const [profile, setProfile] = useState(null);
  const { rooms = [], icons = [], resetFilter = false } = location.state || {};
  const [filteredRoom, setFilteredRoom] = useState([]);
  const [filterType, setFilterType] = useState(null);
  const [emptyMessage, setEmptyMessage] = useState(""); // ✅ เพิ่ม state สำหรับข้อความว่าง
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate(); 
  const [openMenu1, setOpenMenu1] = useState(false); 
  const [selectedSize, setSelectedSize] = useState(location.state?.selectedSize || "Room");
  const { darkMode } = useDarkMode();

  // ✅ Fix: Reset filter เมื่อมี resetFilter flag
  useEffect(() => {
    if (resetFilter) {
      console.log("Resetting filters due to resetFilter flag");
      setFilteredRoom([]);
      setFilterType(null);
      setEmptyMessage(""); // ✅ รีเซ็ตข้อความว่างด้วย
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
        rooms: rooms,
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
      setEmptyMessage(""); // ✅ รีเซ็ตข้อความว่างด้วย
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

  useEffect(() => {
    if (profile) {
      console.log("Profile state updated:", profile);
    }
  }, [profile]);

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
    setEmptyMessage(message); // ตั้งค่าข้อความว่าง
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ✅ Fix: ใช้ peopleSize แทน selectedSize ในการกรอง
  const filteredIcons = icons.filter(icon => icon.people === peopleSize);

  // map rooms ที่ match กับ icons
  const filteredRooms = filteredIcons.map(icon => {
    const matchingRoom = rooms.find(room => String(room.room).trim() === String(icon.room).trim());

    return {
      ...icon,
      events: matchingRoom?.events || [],
    };
  });

  console.log("Filtered rooms:", filteredRooms.length, "for size:", peopleSize);
  console.log("Selected size state:", selectedSize);

  if (filteredRooms.length === 0) {
    return (
      <div className={`font-display min-h-screen transition-colors duration-300 ${
        darkMode ? 'bg-gray-900' : 'bg-white'
      }`}>
        <Header 
          selectedSize={selectedSize} 
          setSelectedSize={setSelectedSize}
          events={rooms}
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
        events={rooms}
      />
      <Roomdata 
        rooms={filteredRooms} 
        currentTime={new Date()} 
        icons={icons} 
        onFilter={handleRoomFilter} 
      />
      <div className={`p-4 mx-2 rounded-3xl shadow-xl transition-colors duration-300 ${
        darkMode ? 'bg-gray-800' : 'bg-[#f8f7f1]'
      }`}>
        <Roomcard 
          data={filteredRoom.length > 0 ? filteredRoom : filteredRooms} 
          icons={filteredIcons} 
          filterType={filterType}
          emptyMessage={emptyMessage} // ✅ ส่ง emptyMessage ไปด้วย
        />
      </div>
    </div>
  );
}

export default RoomSize;