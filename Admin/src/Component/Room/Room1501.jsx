import React, { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { FaHouse } from "react-icons/fa6";
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

dayjs.extend(isBetween);

const HOURS_START = 7;
const HOURS_END = 24; // ← ขยายถึง 20:00
const PIXELS_PER_HOUR = 60;
const DAY_WIDTH = 180;
const COLUMN_LEFT_OFFSET = 80;
const HEADER_HEIGHT = 40;
const MIN_HEIGHT_FOR_TIME = 32; // ← ถ้าต่ำกว่านี้ไม่แสดงเวลา

const formatDate = (date) => dayjs(date).format('DDMMYYYY');
const parseDate = (str) => {
  const day = str.slice(0, 2);
  const month = str.slice(2, 4);
  const year = parseInt(str.slice(4, 8), 10);
  return dayjs(`${year}-${month}-${day}`);
};

const Room1501 = () => {
  const navigate = useNavigate();
  const { Room, startdate, enddate } = useParams();
  const socketRef = useRef(); //
  const [view, setView] = useState('Day');
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [currentTime, setCurrentTime] = useState(new Date());
  const [scheduleApi, setScheduleApi] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null); 


  useEffect(() => {
    socketRef.current = io("http://localhost:4000", {
      withCredentials: true, // ***************
      transports: ["websocket"], 
    }); //
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    return () => {
      socketRef.current.disconnect();
      clearInterval(timer);
    } 
  }, []);
  useEffect(() => {
    const socket = socketRef.current; 

    socket.off("receive_api");
    socket.off("revoked_api");
    setScheduleApi(null)
    
    socket.emit("get_schedule", { Room, startdate, enddate });
    console.log("get_schedule => ", { Room, startdate, enddate });
    socket.on("receive_api", (scheduleApi2) => {
      if(JSON.stringify(scheduleApi2) !== JSON.stringify(scheduleApi)){ //
        setScheduleApi(scheduleApi2);
        console.log("receive_api => ", scheduleApi2);
      }
    })
    socket.on("revoked_api", () => setScheduleApi(null));

    return () => {
      socket.off("receive_api");
      socket.off("revoked_api");
    };
  }, [Room, startdate, enddate]);

  useEffect(() => {
    if (startdate && enddate) {
      const start = parseDate(startdate);
      const end = parseDate(enddate);
      setSelectedDate(start.format('YYYY-MM-DD'));
      const diff = end.diff(start, 'day');
      setView(diff === 1 ? 'Day' : 'Week');
    }
  }, [startdate, enddate]);

  const handleDateChange = (days) => {
    const newStart = dayjs(selectedDate).add(days, 'day');
    const newEnd = view === 'Day' ? newStart.add(1, 'day') : newStart.add(6, 'day');
    navigate(`/room/${Room}/${formatDate(newStart)}/${formatDate(newEnd)}`);
    setSelectedDate(newStart.format('YYYY-MM-DD'));
  };

  const updateURLForView = (newView) => {
    const start = dayjs(selectedDate);
    const end = newView === 'Day' ? start.add(1, 'day') : start.add(6, 'day');
    setView(newView);
    navigate(`/room/${Room}/${formatDate(start)}/${formatDate(end)}`);
  };

  const getViewRange = () => {
    const start = dayjs(selectedDate).startOf('day');
    const end = view === 'Day' ? start.endOf('day') : start.add(6, 'day').endOf('day');
    return { start, end };
  };

  const columnWidth = view === 'Day' ? (window.innerWidth - COLUMN_LEFT_OFFSET - 32) * 0.99 : DAY_WIDTH;

  const renderEvents = () => {
    if (!scheduleApi) return null;
    const { start, end } = getViewRange();
    const eventsFromApi = scheduleApi
      .flat()
      .map(t => {
        const organizer = Array.isArray(t.organizer)
          ? t.organizer[0]?.emailAddress?.name
          : t.organizer?.emailAddress?.name;

        const rawStart = t.start.dateTime
          ? dayjs(t.start.dateTime).add(7, 'hour')
          : dayjs(t.start.date).startOf('day').add(7, 'hour');

        const rawEnd = t.end.dateTime
          ? dayjs(t.end.dateTime).add(7, 'hour')
          : dayjs(t.end.date).startOf('day').add(7, 'hour');

        const isAllDay = rawEnd.diff(rawStart, 'hour') === 24 && rawStart.hour() === 7;

        return {
          start: rawStart,
          end: rawEnd,
          title: organizer || 'No Name',
          isAllDay,
        };
      })
      .filter(event => {
        const eventStart = dayjs(event.start);
        const eventEnd = dayjs(event.end);
        return eventEnd.isAfter(start) && eventStart.isBefore(end);
      });

    return eventsFromApi.map((event, index) => {
      const startTime = dayjs(event.start);
      const endTime = dayjs(event.end);
      const duration = endTime.diff(startTime, 'minute');
      const topOffset = (startTime.hour() + startTime.minute() / 60 - HOURS_START) * PIXELS_PER_HOUR;
      const height = (duration / 60) * PIXELS_PER_HOUR;
      const dayOffset = startTime.diff(start.startOf('day'), 'day');

      return (
        <div
          key={index}
          onClick={() => setSelectedEvent(event)}
          className="absolute bg-white border-l-4 border-red-500 rounded-xl shadow-md p-2 text-sm overflow-hidden cursor-pointer"
          style={{
            top: `${topOffset + HEADER_HEIGHT}px`,
            height: `${height}px`,
            left: `${COLUMN_LEFT_OFFSET + dayOffset * columnWidth}px`,
            width: `${columnWidth - 4}px`,
          }}
        >
          <div className="font-bold overflow-hidden text-ellipsis whitespace-nowrap" style={{ maxHeight: '100%', lineHeight: '1.1em' }}>
            {event.title}
          </div>
          {height >= MIN_HEIGHT_FOR_TIME && (
            <div className="text-xs text-gray-500">
              {event.isAllDay ? 'All Day' : `${startTime.format('HH:mm')} - ${endTime.format('HH:mm')}`}
            </div>
          )}
        </div>
      );
    });
  };

  const renderTimeLines = () =>
    [...Array(HOURS_END - HOURS_START)].map((_, i) => {
      const hour = HOURS_START + i;
      return (
        <div
          key={hour}
          className="absolute left-0 right-0 border-t border-gray-400 text-xs text-gray-600 pl-2"
          style={{ top: `${HEADER_HEIGHT + i * PIXELS_PER_HOUR}px`, height: `${PIXELS_PER_HOUR}px` }}
        >
          {String(hour).padStart(2, '0')}:00
        </div>
      );
    });

  const renderDayColumns = () => {
    const numDays = view === 'Day' ? 1 : 7;
    return [...Array(numDays)].map((_, i) => (
      <div
        key={i}
        className="absolute top-0 bottom-0 border-l border-gray-500"
        style={{
          left: `${COLUMN_LEFT_OFFSET + i * columnWidth}px`,
          width: `${columnWidth}px`,
        }}
      />
    ));
  };

  const renderDayHeaders = () => {
    const { start } = getViewRange();
    const numDays = view === 'Day' ? 1 : 7;

    return (
      <div
        className="absolute top-0 left-0 right-0 flex bg-[#f1f1f1] border-b border-gray-500"
        style={{ height: `${HEADER_HEIGHT}px`, marginLeft: `${COLUMN_LEFT_OFFSET}px` }}
      >
        {[...Array(numDays)].map((_, i) => {
          const date = start.add(i, 'day');
          return (
            <div
              key={i}
              className="flex items-center justify-center border-l border-gray-400 text-sm font-semibold"
              style={{ width: `${columnWidth}px` }}
            >
              {date.format('ddd D')}
            </div>
          );
        })}
      </div>
    );
  };

  const calendarHeight = (HOURS_END - HOURS_START) * PIXELS_PER_HOUR + HEADER_HEIGHT;
  const numDays = view === 'Day' ? 1 : 7;
  const calendarWidth = COLUMN_LEFT_OFFSET + numDays * columnWidth;

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4">
        <div className="flex flex-col gap-2">
          <div className='flex px-3 py-1 rounded-xl md:mt-3 bg-slate-700 text-white cursor-pointer hover:bg-slate-400 w-fit' onClick={() => navigate('/admin/api')}>
            <FaHouse className='mt-1 h-5 w-5' />
            <h2 className='text-lg font-bold ml-1'>Home</h2>
          </div>
          <div className='bg-black text-white p-3 text-lg lg:text-xl md:mt-3 rounded-xl font-bold shadow-md'>
            Room {Room.replace(/(\d{2})(\d{2})/, '$1/$2')}
          </div>
        </div>

        <div className="text-gray-800 font-bold text-xl lg:text-2xl">
          {dayjs(selectedDate).format('dddd, DD MMMM ') + (dayjs(selectedDate).year())}
        </div>

        <div className="flex flex-row sm:flex-col items-center gap-2">
          <div className='font-semibold text-base md:mt-3 lg:text-xl'>{dayjs(currentTime).format('HH:mm:ss')}</div>
          <div className="flex gap-2">
            {['Day', 'Week'].map((option) => (
              <button
                key={option}
                onClick={() => updateURLForView(option)}
                className={`px-3 py-1 rounded-xl border ${view === option ? 'bg-black text-white' : 'bg-white'}`}
              >
                {option}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 md:mt-1">
            <button onClick={() => handleDateChange(-1)} className="px-3 py-1 rounded-xl bg-black hover:bg-gray-500 text-white">
              <IoIosArrowBack className='w-5 h-5' />
            </button>
            <button onClick={() => handleDateChange(1)} className="px-3 py-1 rounded-xl bg-black hover:bg-gray-500 text-white">
              <IoIosArrowForward className='w-5 h-5' />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="relative rounded-lg overflow-x-auto bg-[#f8f7f1]" style={{ height: `${calendarHeight}px`, minWidth: '100%' }}>
        {renderDayHeaders()}
        {renderTimeLines()}
        {renderDayColumns()}
        <div className="absolute inset-0">{renderEvents()}</div>
      </div>

      {/* Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 backdrop-blur-lg bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-xl shadow-lg w-[90%] sm:w-80">
            <h2 className="text-lg font-bold mb-2">Booking Detail</h2>
            <p><strong>Name :</strong> {selectedEvent.title}</p>
            <p><strong>Time :</strong> {dayjs(selectedEvent.start).format('HH:mm')} - {dayjs(selectedEvent.end).format('HH:mm')}</p>
            <button
              onClick={() => setSelectedEvent(null)}
              className="mt-4 px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-700 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Room1501;
