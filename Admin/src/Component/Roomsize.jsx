import React from 'react';
import { useLocation,useNavigate,useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Roomdata from './Roomdata';
import Roomcard from './Roomcard';
import RefreshButton from "../utils/refreshToken"; // Assuming you have a RefreshButton component
import axios from 'axios';
import Navbar from './navbar.jsx';
import { useDarkMode } from './Context/DarkModeContext';

function RoomSize() {
  const location = useLocation();
  const { size } = useParams();          // size มาจาก URL เช่น /roomsize/4
  const peopleSize = Number(size);       // แปลงเป็น number ถ้าจำเป็น
  const [profile, setProfile] = useState(null);
  const { rooms = [], icons = []  } = location.state || {};
  const [filteredRoom, setFilteredRoom] = useState([]);
  const [filterType, setFilterType] = useState(null); // "available" | "unavailable" | null
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate(); 
  const [openMenu1, setOpenMenu1] = useState(false); 
  const [selectedSize, setSelectedSize] = useState(peopleSize);
  const { darkMode } = useDarkMode();

  const handleGoHome = () => {
  navigate('/admin/api');
};
  const handleSizeNavigate = (size) => {
        navigate(`/roomsize/${size}`, {
          state: {
            icons: icons,     // ส่งทั้งหมดไปเลย
            rooms: rooms,  // ส่งตัวแปร filter ไปใช้ในหน้าถัดไป
            peopleSize: size
          }
        });
      };
  const toggleDropdown1 = () => setOpenMenu1(prev => !prev);
  useEffect(() => {
  if (peopleSize !== selectedSize) {
    setSelectedSize(peopleSize);
  }
}, [peopleSize]);

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
    const role = localStorage.getItem('role'); // ดึง role จาก localStorage
      console.log("Navigating based on role:", role);
    if (role === 'Superadmin') {
      navigate('/account/superadmin');
    } else if (role === 'Admin') {
      navigate('/account/admin');
    } else {
      navigate('/'); // สำรองเผื่อ role อื่นหรือไม่มี role
    }
  };
    const handleRoomFilter = (rooms, type) => {
      setFilteredRoom(rooms);
      setFilterType(type);
    };

  useEffect(() => {
        const timer = setInterval(() => {
          setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const dateString = currentTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Bangkok'
    });
    const timeString = currentTime.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'Asia/Bangkok'
    });
    

  // กรอง icons ที่ตรงกับจำนวนคน
 const filteredIcons = icons.filter(icon => icon.people === selectedSize);

  // map rooms ที่ match กับ icons
  const filteredRooms = filteredIcons.map(icon => {
  const matchingRoom = rooms.find(room => String(room.room).trim() === String(icon.room).trim());

    return {
      ...icon,
      events: matchingRoom?.events || [],
    };
  });

  if (filteredRooms.length === 0) {
    return (
      <div className={`font-display min-h-screen transition-colors duration-300 ${
        darkMode ? 'bg-gray-90' : 'bg-white'
      }`}>
        <div className={`p-10 text-xl transition-colors duration-300 ${
          darkMode ? 'text-white' : 'text-black'
        }`}>ไม่พบห้องสำหรับ {peopleSize} คน</div>
      </div>
    );
  }

  return (
    <div className={`font-display min-h-screen transition-colors duration-300 ${
      darkMode ? 'bg-gray-700' : 'bg-white'
    }`}>
        <Roomdata rooms={rooms} currentTime={new Date()} icons={icons}/>
      <div className={`p-4 mx-2 rounded-3xl shadow-xl transition-colors duration-300 ${
        darkMode ? 'bg-gray-800' : 'bg-[#f8f7f1]'
      }`}>
        {/* <Roomcard data={filteredRoom.length > 0 ? filteredRoom : filteredRooms} icons={filteredIcons} filterType={filterType} /> */}
        <Roomcard data={filteredRooms} icons={filteredIcons} filterType={filterType} />
      </div>
    </div>
  );
}

export default RoomSize;
