import { useState ,useEffect} from 'react'
import Roomcard from './Roomcard';
import Roomdata from './Roomdata';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import RefreshButton from "../utils/refreshToken"; // Assuming you have a RefreshButton component
import Navbar from './navbar.jsx';
import { useDarkMode } from './Context/DarkModeContext';
import {CircularProgress,} from '@mui/material';
import LinearProgress from '@mui/material/LinearProgress';

function RoomPage() {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const location = useLocation();
    const navigate = useNavigate(); 
    const [openMenu1, setOpenMenu1] = useState(false); 
    const [events, setEvents] = useState([]);
    const { darkMode } = useDarkMode();

    useEffect(() => {
  const code = new URLSearchParams(location.search).get("code");
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "/admin/login";
    return;
  }

  const eventSource = new EventSource(`/admin/sse?code=${code}&token=${token}`);

  eventSource.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      setEvents(data.results);
      console.log("SSE data received:", data.results);
      setLoading(false);
    } catch (err) {
      console.error("Error parsing SSE data:", err);
      setLoading(false);
    }
  };

  // ✅ ดัก forceLogout
  eventSource.addEventListener("forceLogout", (event) => {
    try {
      const data = JSON.parse(event.data);
      alert(data.error);
      window.location.href = "/admin/login";
    } catch (err) {
      console.error("Error in forceLogout:", err);
    }
  });

  eventSource.onerror = (err) => {
    console.error("SSE error:", err);
    setLoading(false);
    eventSource.close();
    window.location.href = "/admin/login";
  };

  return () => {
    eventSource.close();
  };
}, []);

  
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
    const processedRooms = events.map((room) => {
      const isBusy = room.events.some(ev => {
        const start = new Date(ev.start.dateTime);
        const end = new Date(ev.end.dateTime);
        return currentTime >= start && currentTime <= end;
      });
      const available = !isBusy;
      return { ...room, available };
    });
  // นับจำนวนห้องว่าง / ไม่ว่าง
  const availableCount = processedRooms.filter(r => r.available).length;
  const unavailableCount = processedRooms.length - availableCount;

      const mock_Total = [
    {id: 1, Name: "Room Available", count: availableCount, total: events.length}, 
    {id: 2, Name: "Room Unavailable", count: unavailableCount, total: events.length}
  ];
  const iconClass = [
    {id:1, room: "1501", icons: 1, people: 4},
    {id:2, room: "1502", icons: 1, people: 4},
    {id:3, room: "1503", icons: 1, people: 4},
    {id:4, room: "1504", icons: 1, people: 4},
    {id:5, room: "1505", icons: 2, people: 6},
    {id:6, room: "1506", icons: 2, people: 6},
    {id:7, room: "1514", icons: 3, people: 10},
    {id:8, room: "1515", icons: 3, people: 10},
    {id:9, room: "1519", icons: 1, people: 4},
    {id:10, room: "1520", icons: 1,people: 4},
  ];
      const handleSizeNavigate = (peopleSize) => {
        navigate(`/roomsize/${peopleSize}`, {
          state: {
            icons: iconClass,     // ส่งทั้งหมดไปเลย
            peopleSize: peopleSize,  // ส่งตัวแปร filter ไปใช้ในหน้าถัดไป
            rooms: events 
          }
        });
      };
  const toggleDropdown1 = () => setOpenMenu1(prev => !prev);
        
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
        <Roomdata rooms={events} currentTime={new Date()} icons={iconClass}/>
        <div className={`p-4 mx-2 rounded-3xl shadow-xl transition-colors duration-300 ${
          darkMode ? 'bg-gray-800' : 'bg-[#f8f7f1]'
        }`}>
        {loading ? (
          <div className={`flex justify-center py-20 gap-[5px] transition-colors duration-300 ${
            darkMode ? 'text-white' : 'text-black'
          }`}>
            <span>loading</span>
            <CircularProgress size="25px"/>

          </div>
            ) : (
              <Roomcard data={events} icons={iconClass} />
            )}
        </div>
  </div>
  );
}


export default  RoomPage;
