import React,{useState, useEffect} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Roomcard from './Roomcard';
import Roomdata from './Roomdata';
import RefreshButton from "../utils/refreshToken"; // Assuming you have a RefreshButton component
import axios from 'axios';

function Available() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

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
    <div className='font-display'>
        <nav className='shadow-md p-6 items-center md:flex justify-between bg-[#000042] text-white sticky top-0 z-40'>
            <div className="md:text-2xl text-xl underline underline-offset-10">Conference Room</div>
            <ul className='flex text-center md:ml-5 max-md:mb-10 max-md:mt-10'>
                <RefreshButton className='mr-5 cursor-pointer hover:text-gray-300' onClick={() => navigate('/admin/api')}>Home</RefreshButton>
                <li className='md:mr-5 lg:mx-5 cursor-pointer hover:text-gray-300' onClick={toggleDropdown1}>Size Room {openMenu1 ? '▴' : '▾'}
                  {openMenu1 && (
            <ul className="absolute mt-2 w-25 bg-blue-700 rounded-md shadow-lg z-10">
              <RefreshButton 
                className="px-4 py-2 hover:bg-blue-400 rounded-md cursor-pointer"
                onClick={() => handleSizeNavigate(2)}
              >
                Size S
              </RefreshButton>
              <RefreshButton 
                className="px-4 py-2 hover:bg-blue-400  rounded-md cursor-pointer"
                onClick={() => handleSizeNavigate(4)}
              >
                Size M
              </RefreshButton>
              <RefreshButton 
                className="px-4 py-2 hover:bg-blue-400  rounded-md cursor-pointer"
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
      <Roomdata rooms={allRooms} currentTime={new Date()} icons={icons}/>
      <div className='bg-[#f8f7f1] p-4 mx-2 rounded-3xl shadow-xl'>
      <Roomcard data={rooms} icons={icons} />
      </div>
    </div>
  );
}

export default Available;
