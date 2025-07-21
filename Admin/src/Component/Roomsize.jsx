import React from 'react';
import { useLocation,useNavigate,useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Roomdata from './Roomdata';
import Roomcard from './Roomcard';

function RoomSize() {
  const location = useLocation();
  const { size } = useParams();          // size มาจาก URL เช่น /roomsize/4
  const peopleSize = Number(size);       // แปลงเป็น number ถ้าจำเป็น
  const { rooms = [], icons = [] } = location.state || {};
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate(); 
  const [openMenu1, setOpenMenu1] = useState(false); 
  const [selectedSize, setSelectedSize] = useState(peopleSize);
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
    return <div className="p-10 text-xl">ไม่พบห้องสำหรับ {peopleSize} คน</div>;
  }

  return (
    <div className='font-display'>
      <nav className='shadow-md p-6 items-center md:flex justify-between bg-[#000042] text-white sticky top-0 z-40'>
            <div className="md:text-2xl text-xl underline underline-offset-10 ">Conference Room</div>
            <ul className='flex text-center md:ml-5 max-md:mb-10 max-md:mt-10'>
                <li className='mr-5 cursor-pointer' onClick={()=>navigate('/admin/api')}>Home</li>
                <li className='md:mr-5 lg:mx-5 cursor-pointer' onClick={toggleDropdown1}>Size Room {openMenu1 ? '▴' : '▾'}
                  {openMenu1 && (
            <ul className="absolute mt-2 w-25 bg-blue-700 rounded-md shadow-lg z-10">
              <li 
                className="px-4 py-2 hover:bg-blue-400 rounded-md cursor-pointer"
                onClick={() => handleSizeNavigate(2)}
              >
                Size S
              </li>
              <li 
                className="px-4 py-2 hover:bg-blue-400  rounded-md cursor-pointer"
                onClick={() => handleSizeNavigate(4)}
              >
                Size M
              </li>
              <li 
                className="px-4 py-2 hover:bg-blue-400  rounded-md cursor-pointer"
                onClick={() => handleSizeNavigate(6)}
              >
                Size L
              </li>
            </ul>
          )}
          </li>
          <li>
            <h1 className='cursor-pointer' onClick={()=>navigate('/account/admin')}>Management</h1>
          </li>
            </ul>
            <div className=' max-md:flex'>
                <h2 className='md:text-2xl max-md:mr-5'>{timeString}</h2>
                <h4 className=''>{dateString}</h4> 
            </div>
        </nav>
        <Roomdata rooms={rooms} currentTime={new Date()} icons={icons}/>
      <div className='bg-[#f8f7f1] p-4 mx-2 rounded-3xl shadow-xl'>
        <Roomcard data={filteredRooms} icons={filteredIcons} />
      </div>
    </div>
  );
}

export default RoomSize;
