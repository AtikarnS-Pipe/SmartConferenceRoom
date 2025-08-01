import React, { useEffect, useState } from 'react'
import { MdPeople } from "react-icons/md";
import { FaClock } from "react-icons/fa6";
import { IoPerson } from "react-icons/io5";
import { useNavigate } from 'react-router-dom';
import RefreshButton from "../utils/refreshToken"; // Assuming you have a RefreshButton component
import { useDarkMode } from './Context/DarkModeContext';
import Myicons from '../assets/board-meeting 1.svg'; // Assuming you have a MyIcons context or file
import Icons from '../assets/meeting 1.svg'; // Assuming you have a JSON file with icons data

function Roomcard(props) {
  const { data, icons } = props
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();
  const { darkMode } = useDarkMode();
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const parseTime = (timeStr) => {
    const date = new Date(timeStr);
    date.setHours(date.getHours() + 7); // ปรับเป็นเวลาประเทศไทย (UTC+7)
    return date;
  };
  const roomNameMap = {
    '1501': '15/01',
    '1502': '15/02',
    '1503': '15/03',
    '1504': '15/04',
    '1505': '15/05',
    '1506': '15/06',
    '1514': '15/14',
    '1515': '15/15',
    '1519': '15/19',
    '1520': '15/20',
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 px-2 sm:px-4 md:px-6">
      {data.map((d, index) => {
        const isAvailable = !d.events.some((event) => {
          const start = parseTime(event.start.dateTime);
          const end = parseTime(event.end.dateTime);
          return currentTime >= start && currentTime < end;
        });

        const statusColor = isAvailable ? "bg-green-500" : "bg-red-500";

        const renderIcons = (count) => {
        const iconStyle = darkMode
          ? { filter: 'brightness(0) invert(1)' } // ทำให้เป็นสีขาว
          : { filter: 'none' }; // สีปกติ

        if (count === 1) {
          return <img src={Icons} alt="icon" className='w-10 h-10' style={iconStyle} />;
        } else if (count === 2) {
          return (
            <div className='flex justify-center space-x-2'>
              <img src={Myicons} alt="icon" className='w-10 h-10' style={iconStyle} />
            </div>
          );
        } else if (count === 3) {
          const iconColor = darkMode ? 'white' : 'black';
          return (
            <div className='flex justify-center space-x-2'>
              <MdPeople size={40} color={iconColor} />
              <MdPeople size={40} color={iconColor} />
              <MdPeople size={40} color={iconColor} />
            </div>
          );
        } else {
          return null;
        }
      };

        const handleScheduleClick = () => {
          const roomPath = d.room;
          const today = new Date();
          const endDate = new Date();
          // endDate.setDate(today.getDate() + 1);
          const formatBuddhistDate = (date) => {
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear() + 0;
            return `${day}${month}${year}`;
          };
          const start = formatBuddhistDate(today);
          const end = formatBuddhistDate(endDate);
          const url = `/room/${roomPath}/${start}/${end}`;
          navigate(url);
        };

        const matchedRoom = icons.find(i => String(i.room).trim() === String(d.room).trim());
        const peopleCount = matchedRoom ? matchedRoom.people : '-';
        const iconClass = renderIcons(matchedRoom?.icons);

        return (
          <div
            key={index}
            className={`rounded-[25px] pt-5 pb-10 px-4 shadow-xl flex flex-col justify-between min-h-[250px] max-w-full min-w-0
              transition-all duration-200 font-medium ${
                darkMode ? 'bg-gray-600' : 'bg-white'
              }`}
          >
            <div className="flex justify-between items-center mb-3">
              <div className={`font-semibold flex items-center text-base sm:text-lg transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-black'
              }`}><IoPerson className='mr-1' />{peopleCount}</div>
              <div className={`border px-3 py-1 rounded-2xl text-sm sm:text-base transition-colors duration-300 ${
                darkMode ? 'text-white bg-gray-700 border-gray-600' : 'text-white bg-black border-black'
              }`}>{roomNameMap[d.room] || d.room}</div>
              <div className={`ml-2 ${statusColor} w-4 h-4 rounded-full`} />
            </div>
            <div className={`flex-1 flex flex-col justify-center items-center rounded-[25px] mt-2 transition-colors duration-300 ${
              darkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              <div className={`w-full flex justify-center items-center mb-6`}>{iconClass}</div>
              <div className='flex items-center justify-center space-x-3'>
                <FaClock size={20} className={darkMode ? 'text-white' : 'text-black'} />
                <RefreshButton
                  onClick={handleScheduleClick}
                  className={`border px-3 py-1 rounded-2xl cursor-pointer text-sm sm:text-base transition-all duration-200 ${
                    darkMode 
                      ? 'border-gray-600 bg-gray-600 text-white hover:bg-gray-500' 
                      : 'border-black bg-black text-white hover:bg-gray-700'
                  }`}
                >
                  Schedule
                </RefreshButton>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  )
}

export default Roomcard
