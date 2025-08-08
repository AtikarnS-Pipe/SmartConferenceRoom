import React, { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { ChevronLeft, ChevronRight, Home, Calendar, Clock, User, X, MapPin, Sun, Moon } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import RefreshButton from '../../utils/refreshToken';
import { useDarkMode } from '../Context/DarkModeContext';
import Header from '../Header';
import axios from 'axios'
import {CircularProgress,} from '@mui/material'; 

dayjs.extend(isBetween);

const HOURS_START = 7;
const HOURS_END = 24;
const PIXELS_PER_HOUR = 60;
const DAY_WIDTH = 260;
const COLUMN_LEFT_OFFSET = 120;
const HEADER_HEIGHT = 60;
const MIN_HEIGHT_FOR_TIME = 32;

const formatDate = (date) => dayjs(date).format('DDMMYYYY');
const parseDate = (str) => {
  const day = str.slice(0, 2);
  const month = str.slice(2, 4);
  const year = parseInt(str.slice(4, 8), 10);
  return dayjs(`${year}-${month}-${day}`);
};

const Room1501 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { Room, startdate, enddate } = useParams();
  const socketRef = useRef();
  const [view, setView] = useState('Day');
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [currentTime, setCurrentTime] = useState(new Date());
  const [scheduleApi, setScheduleApi] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const { darkMode, toggleDarkMode } = useDarkMode();
  
  // Header states - รับข้อมูลจาก location.state
  const [selectedSize, setSelectedSize] = useState(location.state?.selectedSize || "Room");
  const [events, setEvents] = useState(location.state?.events || []);

  // Navbar state and handlers
  const [openMenu1, setOpenMenu1] = useState(false);
  
  const toggleDropdown1 = () => setOpenMenu1(!openMenu1);
  
  const handleGoHome = () => {
    navigate('/admin/api');
  };

  // ✅ Fix: แก้ไข handleSizeNavigate เพื่อส่งข้อมูลที่ถูกต้อง
  const handleSizeNavigate = (size) => {
    const label = size === 4 ? 'S' : size === 6 ? 'M' : size === 10 ? 'L' : 'Room';
    
    // ข้อมูล icons แบบเดียวกับใน Admin.jsx
    const iconClass = [
      { id: 1, room: "1501", icons: 1, people: 4 },
      { id: 2, room: "1502", icons: 1, people: 4 },
      { id: 3, room: "1503", icons: 1, people: 4 },
      { id: 4, room: "1504", icons: 1, people: 4 },
      { id: 5, room: "1505", icons: 1, people: 6 },
      { id: 6, room: "1506", icons: 1, people: 6 },
      { id: 7, room: "1514", icons: 1, people: 10 },
      { id: 8, room: "1515", icons: 1, people: 10 },
      { id: 9, room: "1519", icons: 1, people: 4 },
      { id: 10, room: "1520", icons: 1, people: 4 },
    ];

    // ✅ Navigate ไปยัง roomsize โดยไม่ส่งข้อมูลเก่า ให้ RoomSize ไปดึงข้อมูลสดเอง
    navigate(`/roomsize/${size}`, {
      state: {
        icons: iconClass,
        peopleSize: size,
        rooms: [], // ✅ ส่งเป็น array ว่าง ให้ RoomSize ดึงข้อมูลสดเอง
        selectedSize: label,
        resetFilter: false
      },
      replace: true,
    });
    setOpenMenu1(false);
  };
  
  const handleNavigateByRole = () => {
    const role = localStorage.getItem('role');
    console.log("Navigating based on role:", role);
    if (role === 'Superadmin') {
      navigate('/account/superadmin');
    } else if (role === 'Admin') {
      navigate('/account/admin');
    } else {
      navigate('/');
    }
  };

  // ✅ Fix: แก้ไข clearAllFilters เพื่อส่งข้อมูลที่ถูกต้อง
  const clearAllFilters = () => {
    setSelectedSize("Room");
    
    // ส่งข้อมูลที่จำเป็นกลับไปหน้า admin
    navigate('/admin/api', {
      state: {
        clearFilter: true,
        events: events
      }
    });
  };
  
  // Format time and date for navbar (matching Admin.jsx format)
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
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
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
    if (!Room || !startdate || !enddate) {
      console.log("Incomplete parameters entered");
      return;
    }
    
    setIsLoading(true);
    const eventSource = new EventSource(`/admin/schedule/${Room}/${startdate}/${enddate}`);
    
    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setScheduleApi(data.results);
        // ✅ อัพเดท events state เมื่อได้ข้อมูลใหม่
        if (data.results) {
          setEvents(data.results);
        }
        setIsLoading(false);
      } catch (err) {
        console.error("Error parsing SSE data:", err);
        setIsLoading(false);
      }
    };
    
    eventSource.onerror = (err) => {
      console.error("SSE error:", err);
      eventSource.close();
      setIsLoading(false);
    };
    
    return () => {
      eventSource.close();
    };
  }, [Room, startdate, enddate]);

  useEffect(() => {
    if (startdate && enddate) {
      const start = parseDate(startdate);
      const end = parseDate(enddate);
      setSelectedDate(start.format('YYYY-MM-DD'));
      const diff = end.diff(start, 'day');
      setView(diff === 0 ? 'Day' : 'Week');
    }
  }, [startdate, enddate]);

  const handleDateChange = (days) => {
    const newStart = dayjs(selectedDate).add(days, 'day');
    const newEnd = view === 'Day' ? newStart : newStart.add(6, 'day');
    navigate(`/room/${Room}/${formatDate(newStart)}/${formatDate(newEnd)}`, {
      state: {
        selectedSize,
        events
      }
    });
    setSelectedDate(newStart.format('YYYY-MM-DD'));
  };

  const updateURLForView = (newView) => {
    const start = dayjs(selectedDate);
    const end = newView === 'Day' ? start : start.add(6, 'day');
    setView(newView);
    navigate(`/room/${Room}/${formatDate(start)}/${formatDate(end)}`, {
      state: {
        selectedSize,
        events
      }
    });
  };

  const getViewRange = () => {
    const start = dayjs(selectedDate).startOf('day');
    const end = view === 'Day' ? start.endOf('day') : start.add(6, 'day').endOf('day');
    return { start, end };
  };

  const columnWidth = view === 'Day'
    ? Math.max((window.innerWidth - COLUMN_LEFT_OFFSET - 32) * 0.99, DAY_WIDTH)
    : DAY_WIDTH;

  const getCurrentTimeIndicator = () => {
    const now = dayjs();
    const { start, end } = getViewRange();
    
    if (!now.isBetween(start, end, 'day', '[]')) return null;
    
    const currentHour = now.hour() + now.minute() / 60;
    if (currentHour < HOURS_START || currentHour > HOURS_END) return null;
    
    const topOffset = (currentHour - HOURS_START) * PIXELS_PER_HOUR;
    const dayOffset = now.diff(start.startOf('day'), 'day');
    
    return (
      <div className="absolute z-30 pointer-events-none">
        <div
          className="absolute bg-red-500 h-0.5 shadow-lg"
          style={{
            top: `${topOffset + HEADER_HEIGHT}px`,
            left: `${COLUMN_LEFT_OFFSET + dayOffset * columnWidth}px`,
            width: `${columnWidth}px`,
          }}
        />
        <div
          className="absolute bg-red-500 rounded-full w-3 h-3 -ml-1.5 -mt-1.5 shadow-lg"
          style={{
            top: `${topOffset + HEADER_HEIGHT}px`,
            left: `${COLUMN_LEFT_OFFSET + dayOffset * columnWidth}px`,
          }}
        />
      </div>
    );
  };

  const renderEvents = () => {
    if (!scheduleApi) return null;
    
    const { start, end } = getViewRange();
    const eventsFromApi = scheduleApi
      .flat()
      .map((t, index) => {
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
          id: index,
          start: rawStart,
          end: rawEnd,
          title: organizer || 'No Name',
          isAllDay,
          subject: t.subject || 'Meeting',
          location: t.location || 'Room ' + Room,
        };
      })
      
      .filter(event => {
        const eventStart = dayjs(event.start);
        const eventEnd = dayjs(event.end);
        return eventEnd.isAfter(start) && eventStart.isBefore(end);
      });

    return eventsFromApi.map((event) => {
      const startTime = dayjs(event.start);
      const endTime = dayjs(event.end);
      const duration = endTime.diff(startTime, 'minute');
      const topOffset = (startTime.hour() + startTime.minute() / 60 - HOURS_START) * PIXELS_PER_HOUR;
      const height = (duration / 60) * PIXELS_PER_HOUR;
      const dayOffset = startTime.diff(start.startOf('day'), 'day');

      const eventColors = [
        'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400',
        'bg-gradient-to-br from-purple-500 to-purple-600 border-purple-400',
        'bg-gradient-to-br from-green-500 to-green-600 border-green-400',
        'bg-gradient-to-br from-orange-500 to-orange-600 border-orange-400',
        'bg-gradient-to-br from-pink-500 to-pink-600 border-pink-400',
      ];

      const colorClass = eventColors[event.id % eventColors.length];

      return (
        <div
          key={event.id}
          onClick={() => setSelectedEvent(event)}
          className={`absolute ${colorClass} text-white border-l-4 rounded-lg shadow-lg p-3 text-sm overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-105 hover:z-20`}
          style={{
            top: `${topOffset + HEADER_HEIGHT}px`,
            height: `${height}px`,
            left: `${COLUMN_LEFT_OFFSET + dayOffset * columnWidth + 2}px`,
            width: `${columnWidth - 8}px`,
          }}
        >
          <div className="font-semibold text-white/90 overflow-hidden text-ellipsis whitespace-nowrap">
            {event.title}
          </div>
          {height >= MIN_HEIGHT_FOR_TIME && (
            <div className="text-xs text-white/70 mt-1">
              {event.isAllDay ? 'All Day' : `${startTime.format('HH:mm')} - ${endTime.format('HH:mm')}`}
            </div>
          )}
          {height >= 60 && (
            <div className="text-xs text-white/60 mt-1 overflow-hidden text-ellipsis whitespace-nowrap">
              {event.subject}
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
          className={`absolute left-0 right-0 border-t text-xs pl-2 flex items-center transition-colors duration-300 ${
            darkMode 
              ? 'border-gray-600 text-gray-400' 
              : 'border-gray-200 text-gray-500'
          }`}
          style={{ top: `${HEADER_HEIGHT + i * PIXELS_PER_HOUR}px`, height: `${PIXELS_PER_HOUR}px` }}
        >
          <div className={`px-2 py-1 rounded-md font-medium transition-colors duration-300 ${
            darkMode 
              ? 'bg-gray-800 text-gray-200' 
              : 'bg-white text-gray-700'
          }`}>
            {String(hour).padStart(2, '0')}:00
          </div>
        </div>
      );
    });

  const renderDayColumns = () => {
    const numDays = view === 'Day' ? 1 : 7;
    return [...Array(numDays)].map((_, i) => (
      <div
        key={i}
        className={`absolute top-0 bottom-0 border-r transition-colors duration-300 ${
          darkMode ? 'border-gray-600' : 'border-gray-200'
        }`}
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
    const today = dayjs().format('YYYY-MM-DD');

    return (
      <div
        className={`absolute top-0 left-0 right-0 border-b transition-colors duration-300 ${
          darkMode 
            ? 'bg-gradient-to-r from-gray-800 to-gray-700 border-gray-600' 
            : 'bg-gradient-to-r from-slate-50 to-slate-100 border-gray-200'
        }`}
        style={{ height: `${HEADER_HEIGHT}px`, marginLeft: `${COLUMN_LEFT_OFFSET}px` }}
      >
        <div className="flex h-full">
          {[...Array(numDays)].map((_, i) => {
            const date = start.add(i, 'day');
            const isToday = date.format('YYYY-MM-DD') === today;
            
            return (
              <div
                key={i}
                className={`flex flex-col items-center justify-center border-r transition-all duration-200 ${
                  darkMode ? 'border-gray-600' : 'border-gray-200'
                } ${
                  isToday 
                    ? darkMode 
                      ? 'bg-blue-900/50 text-blue-300' 
                      : 'bg-blue-50 text-blue-600'
                    : darkMode 
                      ? 'text-gray-300' 
                      : 'text-gray-700'
                }`}
                style={{ width: `${columnWidth}px` }}
              >
                <div className="text-xs font-medium uppercase tracking-wider">
                  {date.format('ddd')}
                </div>
                <div className={`text-lg font-bold ${
                  isToday 
                    ? darkMode 
                      ? 'text-blue-300' 
                      : 'text-blue-600'
                    : darkMode 
                      ? 'text-gray-200' 
                      : 'text-gray-800'
                }`}>
                  {date.format('D')}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const calendarHeight = (HOURS_END - HOURS_START) * PIXELS_PER_HOUR + HEADER_HEIGHT;
  const numDays = view === 'Day' ? 1 : 7;

  return (
    <div className={`font-display min-h-screen transition-colors duration-300 ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-700 to-gray-800' 
        : 'bg-gradient-to-br from-slate-50 to-slate-100'
    }`}>
      
      {/* Header Component */}
      <Header 
        selectedSize={selectedSize}
        setSelectedSize={setSelectedSize}
        events={events}
        clearAllFilters={clearAllFilters}
      />
      
      <div className="p-4 sm:p-6 max-w-[1800px] mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-4 md:gap-6">
            {/* Left Section */}
            <div className="flex flex-col gap-4 items-center sm:items-start">
              <div className="flex items-center gap-3">
                <div className={`text-white p-4 rounded-xl shadow-lg transition-colors duration-300 ${
                  darkMode 
                    ? 'bg-gradient-to-r from-gray-700 to-gray-800' 
                    : 'bg-gradient-to-r from-slate-800 to-slate-900'
                }`}>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    <span className="text-xl font-bold">
                      Room {Room?.replace(/(\d{2})(\d{2})/, '$1/$2')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex flex-col items-center gap-4 w-full lg:w-auto">
              <div className="flex gap-2 w-full justify-center sm:justify-end lg:justify-center"> 
                <div className="flex gap-2">
                  {['Day', 'Week'].map((option) => (
                    <RefreshButton
                      key={option}
                      onClick={() => updateURLForView(option)}
                      className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                        view === option
                          ? darkMode 
                            ? 'bg-gray-800 text-white shadow-lg' 
                            : 'bg-slate-800 text-white shadow-lg'
                          : darkMode 
                            ? 'bg-gray-800 text-white shadow-md hover:bg-gray-600' 
                            : 'bg-white text-slate-600 shadow-md hover:bg-slate-50'
                      }`}
                    >
                      {option}
                    </RefreshButton>
                  ))}
                </div>
                
                <div className="flex items-center gap-2">
                  <RefreshButton
                    onClick={() => handleDateChange(-1)}
                    className={`p-2 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg ${
                      darkMode 
                        ? 'bg-gray-800 text-white hover:bg-gray-600' 
                        : 'bg-slate-800 text-white hover:bg-slate-700'
                    }`}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </RefreshButton>
                  <RefreshButton
                    onClick={() => handleDateChange(1)}
                    className={`p-2 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg ${
                      darkMode 
                        ? 'bg-gray-800 text-white hover:bg-gray-600' 
                        : 'bg-slate-800 text-white hover:bg-slate-700'
                    }`}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </RefreshButton>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className={`rounded-2xl shadow-xl overflow-x-auto transition-colors duration-300 ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <CircularProgress size="30px"/>  
            </div>
          ) : (
            <div
              className={`relative transition-colors duration-300 ${
                darkMode 
                  ? 'bg-gradient-to-b from-gray-800 to-gray-900' 
                  : 'bg-gradient-to-b from-white to-slate-50'
              }`}
              style={{
                height: `${calendarHeight}px`,
                minWidth: view === 'Day'
                  ? '100%'
                  : `${COLUMN_LEFT_OFFSET + columnWidth * numDays + 40}px`
              }}
            >
              {renderDayHeaders()}
              {renderTimeLines()}
              {renderDayColumns()}
              {renderEvents()}
              {getCurrentTimeIndicator()}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100 ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-bold transition-colors duration-300 ${
                  darkMode ? 'text-white' : 'text-slate-800'
                }`}>Booking Details</h2>
                <RefreshButton
                  onClick={() => setSelectedEvent(null)}
                  className={`p-2 rounded-xl transition-colors duration-200 ${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-slate-100'
                  }`}
                >
                  <X className={`h-5 w-5 transition-colors duration-300 ${
                    darkMode ? 'text-gray-300' : 'text-slate-500'
                  }`} />
                </RefreshButton>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className={`h-5 w-5 transition-colors duration-300 ${
                    darkMode ? 'text-gray-400' : 'text-slate-500'
                  }`} />
                  <div>
                    <p className={`text-sm transition-colors duration-300 ${
                      darkMode ? 'text-gray-400' : 'text-slate-500'
                    }`}>Organizer</p>
                    <p className={`font-semibold transition-colors duration-300 ${
                      darkMode ? 'text-white' : 'text-slate-800'
                    }`}>{selectedEvent.title}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Calendar className={`h-5 w-5 transition-colors duration-300 ${
                    darkMode ? 'text-gray-400' : 'text-slate-500'
                  }`} />
                  <div>
                    <p className={`text-sm transition-colors duration-300 ${
                      darkMode ? 'text-gray-400' : 'text-slate-500'
                    }`}>Subject</p>
                    <p className={`font-semibold transition-colors duration-300 ${
                      darkMode ? 'text-white' : 'text-slate-800'
                    }`}>{selectedEvent.subject}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Clock className={`h-5 w-5 transition-colors duration-300 ${
                    darkMode ? 'text-gray-400' : 'text-slate-500'
                  }`} />
                  <div>
                    <p className={`text-sm transition-colors duration-300 ${
                      darkMode ? 'text-gray-400' : 'text-slate-500'
                    }`}>Time</p>
                    <p className={`font-semibold transition-colors duration-300 ${
                      darkMode ? 'text-white' : 'text-slate-800'
                    }`}>
                      {selectedEvent.isAllDay
                        ? 'All Day'
                        : `${dayjs(selectedEvent.start).format('HH:mm')} - ${dayjs(selectedEvent.end).format('HH:mm')}`}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <MapPin className={`h-5 w-5 transition-colors duration-300 ${
                    darkMode ? 'text-gray-400' : 'text-slate-500'
                  }`} />
                  <div>
                    <p className={`text-sm transition-colors duration-300 ${
                      darkMode ? 'text-gray-400' : 'text-slate-500'
                    }`}>Location</p>
                    <p className={`font-semibold transition-colors duration-300 ${
                      darkMode ? 'text-white' : 'text-slate-800'
                    }`}>{selectedEvent.location}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end">
                <RefreshButton
                  onClick={() => setSelectedEvent(null)}
                  className={`px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 ${
                    darkMode 
                      ? 'bg-gray-700 text-white hover:bg-gray-600' 
                      : 'bg-slate-800 text-white hover:bg-slate-700'
                  }`}
                >
                  Close
                </RefreshButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Room1501;