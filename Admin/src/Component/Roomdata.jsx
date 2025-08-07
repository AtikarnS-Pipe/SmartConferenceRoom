import React from 'react'
import { useNavigate } from 'react-router-dom';
import RefreshButton from "../utils/refreshToken"; // Assuming you have a RefreshButton component
import { useDarkMode } from './Context/DarkModeContext';

function Roomdata({ rooms, currentTime, icons, onFilter  }) {
  const { darkMode } = useDarkMode();
  // console.log("Roomdata - icons:", icons); 
  let availableCount = 0;
  let unavailableCount = 0;

  if (rooms && Array.isArray(rooms)) {
    rooms.forEach(room => {
      const isBusy = room.events.some(ev => {
        const start = new Date(ev.start.dateTime);
        const end = new Date(ev.end.dateTime);
        start.setHours(start.getHours() + 7);
        end.setHours(end.getHours() + 7);
        return currentTime >= start && currentTime <= end;
      });
      if (isBusy) {
        unavailableCount++;
      } else {
        availableCount++;
      }
    }); 
  }

  const total = [
    { id: 1, Name: "Room Available", count: availableCount, total: rooms.length },
    { id: 2, Name: "Room Unavailable", count: unavailableCount, total: rooms.length }
  ];
  const navigate = useNavigate();
    const handleClickAvailable = () => {
      const availableRooms = rooms
        .map(room => {
          const isBusy = room.events.some(ev => {
            const start = new Date(ev.start.dateTime);
            const end = new Date(ev.end.dateTime);
            start.setHours(start.getHours() + 7);
            end.setHours(end.getHours() + 7);
            return currentTime >= start && currentTime <= end;
          });
          return { ...room, isAvailable: !isBusy };
        })
        .filter(room => room.isAvailable);

      // ส่งกลับไปที่ Admin
      onFilter(availableRooms, "available");
    };

    const handleClickUnavailable = () => {
      const unavailableRooms = rooms
        .map(room => {
          const isBusy = room.events.some(ev => {
            const start = new Date(ev.start.dateTime);
            const end = new Date(ev.end.dateTime);
            start.setHours(start.getHours() + 7);
            end.setHours(end.getHours() + 7);
            return currentTime >= start && currentTime <= end;
          });
          return { ...room, isAvailable: isBusy };
        })
        .filter(room => room.isAvailable);

      // ส่งกลับไปที่ Admin
      onFilter(unavailableRooms, "unavailable");
    };
  return (
    <div className={`p-10 flex items-center justify-center px-4 transition-colors duration-300 ${
      darkMode ? 'bg-gray-700' : ''
    }`}>
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-6 justify-items-center w-full max-w-6xl'>
      {total.map((t, index) => {
        const isAvailable = t.Name === "Room Available";
        const mainColor = isAvailable ? "bg-[#00c21b]" : "bg-red-600";
        const textColor = isAvailable ? "text-[#00c21b]" : "text-red-600";
        const bgCircle = isAvailable ? "bg-[#d0e2b4]" : "bg-red-100";

        return (
          <div
            key={index}
            className={`flex items-center rounded-3xl shadow-xl/30 overflow-hidden w-full max-w-[550px] mx-auto transition-colors duration-300 ${
              darkMode ? 'bg-gray-800' : 'bg-[#f8f7f1]'
            }`}
            >
            <div className={`w-14 sm:w-16 rounded-l-3xl ${mainColor} h-full`}></div>

            <div className="flex-grow flex flex-col justify-between px-5 py-5 sm:px-7 sm:py-5">
              <div className={`font-semibold text-2xl transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-black'
              }`}>{t.Name}</div>
              <div className={`${textColor} text-5xl font-bold`}>
                {t.count}
                <span className="text-xl font-medium"> / {t.total}</span>
              </div>
              <RefreshButton 
              onClick={() => {
                  if (t.Name === "Room Available") {
                    handleClickAvailable(); // เรียกฟังก์ชันสำหรับห้องว่าง
                  } else {
                    handleClickUnavailable(); // เรียกฟังก์ชันสำหรับห้องไม่ว่าง
                  }
                }}
              className={`mt-2 px-4 py-3 rounded-xl text-sm font-medium w-max cursor-pointer transition-colors duration-300 ${
                darkMode 
                  ? 'bg-gray-700 text-white hover:bg-gray-600' 
                  : 'bg-gray-200 text-black hover:bg-gray-300'
              }`}>
                View Details
              </RefreshButton>
            </div>

            <div className={`flex items-center justify-center w-12 h-12 relative right-5 sm:right-10 rounded-full ${bgCircle}`}>
              {isAvailable ? (
                <div className="w-16 h-12 rounded-full bg-[#d1e2a4] flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full border-4 border-[#6e9448] flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#6e9448]" fill="none" stroke="currentColor" strokeWidth={5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="w-16 h-12 rounded-full bg-[#e2a4a4] flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full border-4 border-[#944848] flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#a05252]" fill="none" stroke="currentColor" strokeWidth={5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  )
}

export default Roomdata
