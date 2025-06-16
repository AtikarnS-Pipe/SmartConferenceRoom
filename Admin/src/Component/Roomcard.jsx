import React, { useEffect, useState } from 'react'
import { MdPeople } from "react-icons/md";
import { FaClock } from "react-icons/fa6";
import { IoPerson } from "react-icons/io5";
import { useNavigate } from 'react-router-dom';

function Roomcard(props) {
  const { data, icons } = props
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const parseTime = (timeStr) => {
    const date = new Date(timeStr); // Convert string to Date object
    const hours = date.getHours() + 7;
    const minutes = date.getMinutes();
    const now = new Date();
    const result = new Date(now);
    result.setHours(hours, minutes, 0, 0);
    return result;
  };
  const parseBackendTime = (timeStr) => {
    const [datePart, timePart] = timeStr.split(' ');
    const [day, month, year] = datePart.split('/').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);
    return new Date(year, month - 1, day, hour, minute);
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
        let start = ''
        let end = ''
        d.events.map((inner) => {
          start = parseTime(inner.start.dateTime)
          end = parseTime(inner.end.dateTime)
        })

        const isAvailable = !d.events.some((event) => {
          const start = parseTime(event.start.dateTime);
          const end = parseTime(event.end.dateTime);
          return currentTime >= start && currentTime <= end;
        });
        const statusColor = isAvailable ? "bg-green-500" : "bg-red-500";
        const renderIcons = (count) => {
          if (count === 1) {
            return <MdPeople className='mx-auto' size={40} />;
          } else if (count === 2) {
            return (
              <div className='flex justify-center space-x-2'>
                <MdPeople size={40} /><MdPeople size={40} />
              </div>
            );
          } else if (count === 3) {
            return (
              <div className='flex justify-center space-x-2'>
                <MdPeople size={40} /><MdPeople size={40} /><MdPeople size={40} />
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
          endDate.setDate(today.getDate() + 1);
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
            className="bg-white rounded-[25px] pt-5 pb-10 px-4 shadow-xl flex flex-col justify-between min-h-[250px] max-w-full
              transition-all duration-200 font-medium"
          > 
            <div className="flex justify-between items-center mb-3">
              <div className='font-semibold flex items-center text-base sm:text-lg'><IoPerson className='mr-1' />{peopleCount}</div>
              <div className='border text-white bg-black px-3 py-1 rounded-2xl text-sm sm:text-base'>{roomNameMap[d.room] || d.room}</div>
              <div className={`ml-2 ${statusColor} w-4 h-4 rounded-full`} />
            </div>
            <div className='flex-1 flex flex-col  justify-center items-center bg-gray-200 rounded-[25px] mt-2'>
              <div className='w-full flex justify-center items-center mb-6'>{iconClass}</div>
              <div className='flex items-center justify-center space-x-3'>
                <FaClock size={20} />
                <div
                  onClick={handleScheduleClick}
                  className='border border-black px-3 py-1 rounded-2xl bg-black text-white cursor-pointer text-sm sm:text-base'
                >
                  Schedule
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  )
}

export default Roomcard