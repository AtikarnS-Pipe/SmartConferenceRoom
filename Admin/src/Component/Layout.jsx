import React, { createContext, useContext, useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './navbar';
import axios from 'axios';

const RoomFilterContext = createContext();

export const useRoomFilter = () => useContext(RoomFilterContext);

const Layout = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [openMenu1, setOpenMenu1] = useState(false);
  const [events, setEvents] = useState([]);
  const [filteredRoom, setFilteredRoom] = useState([]);
  const [filterType, setFilterType] = useState(null); // "available" | "unavailable" | null
  const [outletKey, setOutletKey] = useState(Date.now());
  const navigate = useNavigate();
  const location = useLocation();

  const onResetFilter = () => {
    setFilteredRoom([]);
    setFilterType(null);
    setOutletKey(Date.now());
  };

  // ลบ SSE connection เดิมออกแล้ว เพราะใช้ useUserData hook แทน
  // useEffect(() => {
  //   // SSE logic removed - handled by useUserData hook in individual components
  // }, [location.search]);

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

  const toggleDropdown1 = () => setOpenMenu1(prev => !prev);

  const handleSizeNavigate = (peopleSize) => {
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

    if (window.location.pathname.includes('/room/')) {
      navigate('/admin/api', { state: { size: peopleSize } });
    } else {
      navigate(`/roomsize/${peopleSize}`, {
        state: {
          icons: iconClass,
          peopleSize: peopleSize,
          rooms: events
        }
      });
    }
    setOpenMenu1(false);
  };


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

  return (
    <RoomFilterContext.Provider value={{
      filteredRoom, setFilteredRoom,
      filterType, setFilterType,
      onResetFilter
    }}>
      <Navbar
        navigate={navigate}
        toggleDropdown1={toggleDropdown1}
        openMenu1={openMenu1}
        handleSizeNavigate={handleSizeNavigate}
        handleNavigateByRole={handleNavigateByRole}
        timeString={timeString}
        dateString={dateString}
        showSizeRoom={!window.location.pathname.includes('/room/')}
      />
      <Outlet key={outletKey} />
    </RoomFilterContext.Provider>
  );
};

export default Layout;