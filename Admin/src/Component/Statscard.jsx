import React from 'react';
import { Users, UserCheck, Shield, Activity, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';

function Statscard({ 
  housekeeperCount, 
  adminCount, 
  filteredMembers, 
  darkMode,
  // เพิ่ม props สำหรับ room data
  rooms,
  currentTime,
  onFilter,
  // เพิ่ม props สำหรับควบคุมการแสดงผล
  showHousekeeper = true,
  showAdmin = true,
  showRoomStatus = true
}) {
  // ฟังก์ชันนับจำนวนห้อง Available และ Unavailable (เหมือนกับใน Roomdata)
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

  // ฟังก์ชันจัดการ click สำหรับ Available rooms
  const handleClickAvailable = () => {
    if (availableCount === 0) {
      onFilter && onFilter([], "available", "There are no rooms available.");
      return;
    }

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

    onFilter && onFilter(availableRooms, "available");
  };

  // ฟังก์ชันจัดการ click สำหรับ Unavailable rooms
  const handleClickUnavailable = () => {
    if (unavailableCount === 0) {
      onFilter && onFilter([], "unavailable", "There are no rooms unavailable.");
      return;
    }

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

    onFilter && onFilter(unavailableRooms, "unavailable");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      {/* Main Housekeeper Card */}
      {showHousekeeper && (
        <div className={`md:col-span-1 relative overflow-hidden rounded-2xl py-6 px-7 shadow-lg border-2 ${
          darkMode 
            ? 'bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 border-blue-700' 
            : 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 border-blue-300'
        }`}>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-blue-100 text-sm font-medium uppercase tracking-wider">Total Housekeeper</p>
                <p className="text-white text-4xl font-bold mt-1">{housekeeperCount}</p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <UserCheck className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
          
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
        </div>
      )}

      {/* Admin Card */}
      {showAdmin && (
        <div className={`md:col-span-1 relative overflow-hidden rounded-2xl py-6 px-7 shadow-lg border-2 ${
          darkMode 
              ? 'bg-gradient-to-br from-rose-900 via-amber-800 to-yellow-900 border-amber-700'
              : 'bg-gradient-to-br from-rose-500 via-amber-600 to-yellow-600 border-amber-300'
        }`}>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-blue-100 text-sm font-medium uppercase tracking-wider">Total Admin</p>
                <p className="text-white text-4xl font-bold mt-1">{adminCount}</p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
          
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
        </div>
      )}

      {/* Room Available Card */}
      {showRoomStatus && rooms && (
        <div 
          className={`md:col-span-1 my-7 ml-5 relative overflow-hidden rounded-2xl py-6 px-7 shadow-lg border-2 transition-all duration-300 ${
            darkMode 
              ? 'bg-gradient-to-br from-green-900 via-green-800 to-green-950 border-green-700' 
              : 'bg-gradient-to-br from-green-500 via-green-600 to-green-800 border-green-300'
          }`}
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-green-100 text-sm font-medium uppercase tracking-wider">Room Available</p>
                <p className="text-white text-4xl font-bold mt-1">
                  {availableCount}
                  <span className="text-xl font-medium"> / {rooms.length}</span>
                </p>
              </div>
              <div className="w-16 h-16 bg-white/40 rounded-full flex items-center justify-center backdrop-blur-sm">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
          
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
        </div>
      )}

      {/* Room Unavailable Card */}
      {showRoomStatus && rooms && (
        <div 
          className={`md:col-span-1 relative my-7 mr-5 overflow-hidden rounded-2xl py-6 px-7 shadow-lg border-2 transition-all duration-300 ${
            darkMode 
              ? 'bg-gradient-to-br from-red-900 via-red-800 to-red-950 border-red-700' 
              : 'bg-gradient-to-br from-red-500 via-red-600 to-red-800 border-red-300'
          }`}
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-red-100 text-sm font-medium uppercase tracking-wider">Room Unavailable</p>
                <p className="text-white text-4xl font-bold mt-1">
                  {unavailableCount}
                  <span className="text-xl font-medium"> / {rooms.length}</span>
                </p>
              </div>
              <div className="w-16 h-16 bg-white/40 rounded-full flex items-center justify-center backdrop-blur-sm">
                <XCircle className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
          
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
        </div>
      )}
    </div>
  );
}

export default Statscard;