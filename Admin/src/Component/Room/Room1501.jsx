import React, { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { ChevronLeft, ChevronRight, Home, Calendar, Clock, User, X, MapPin, Sun, Moon, KeyRound } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import RefreshButton from '../../utils/refreshToken';
import { useDarkMode } from '../Context/DarkModeContext';
import { useProfile } from '../Context/ProfileContext';
import Header from '../Header';
import { CircularProgress, } from '@mui/material';
import { ArrowLeft } from 'lucide-react';

dayjs.extend(isBetween);

const HOURS_START = 0;
const HOURS_END = 24;
const PIXELS_PER_HOUR = 60;
const MIN_DAY_WIDTH = 200;
const WEEK_DAY_MAX = 200; // เพิ่มขึ้น
const WEEK_DAY_MIN = 100; // เพิ่มขึ้น
const COLUMN_LEFT_OFFSET = 100;
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const { darkMode, toggleDarkMode } = useDarkMode();
  const { profile } = useProfile(); // ใช้ profile จาก Context

  // Responsive state
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [containerRef, setContainerRef] = useState(null);

  // Header states
  const [selectedSize, setSelectedSize] = useState(location.state?.selectedSize || "Room");
  const [events, setEvents] = useState(location.state?.events || []);

  const handleBack = () => navigate(-1);

  // Delete event function (ใช้ axios แทน fetch)
  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    setIsDeleting(true);
    try {
      // import axios แบบ dynamic เฉพาะตอนเรียกใช้ (ถ้ายังไม่ได้ import ด้านบน)
      let axios;
      try {
        axios = require('axios');
      } catch (e) {
        axios = (await import('axios')).default;
      }

      console.log('Attempting to delete event:', {
        eventId: selectedEvent.eventId,
        room_number: selectedEvent.room
      });

      const res = await axios.delete('/api1/admin/delete', {
        data: {
          eventId: selectedEvent.eventId,
          room_number: selectedEvent.room
        },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        validateStatus: () => true // รับทุก status code
      });

      console.log('Axios response:', res);
      if (res.status !== 200) {
        // เพิ่ม log รายละเอียด error
        console.error('Delete event error details:', {
          status: res.status,
          statusText: res.statusText,
          data: res.data,
          headers: res.headers
        });
      }
      // ถ้า response ไม่มี data ให้ถือว่าลบสำเร็จถ้า status 200
      if (res.status === 200) {
        alert('Event deleted successfully!');
        setSelectedEvent(null);
        // window.location.reload();
      } else {
        alert(`Deletion Failed: ${res.data?.message || res.statusText || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSizeNavigate = (size) => {
    const label = size === 4 ? 'S' : size === 6 ? 'M' : size === 10 ? 'L' : 'Room';

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

    navigate(`/roomsize/${size}`, {
      state: {
        icons: iconClass,
        peopleSize: size,
        rooms: [],
        selectedSize: label,
        resetFilter: false
      },
      replace: true,
    });
  };

  const clearAllFilters = () => {
    setSelectedSize("Room");
    navigate('/admin/api', {
      state: {
        clearFilter: true,
        events: events
      }
    });
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!Room || !startdate || !enddate) {
      return;
    }

    setIsLoading(true);
    const endpoint = `/api1/admin/schedule/${Room}/${startdate}/${enddate}`;
    console.log("Connecting to SSE endpoint:", endpoint);

    const eventSource = new EventSource(endpoint);

    eventSource.onopen = (e) => {
      console.log("SSE connection opened:", e);
    };

    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        console.log("Received SSE data:", data);

        // รองรับทั้งโครงสร้างเก่าและใหม่
        const scheduleData = data.results || data;
        setScheduleApi(scheduleData);
        if (scheduleData) {
          setEvents(scheduleData);
        }
        setIsLoading(false);
      } catch (err) {
        console.error("Error parsing SSE data:", err);
        setIsLoading(false);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE error:", err);
      console.log("EventSource readyState:", eventSource.readyState);
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

  // ✅ แก้ไข column width calculation ให้เต็มพื้นที่
  const getColumnWidth = () => {
    // คำนวณ available width ที่แม่นยำ - ใช้ container ขนาดเต็ม
    const containerPadding = windowWidth >= 1024 ? 48 : windowWidth >= 640 ? 32 : 16;
    const calendarCardPadding = 32; // padding ภายในการ์ด calendar

    // คำนวณพื้นที่ที่เหลือจากหน้าจอเต็ม
    const availableWidth = windowWidth - containerPadding - COLUMN_LEFT_OFFSET - calendarCardPadding;

    if (view === 'Day') {
      // Day view: ใช้พื้นที่เต็มที่เหลือ
      return Math.max(availableWidth, MIN_DAY_WIDTH);
    } else {
      // Week view: แบ่งพื้นที่เต็มให้ 7 วันเท่าๆ กัน
      const idealColumnWidth = Math.floor(availableWidth / 7);

      // ถ้าคำนวณได้ไม่น้อยกว่า minimum ใช้ ideal width
      if (idealColumnWidth >= WEEK_DAY_MIN) {
        return idealColumnWidth;
      } else {
        // ถ้าหน้าจอแคบมาก ใช้ minimum และให้ scroll
        return WEEK_DAY_MIN;
      }
    }
  };

  const columnWidth = getColumnWidth();
  const calendarHeight = (HOURS_END - HOURS_START) * PIXELS_PER_HOUR + HEADER_HEIGHT;
  const numDays = view === 'Day' ? 1 : 7;

  // ✅ ปรับ container width ให้เต็มพื้นที่
  const getCalendarContainerWidth = () => {
    if (view === 'Day') {
      // Day view: ใช้ width เต็มที่เหลือ
      return '100%';
    } else {
      // Week view: ให้ใช้พื้นที่เต็ม ถ้าไม่พอจะมี scroll
      const totalWidth = COLUMN_LEFT_OFFSET + (columnWidth * numDays);
      return '100%'; // เปลี่ยนให้ใช้ 100% เสมอ
    }
  };

  // แก้ไข responsive breakpoints สำหรับ layout
  const isMobile = windowWidth < 768; // md breakpoint
  const isTablet = windowWidth >= 768 && windowWidth < 1024; // md to lg
  const isDesktop = windowWidth >= 1024; // lg+

  // Event rendering with proper sizing
  const renderEventsInCalendar = () => {
    if (!scheduleApi || !Array.isArray(scheduleApi)) return null;

    const { start, end } = getViewRange();
    // แก้ไข flat() เป็น flatten แบบปลอดภัย
    const flattenArray = (arr) => {
      return arr.reduce((acc, val) => {
        return Array.isArray(val) ? acc.concat(flattenArray(val)) : acc.concat(val);
      }, []);
    };

    const eventsFromApi = flattenArray(scheduleApi)
      .map((t, index) => {
        // รองรับทั้งโครงสร้างเก่าและใหม่
        let organizer, rawStart, rawEnd, isAllDay, subject, location, pin, isPinVerified;

        if (t.organizer && typeof t.organizer === 'string' && t.organizer.includes('@')) {
          // โครงสร้างใหม่จาก backend
          organizer = t.organizer.split('@')[0]; // เอาชื่อก่อน @ 
          // แปลงจาก UTC เป็น local timezone (UTC+7)
          rawStart = dayjs(t.start).add(7, 'hour');
          rawEnd = dayjs(t.end).add(7, 'hour');
          isAllDay = rawEnd.diff(rawStart, 'hour') >= 24;
          subject = t.subject || 'Meeting';
          location = t.room;
          pin = t.pin;
          isPinVerified = t.isPinVerified === "true" || t.isPinVerified === true;
        } else if (t.organizerMail) {
          // โครงสร้างเก่าที่ใช้ organizerMail
          organizer = t.organizerMail.split('@')[0];
          rawStart = dayjs(t.startDateTime).add(7, 'hour');
          rawEnd = dayjs(t.endDateTime).add(7, 'hour');
          isAllDay = rawEnd.diff(rawStart, 'hour') >= 24;
          subject = t.subject || 'Meeting';
          location = t.room;
          pin = t.pin;
          isPinVerified = t.isPinVerified || false;
        } else {
          // โครงสร้างเก่า (Microsoft Graph API)
          organizer = Array.isArray(t.organizer)
            ? t.organizer[0]?.emailAddress?.name
            : t.organizer?.emailAddress?.name;

          rawStart = t.start.dateTime
            ? dayjs(t.start.dateTime).add(7, 'hour')
            : dayjs(t.start.date).startOf('day').add(7, 'hour');

          rawEnd = t.end.dateTime
            ? dayjs(t.end.dateTime).add(7, 'hour')
            : dayjs(t.end.date).startOf('day').add(7, 'hour');

          isAllDay = rawEnd.diff(rawStart, 'hour') === 24 && rawStart.hour() === 7;
          subject = t.subject || 'Meeting';
          location = t.location;
          pin = t.pin || '----';
          isPinVerified = t.ispinverified || false;
        }

        // ✅ ปรับเวลาสิ้นสุดสำหรับ all day event ให้จบที่ 24:00 ของวันเดียวกัน
        const adjustedEnd = isAllDay ? rawStart.hour(24).minute(0).second(0) : rawEnd;

        return {
          id: index,
          start: rawStart,
          end: adjustedEnd,
          title: subject || 'Meeting',
          isAllDay,
          subject: subject,
          location: location ? `Floor ${String(location).slice(0, 2)}, Room ${String(location).slice(2, 4)}` : `Floor ${Room.slice(0, 2)}, Room ${Room.slice(2, 4)}`,
          pin: pin || '----',
          isPinVerified: isPinVerified,
          // เพิ่มข้อมูลเพิ่มเติม
          startDate: rawStart.format('DD/MM/YYYY'),
          endDate: adjustedEnd.format('DD/MM/YYYY'),
          startTime: rawStart.format('HH:mm'),
          endTime: adjustedEnd.format('HH:mm'),
          room: location || Room,
          organizerName: organizer || 'No Name',
          subjectName: subject || 'Meeting',
          eventId: t.eventId || `${index}-${rawStart.unix()}` // เพิ่ม eventId สำหรับ delete
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

      // ⭐ จำกัดเวลาให้อยู่ในช่วง HOURS_START (7:00) ถึง HOURS_END (24:00)
      let displayStartTime = startTime;
      let displayEndTime = endTime;

      // ถ้า event เริ่มก่อน 7:00 ให้ปรับเป็น 7:00
      if (displayStartTime.hour() < HOURS_START) {
        displayStartTime = displayStartTime.hour(HOURS_START).minute(0).second(0);
      }

      // ถ้า event จบหลัง 24:00 ให้ปรับเป็น 24:00
      if (displayEndTime.hour() >= HOURS_END || (displayEndTime.hour() === 0 && displayEndTime.minute() === 0 && !displayEndTime.isSame(displayStartTime, 'day'))) {
        displayEndTime = displayStartTime.hour(HOURS_END).minute(0).second(0);
      }

      // คำนวณ duration และ position ใหม่ตาม display time
      const duration = displayEndTime.diff(displayStartTime, 'minute');
      const topOffset = (displayStartTime.hour() + displayStartTime.minute() / 60 - HOURS_START) * PIXELS_PER_HOUR;
      const height = (duration / 60) * PIXELS_PER_HOUR;
      const dayOffset = displayStartTime.diff(start.startOf('day'), 'day');

      const eventColors = [
        'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400',
        'bg-gradient-to-br from-purple-500 to-purple-600 border-purple-400',
        'bg-gradient-to-br from-green-500 to-green-600 border-green-400',
        'bg-gradient-to-br from-orange-500 to-orange-600 border-orange-400',
        'bg-gradient-to-br from-pink-500 to-pink-600 border-pink-400',
      ];

      const colorClass = eventColors[event.id % eventColors.length];

      // ปรับ event sizing ตาม responsive
      let eventPadding, fontSize;
      if (view === 'Day') {
        eventPadding = isMobile ? 6 : 8;
        fontSize = isMobile ? '12px' : '14px';
      } else {
        eventPadding = isMobile ? 3 : Math.min(6, columnWidth * 0.05);
        fontSize = columnWidth > 120 ? '14px' : columnWidth > 100 ? '11px' : '10px';
      }

      const eventWidth = Math.max(columnWidth - (eventPadding * 2), 40);
      const eventLeft = COLUMN_LEFT_OFFSET + dayOffset * columnWidth + eventPadding;

      return (
        <div
          key={event.id}
          onClick={() => setSelectedEvent(event)}
          className={`absolute ${colorClass} text-white border-l-4 rounded-lg shadow-lg cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-105 hover:z-20`}
          style={{
            top: `${topOffset + HEADER_HEIGHT}px`,
            height: `${Math.max(height, 20)}px`,
            left: `${eventLeft}px`,
            width: `${eventWidth}px`,
            padding: `${eventPadding}px`,
            fontSize: fontSize
          }}
        >
          <div className="font-semibold text-white/90 overflow-hidden text-ellipsis whitespace-nowrap">
            {event.title}
          </div>
          {height >= MIN_HEIGHT_FOR_TIME && (
            <div className="text-white/70 mt-1" style={{ fontSize: `${parseInt(fontSize) - 1}px` }}>
              {event.isAllDay ? 'All Day' : `${startTime.format('HH:mm')} - ${endTime.format('HH:mm')}`}
              {/* ⭐ แสดงเวลาจริงที่จอง ไม่ใช่ display time */}
            </div>
          )}
          {/* {height >= 50 && columnWidth > 120 && (
            <div className="text-white/60 mt-1 overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: `${parseInt(fontSize) - 1}px` }}>
              {event.subject}
            </div>
          )} */}
        </div>
      );
    });
  };

  // Current time indicator
  const renderCurrentTimeIndicator = () => {
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

  return (
    <div className={`h-screen flex flex-col transition-colors duration-300 font-display ${darkMode
      ? 'bg-gray-900'
      : 'bg-slate-100'
      }`} style={{ overflow: 'hidden' }}>

      {/* Header Component */}
      <div className="flex-shrink-0">
        <Header
          title="Schedule"
          subtitle="Room booking schedule view"
          showPin={false}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-2 sm:p-4 lg:p-6 min-h-0">
        {/* Page Header */}
        <div className="flex-shrink-0 mb-3 sm:mb-4">

          {/* Back Button */}
          <RefreshButton
            onClick={handleBack}
            className={`px-4 sm:px-5 py-2.5 sm:py-3 mb-3 rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-xl flex items-center gap-2 ${darkMode
              ? 'bg-gray-800 text-white hover:bg-gray-600 '
              : 'bg-white text-gray-800 hover:bg-gray-100 border border-gray-100'
              }`}
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm sm:text-base font-medium">Back</span>
          </RefreshButton>

          {/* Desktop Layout */}
          <div className="hidden md:flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3 md:gap-4">
            {/* Left Section */}
            <div className="flex flex-col gap-3 items-center sm:items-start">
              <div className="flex items-center gap-3">
                <div className={`text-white p-3 sm:p-4 rounded-xl shadow-lg transition-colors duration-300 ${darkMode
                  ? 'bg-gradient-to-r from-gray-700 to-gray-800'
                  : 'bg-gradient-to-r from-slate-800 to-slate-900'
                  }`}>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-base sm:text-lg font-bold whitespace-nowrap">
                      Room {Room?.slice(0, 2)}/{Room?.slice(2, 4)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex flex-col items-center gap-3 w-full lg:w-auto">
              <div className="flex gap-2 w-full justify-center sm:justify-end lg:justify-center">
                <div className="flex gap-2">
                  {['Day', 'Week'].map((option) => (
                    <RefreshButton
                      key={option}
                      onClick={() => updateURLForView(option)}
                      className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-medium transition-all duration-200 text-sm sm:text-base ${view === option
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
                    className={`p-2.5 sm:p-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg ${darkMode
                      ? 'bg-gray-800 text-white hover:bg-gray-600'
                      : 'bg-slate-800 text-white hover:bg-slate-700'
                      }`}
                  >
                    <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                  </RefreshButton>
                  <RefreshButton
                    onClick={() => handleDateChange(1)}
                    className={`p-2.5 sm:p-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg ${darkMode
                      ? 'bg-gray-800 text-white hover:bg-gray-600'
                      : 'bg-slate-800 text-white hover:bg-slate-700'
                      }`}
                  >
                    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                  </RefreshButton>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden space-y-3">
            {/* Room Info */}
            <div className="flex items-center gap-3">
              <div className={`text-white p-3 rounded-xl shadow-lg transition-colors duration-300 ${darkMode
                ? 'bg-gradient-to-r from-gray-700 to-gray-800'
                : 'bg-gradient-to-r from-slate-800 to-slate-900'
                }`}>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm font-bold whitespace-nowrap">
                    Floor {Room?.slice(0, 2)}/Room {Room?.slice(2, 4)}
                  </span>
                </div>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Day/Week Buttons */}
              <div className="flex gap-2">
                {['Day', 'Week'].map((option) => (
                  <RefreshButton
                    key={option}
                    onClick={() => updateURLForView(option)}
                    className={`px-4 py-2.5 rounded-lg font-medium transition-all duration-200 text-sm ${view === option
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

              {/* Date Navigation Buttons */}
              <div className="flex items-center gap-2">
                <RefreshButton
                  onClick={() => handleDateChange(-1)}
                  className={`p-2.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg ${darkMode
                    ? 'bg-gray-800 text-white hover:bg-gray-600'
                    : 'bg-slate-800 text-white hover:bg-slate-700'
                    }`}
                >
                  <ChevronLeft className="h-4 w-4" />
                </RefreshButton>
                <RefreshButton
                  onClick={() => handleDateChange(1)}
                  className={`p-2.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg ${darkMode
                    ? 'bg-gray-800 text-white hover:bg-gray-600'
                    : 'bg-slate-800 text-white hover:bg-slate-700'
                    }`}
                >
                  <ChevronRight className="h-4 w-4" />
                </RefreshButton>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ Calendar Container - ปรับให้เต็มพื้นที่ */}
        <div className={`flex-1 rounded-xl lg:rounded-2xl shadow-xl transition-colors duration-300 min-h-0 w-full ${darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <CircularProgress size="30px" />
            </div>
          ) : (
            <div
              className={`h-full w-full ${view === 'Week' ? 'overflow-auto' : 'overflow-auto'
                }`}
            >
              <div
                className={`relative transition-colors duration-300 w-full ${darkMode
                  ? 'bg-gradient-to-b from-gray-800 to-gray-900'
                  : 'bg-gradient-to-b from-white to-slate-50'
                  }`}
                style={{
                  height: `${calendarHeight}px`,
                  minWidth: view === 'Day' ? '100%' : `${COLUMN_LEFT_OFFSET + (WEEK_DAY_MIN * numDays)}px`
                }}
              >
                {/* Time Column */}
                <div
                  className={`absolute left-0 top-0 transition-colors duration-300 border-r ${darkMode
                    ? 'bg-gradient-to-b from-gray-800 to-gray-900 border-gray-600'
                    : 'bg-gradient-to-b from-white to-slate-50 border-gray-200'
                    }`}
                  style={{
                    width: `${COLUMN_LEFT_OFFSET}px`,
                    height: `${calendarHeight}px`
                  }}
                >
                  {/* Time Header Spacer */}
                  <div
                    className={`border-b transition-colors duration-300 ${darkMode ? 'border-gray-600' : 'border-gray-200'
                      }`}
                    style={{ height: `${HEADER_HEIGHT}px` }}
                  />

                  {/* Time Labels */}
                  <div>
                    {[...Array(HOURS_END - HOURS_START)].map((_, i) => {
                      const hour = HOURS_START + i;
                      return (
                        <div
                          key={hour}
                          className={`border-t text-xs pl-1 sm:pl-2 flex items-center transition-colors duration-300 ${darkMode
                            ? 'border-gray-600 text-gray-400'
                            : 'border-gray-200 text-gray-500'
                            }`}
                          style={{ height: `${PIXELS_PER_HOUR}px` }}
                        >
                          <div className={`px-1 sm:px-2 py-1 rounded text-xs font-medium transition-colors duration-300 ${darkMode
                            ? 'bg-gray-800 text-gray-200'
                            : 'bg-white text-gray-700'
                            }`}>
                            {String(hour).padStart(2, '0')}:00
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Day Headers */}
                <div
                  className={`absolute border-b transition-colors duration-300 z-20 ${darkMode
                    ? 'bg-gradient-to-r from-gray-800 to-gray-700 border-gray-600'
                    : 'bg-gradient-to-r from-slate-50 to-slate-100 border-gray-200'
                    }`}
                  style={{
                    height: `${HEADER_HEIGHT}px`,
                    left: `${COLUMN_LEFT_OFFSET}px`,
                    width: `${columnWidth * numDays}px`,
                    top: 0
                  }}
                >
                  <div className="flex h-full">
                    {[...Array(numDays)].map((_, i) => {
                      const { start } = getViewRange();
                      const date = start.add(i, 'day');
                      const today = dayjs().format('YYYY-MM-DD');
                      const isToday = date.format('YYYY-MM-DD') === today;

                      return (
                        <div
                          key={i}
                          className={`flex flex-col items-center justify-center border-r transition-all duration-200 ${darkMode ? 'border-gray-600' : 'border-gray-200'
                            } ${isToday
                              ? darkMode
                                ? 'bg-blue-900/50 text-blue-300'
                                : 'bg-blue-50 text-blue-600'
                              : darkMode
                                ? 'text-gray-300'
                                : 'text-gray-700'
                            }`}
                          style={{ width: `${columnWidth}px` }}
                        >
                          <div className={`font-medium uppercase tracking-wider ${columnWidth > 140 ? 'text-xs' : columnWidth > 100 ? 'text-[10px]' : 'text-[9px]'
                            }`}>
                            {columnWidth > 120 ? date.format('ddd') : columnWidth > 80 ? date.format('dd') : date.format('dd').charAt(0)}
                          </div>
                          <div className={`font-bold ${isToday
                            ? darkMode
                              ? 'text-blue-300'
                              : 'text-blue-600'
                            : darkMode
                              ? 'text-gray-200'
                              : 'text-gray-800'
                            } ${columnWidth > 140 ? 'text-base' : columnWidth > 100 ? 'text-sm' : 'text-xs'}`}>
                            {date.format('D')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Day Columns */}
                {[...Array(numDays)].map((_, i) => (
                  <div
                    key={i}
                    className={`absolute border-r transition-colors duration-300 ${darkMode ? 'border-gray-600' : 'border-gray-200'
                      }`}
                    style={{
                      left: `${COLUMN_LEFT_OFFSET + i * columnWidth}px`,
                      width: `${columnWidth}px`,
                      top: `${HEADER_HEIGHT}px`,
                      bottom: 0
                    }}
                  />
                ))}

                {/* Hour Lines */}
                {[...Array(HOURS_END - HOURS_START)].map((_, i) => (
                  <div
                    key={i}
                    className={`absolute border-t transition-colors duration-300 ${darkMode ? 'border-gray-600' : 'border-gray-200'
                      }`}
                    style={{
                      top: `${HEADER_HEIGHT + i * PIXELS_PER_HOUR}px`,
                      left: `${COLUMN_LEFT_OFFSET}px`,
                      width: `${columnWidth * numDays}px`
                    }}
                  />
                ))}

                {/* Events */}
                {renderEventsInCalendar()}

                {/* Current Time Indicator */}
                {renderCurrentTimeIndicator()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Event Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100 ${darkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl sm:text-2xl font-bold transition-colors duration-300 ${darkMode ? 'text-white' : 'text-slate-800'
                  }`}>Booking Details</h2>
                <RefreshButton
                  onClick={() => setSelectedEvent(null)}
                  className={`p-2 rounded-xl transition-colors duration-200 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-slate-100'
                    }`}
                >
                  <X className={`h-5 w-5 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-slate-500'
                    }`} />
                </RefreshButton>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className={`h-5 w-5 flex-shrink-0 transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-slate-500'
                    }`} />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm transition-colors duration-300 ${
                      darkMode ? 'text-gray-400' : 'text-slate-500'
                    }`}>Subject</p>
                    <p className={`font-semibold transition-colors duration-300 truncate ${
                      darkMode ? 'text-white' : 'text-slate-800'
                    }`}>{selectedEvent.subjectName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className={`h-5 w-5 flex-shrink-0 transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-slate-500'
                    }`} />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-slate-500'
                      }`}>Start Date & Time</p>
                    <p className={`font-semibold transition-colors duration-300 truncate ${darkMode ? 'text-white' : 'text-slate-800'
                      }`}>{selectedEvent.startDate} {selectedEvent.startTime}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className={`h-5 w-5 flex-shrink-0 transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-slate-500'
                    }`} />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-slate-500'
                      }`}>End Date & Time</p>
                    <p className={`font-semibold transition-colors duration-300 truncate ${darkMode ? 'text-white' : 'text-slate-800'
                      }`}>{selectedEvent.endDate} {selectedEvent.endTime}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className={`h-5 w-5 flex-shrink-0 transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-slate-500'
                    }`} />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-slate-500'
                      }`}>Room</p>
                    <p className={`font-semibold transition-colors duration-300 truncate ${darkMode ? 'text-white' : 'text-slate-800'
                      }`}>{selectedEvent.location}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <KeyRound className={`h-5 w-5 flex-shrink-0 transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-slate-500'
                    }`} />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-slate-500'
                      }`}>PIN</p>
                    <p className={`font-semibold transition-colors duration-300 truncate ${darkMode ? 'text-white' : 'text-slate-800'
                      }`}>{selectedEvent.pin}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`h-5 w-5 flex-shrink-0 transition-colors duration-300 ${selectedEvent.isPinVerified
                    ? 'text-green-500'
                    : 'text-red-500'
                    }`}>
                    {selectedEvent.isPinVerified ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-slate-500'
                      }`}>PIN Status</p>
                    <p className={`font-normal transition-colors duration-300 truncate ${selectedEvent.isPinVerified
                      ? 'text-green-500'
                      : 'text-red-500'
                      }`}>
                      {selectedEvent.isPinVerified ? 'Verified' : 'Not Verified'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <div className="w-full flex flex-col sm:flex-row sm:justify-end gap-3">
                  <RefreshButton
                    onClick={() => setConfirmDeleteOpen(true)}
                    disabled={isDeleting}
                    className={`w-full sm:w-auto px-6 sm:px-40 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 text-base sm:text-lg flex items-center justify-center gap-2 ${darkMode
                      ? 'bg-red-700 text-white hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed'
                      : 'bg-red-700 text-white hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed'
                      }`}
                    style={{ minWidth: 120 }}
                  >
                    <span className="flex items-center justify-center w-full" style={{ minWidth: 80 }}>
                      {isDeleting ? (
                        <>
                          <CircularProgress size={16} color="inherit" style={{ marginRight: 8 }} />
                          <span>Deleting...</span>
                        </>
                      ) : (
                        'Delete'
                      )}
                    </span>
                  </RefreshButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Confirm Delete Modal */}
      {confirmDeleteOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="p-6">
              <div className="mb-4">
                <h3 className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Confirm Deletion</h3>
                <p className={`${darkMode ? 'text-gray-300' : 'text-slate-600'} mt-2`}>
                  Are you sure you want to delete this booking by using elevated privileges?
                  This action cannot be undone. Bookings scheduled from tomorrow onward will not be affected.
                </p>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <RefreshButton
                  onClick={() => setConfirmDeleteOpen(false)}
                  disabled={isDeleting}
                  className={`${darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'} px-5 py-2.5 rounded-xl shadow-md`}
                >
                  No
                </RefreshButton>
                <RefreshButton
                  onClick={async () => { await handleDeleteEvent(); setConfirmDeleteOpen(false); }}
                  disabled={isDeleting}
                  className={`${darkMode ? 'bg-red-700 text-white hover:bg-red-600 disabled:bg-gray-600' : 'bg-red-700 text-white hover:bg-red-600 disabled:bg-gray-400'} px-5 py-2.5 rounded-xl shadow-md`}
                >
                  {isDeleting ? 'Deleting...' : 'Yes'}
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