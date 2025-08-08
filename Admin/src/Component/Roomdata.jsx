import React from 'react'
import { useNavigate } from 'react-router-dom';
import RefreshButton from "../utils/refreshToken";
import { useDarkMode } from './Context/DarkModeContext';

function Roomdata({ rooms, currentTime, icons, onFilter, selectedSize }) {
  const { darkMode } = useDarkMode();
  
  // จำกัด rooms ตามขนาดที่เลือก (S/M/L)
  const sizeToPeople = (sizeLabel) => {
    if (sizeLabel === 'S') return 4;
    if (sizeLabel === 'M') return 6;
    if (sizeLabel === 'L') return 10;
    return null;
  };

  const peopleSize = sizeToPeople(selectedSize);
  const sizeRoomNumbers = peopleSize && Array.isArray(icons)
    ? icons.filter(i => i.people === peopleSize).map(i => String(i.room))
    : null;

  const roomsBySize = Array.isArray(rooms)
    ? (sizeRoomNumbers ? rooms.filter(r => sizeRoomNumbers.includes(String(r.room))) : rooms)
    : [];

  let availableCount = 0;
  let unavailableCount = 0;

  roomsBySize.forEach(room => {
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

  const total = [
    { id: 1, Name: "Room Available", count: availableCount, total: roomsBySize.length },
    { id: 2, Name: "Room Unavailable", count: unavailableCount, total: roomsBySize.length }
  ];

  return (
    <div className={`p-5 flex items-center justify-center px-4 transition-colors duration-300 ${
      darkMode ? 'bg-gray-700' : ''
    }`}>
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-6 justify-items-center w-full'>
        {total.map((t, index) => {
          const isAvailable = t.Name === "Room Available";
          // ใช้ gradient เต็มการ์ด
         const cardGradient = (() => {
            if (isAvailable) {
              return darkMode 
                ? "bg-gradient-to-br from-green-600 via-green-800 to-green-950"
                : "bg-gradient-to-br from-green-500 via-green-600 to-green-800";
            } else {
              return darkMode 
                ? "bg-gradient-to-br from-red-600 via-red-800 to-red-950"
                : "bg-gradient-to-br from-red-500 via-red-600 to-red-800";
            }
          })();
          
          return (
            <div
              key={index}
              className={`flex items-center rounded-3xl shadow-xl overflow-hidden w-full mx-auto transition-all duration-300 ${cardGradient}`}
            >
              <div className="flex-grow flex flex-col justify-between px-5 py-6 sm:px-12 sm:py-11">
                <div className="font-semibold text-2xl text-white">
                  {t.Name}
                </div>
                <div className="text-white text-5xl font-bold">
                  {t.count}
                  <span className="text-xl font-medium"> / {t.total}</span>
                </div>
              </div>

              <div className="flex items-center justify-center w-12 h-12 relative right-5 sm:right-10 rounded-full bg-white/20 backdrop-blur-sm">
                {isAvailable ? (
                  <div className="w-16 h-12 rounded-full bg-white/30 flex items-center justify-center backdrop-blur-sm">
                    <div className="w-12 h-12 rounded-full border-4 border-white flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                ) : (
                  <div className="w-16 h-12 rounded-full bg-white/30 flex items-center justify-center backdrop-blur-sm">
                    <div className="w-12 h-12 rounded-full border-4 border-white flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={5} viewBox="0 0 24 24">
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