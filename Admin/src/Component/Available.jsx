import React,{useState, useEffect} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Roomcard from './Roomcard';
import Roomdata from './Roomdata';
import RefreshButton from "../utils/refreshToken"; // Assuming you have a RefreshButton component
import axios from 'axios';
import Navbar from './navbar.jsx';
import { useDarkMode } from './Context/DarkModeContext';

function Available() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const { darkMode } = useDarkMode();

  // เพิ่ม state แยกให้กับ rooms และ icons
  const [rooms, setRooms] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [icons, setIcons] = useState([]);
  const [profile, setProfile] = useState(null);
  const [openMenu1, setOpenMenu1] = useState(false); 
  const [openMenu2, setOpenMenu2] = useState(false); 
  const toggleDropdown1 = () => setOpenMenu1(prev => !prev);
  const toggleDropdown2 = () => setOpenMenu2(prev => !prev);

  useEffect(() => {
    const state = location.state;

    if (state?.rooms) setRooms(state.rooms);
    if (state?.allRooms) setAllRooms(state.allRooms);
    if (state?.icons) setIcons(state.icons);

    if (!state || !Array.isArray(state.icons) || state.icons.length === 0) {
      navigate("/", { replace: true });
    }
  }, [location.state]);
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
  const role = profile?.role; // ดึง role จาก localStorage
    console.log("Navigating based on role:", role);
  if (role === 'Superadmin') {
    navigate('/account/superadmin');
  } else if (role === 'Admin') {
    navigate('/account/admin');
  } else {
    navigate('/'); // สำรองเผื่อ role อื่นหรือไม่มี role
  }
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
      const handleSizeNavigate = (peopleSize) => {
        navigate(`/roomsize/${peopleSize}`, {
          state: {
            icons: icons,     // ส่งทั้งหมดไปเลย
            peopleSize: peopleSize,  // ส่งตัวแปร filter ไปใช้ในหน้าถัดไป
            rooms: allRooms 
          }
        });
      };

  return (
    <div className={`font-display min-h-screen transition-colors duration-300 ${
      darkMode ? 'bg-gray-700' : 'bg-white'
    }`}>
        <Navbar 
          navigate={navigate}
          toggleDropdown1={toggleDropdown1}
          openMenu1={openMenu1}
          handleSizeNavigate={handleSizeNavigate}
          handleNavigateByRole={handleNavigateByRole}
          timeString={timeString}
          dateString={dateString}
        />
      <Roomdata rooms={allRooms} currentTime={new Date()} icons={icons} />
  <div className={`p-4 mx-2 rounded-3xl shadow-xl transition-colors duration-300 ${
    darkMode ? 'bg-gray-800' : 'bg-[#f8f7f1]'
  }`}>
    {rooms.length === 0 ? (
      <div className={`flex justify-center item-center text-xl p-20 transition-colors duration-300 ${
        darkMode ? 'text-gray-400' : 'text-gray-500'
      }`}>No rooms are currently available.</div>
        ) : (
          <Roomcard data={rooms} icons={icons} />
        )}
      </div>
    </div>
  );
}

export default Available;
