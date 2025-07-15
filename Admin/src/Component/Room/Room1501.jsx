import React, { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { ChevronLeft, ChevronRight, Home, Calendar, Clock, User, X, MapPin } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

dayjs.extend(isBetween);

const HOURS_START = 7;
const HOURS_END = 24;
const PIXELS_PER_HOUR = 60; // ปรับให้สัมพันธ์กับความสูงของแต่ละชั่วโมง
const DAY_WIDTH = 260; // เดิม 180
const COLUMN_LEFT_OFFSET = 120; // เดิม 80
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
  const { Room, startdate, enddate } = useParams();
  const socketRef = useRef();
  const [view, setView] = useState('Day');
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [currentTime, setCurrentTime] = useState(new Date());
  const [scheduleApi, setScheduleApi] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);



  console.log("scheduleApi", scheduleApi);
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
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
    navigate(`/room/${Room}/${formatDate(newStart)}/${formatDate(newEnd)}`);
    setSelectedDate(newStart.format('YYYY-MM-DD'));
  };

  const updateURLForView = (newView) => {
    const start = dayjs(selectedDate);
    const end = newView === 'Day' ? start : start.add(6, 'day');
    setView(newView);
    navigate(`/room/${Room}/${formatDate(start)}/${formatDate(end)}`);
  };

  const getViewRange = () => {
    const start = dayjs(selectedDate).startOf('day');
    const end = view === 'Day' ? start.endOf('day') : start.add(6, 'day').endOf('day');
    return { start, end };
  };

  // ปรับ columnWidth ให้สัมพันธ์กับ DAY_WIDTH
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
          className="absolute left-0 right-0 border-t border-gray-200 text-xs text-gray-500 pl-2 flex items-center"
          style={{ top: `${HEADER_HEIGHT + i * PIXELS_PER_HOUR}px`, height: `${PIXELS_PER_HOUR}px` }}
        >
          <div className="bg-white px-2 py-1 rounded-md font-medium">
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
        className="absolute top-0 bottom-0 border-r border-gray-200"
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
        className="absolute top-0 left-0 right-0 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-gray-200"
        style={{ height: `${HEADER_HEIGHT}px`, marginLeft: `${COLUMN_LEFT_OFFSET}px` }}
      >
        <div className="flex h-full">
          {[...Array(numDays)].map((_, i) => {
            const date = start.add(i, 'day');
            const isToday = date.format('YYYY-MM-DD') === today;
            
            return (
              <div
                key={i}
                className={`flex flex-col items-center justify-center border-r border-gray-200 transition-all duration-200 ${
                  isToday ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                }`}
                style={{ width: `${columnWidth}px` }}
              >
                <div className="text-xs font-medium uppercase tracking-wider">
                  {date.format('ddd')}
                </div>
                <div className={`text-lg font-bold ${isToday ? 'text-blue-600' : 'text-gray-800'}`}>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="p-6 max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Left Section */}
            <div className="flex flex-col gap-4">
              <button
                onClick={() => navigate('/admin/api')}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors duration-200 shadow-md hover:shadow-lg w-fit"
              >
                <Home className="h-5 w-5" />
                <span className="font-medium">Home</span>
              </button>
              
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-4 rounded-xl shadow-lg">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    <span className="text-xl font-bold">
                      Room {Room?.replace(/(\d{2})(\d{2})/, '$1/$2')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Center Section */}
            <div className="text-center">
              <div className="text-2xl lg:text-3xl font-bold text-slate-800 mb-2">
                {dayjs(selectedDate).format('dddd, MMMM D')}
              </div>
              <div className="text-lg text-slate-600">
                {dayjs(selectedDate).format('YYYY')}
              </div>
            </div>

            {/* Right Section */}
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-md">
                <Clock className="h-5 w-5 text-slate-600" />
                <span className="text-xl font-mono font-semibold text-slate-800">
                  {dayjs(currentTime).format('HH:mm:ss')}
                </span>
              </div>
              
              <div className="flex gap-2">
                {['Day', 'Week'].map((option) => (
                  <button
                    key={option}
                    onClick={() => updateURLForView(option)}
                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                      view === option
                        ? 'bg-slate-800 text-white shadow-lg'
                        : 'bg-white text-slate-600 shadow-md hover:bg-slate-50'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDateChange(-1)}
                  className="p-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors duration-200 shadow-md hover:shadow-lg"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDateChange(1)}
                  className="p-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors duration-200 shadow-md hover:shadow-lg"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-2xl shadow-xl overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
            </div>
          ) : (
            <div
              className="relative bg-gradient-to-b from-white to-slate-50"
              style={{
                height: `${calendarHeight}px`,
                minWidth: `${COLUMN_LEFT_OFFSET + columnWidth * numDays + 40}px`
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Booking Details</h2>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors duration-200"
                >
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-slate-500" />
                  <div>
                    <p className="text-sm text-slate-500">Organizer</p>
                    <p className="font-semibold text-slate-800">{selectedEvent.title}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-slate-500" />
                  <div>
                    <p className="text-sm text-slate-500">Subject</p>
                    <p className="font-semibold text-slate-800">{selectedEvent.subject}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-slate-500" />
                  <div>
                    <p className="text-sm text-slate-500">Time</p>
                    <p className="font-semibold text-slate-800">
                      {selectedEvent.isAllDay
                        ? 'All Day'
                        : `${dayjs(selectedEvent.start).format('HH:mm')} - ${dayjs(selectedEvent.end).format('HH:mm')}`}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-slate-500" />
                  <div>
                    <p className="text-sm text-slate-500">Location</p>
                    <p className="font-semibold text-slate-800">{selectedEvent.location}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors duration-200 font-medium shadow-lg hover:shadow-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Room1501;