import { useState ,useEffect} from 'react'
import Roomcard from './Roomcard';
import Roomdata from './Roomdata';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import RefreshButton from "../utils/refreshToken"; // Assuming you have a RefreshButton component


function RoomPage() {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const location = useLocation();
    const navigate = useNavigate(); 
    const [openMenu1, setOpenMenu1] = useState(false); 
    const [events, setEvents] = useState([]);

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
    {id:1, room: "1501", icons: 2, people: 4},
    {id:2, room: "1502", icons: 2, people: 4},
    {id:3, room: "1503", icons: 1, people: 2},
    {id:4, room: "1504", icons: 1, people: 2},
    {id:5, room: "1505", icons: 2, people: 4},
    {id:6, room: "1506", icons: 2, people: 4},
    {id:7, room: "1514", icons: 3, people: 6},
    {id:8, room: "1515", icons: 3, people: 6},
    {id:9, room: "1519", icons: 1, people: 2},
    {id:10, room: "1520", icons: 1,people: 2},
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
    <div className='font-display'>
       <nav className='shadow-md p-6 items-center md:flex justify-between bg-[#000042] text-white sticky top-0 z-40'>
                   <div className="md:text-2xl text-xl underline underline-offset-10">Conference Room</div>
                   <ul className='flex text-center md:ml-5 max-md:mb-10 max-md:mt-10'>
                       <RefreshButton className='mr-5 cursor-pointer hover:text-gray-300' onClick={() => navigate('/admin/api')}>Home</RefreshButton>
                       <li className='md:mr-5 lg:mx-5 cursor-pointer hover:text-gray-300' onClick={toggleDropdown1}>Size Room {openMenu1 ? '▴' : '▾'}
                         {openMenu1 && (
                   <ul className="absolute mt-2 w-25 bg-blue-700 rounded-md shadow-lg z-10">
                     <RefreshButton 
                       className="px-6.5 py-2 hover:bg-blue-400 rounded-md cursor-pointer"
                       onClick={() => handleSizeNavigate(2)}
                     >
                       Size S
                     </RefreshButton>
                     <RefreshButton 
                       className="px-6 py-2 hover:bg-blue-400  rounded-md cursor-pointer"
                       onClick={() => handleSizeNavigate(4)}
                     >
                       Size M
                     </RefreshButton>
                     <RefreshButton 
                       className="px-6.5 py-2 hover:bg-blue-400  rounded-md cursor-pointer"
                       onClick={() => handleSizeNavigate(6)}
                     >
                       Size L
                     </RefreshButton>
                   </ul>
                 )}
                 </li>
                 <RefreshButton>
                   <h1 className='cursor-pointer hover:text-gray-300' onClick={handleNavigateByRole}>Management</h1>
                 </RefreshButton>
                   </ul>
                   <div className=' max-md:flex'>
                       <h2 className='md:text-2xl max-md:mr-5'>{timeString}</h2>
                       <h4 className=''>{dateString}</h4> 
                   </div>
               </nav>
        <Roomdata rooms={events} currentTime={new Date()} icons={iconClass}/>
        <div className='bg-[#f8f7f1] p-4 mx-2 rounded-3xl shadow-xl'>
        <Roomcard data={events} icons={iconClass}  />
        </div>
    </div>
  )
}


export { RoomPage } 
