import React, { useEffect, useState, useRef } from 'react'; 

export default function TimeSchedule({ currentTime, events = [], zoomLevel, setZoomLevel  }) {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [timePosition, setTimePosition] = useState(0);
  const scheduleRef = useRef(null);
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const baseWidth = 1200;
  const zoomMin = 0.5;
  const zoomMax = 4;
  const times = [
    '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM',
    '04:00 PM', '05:00 PM', '06:00 PM'
  ];

  // Get container width on mount and resize
  useEffect(() => {
    const updateContainerWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        setContainerWidth(width);
      }
    };

    updateContainerWidth();
    window.addEventListener('resize', updateContainerWidth);
    
    return () => {
      window.removeEventListener('resize', updateContainerWidth);
    };
  }, []);

  // ฟังก์ชันคำนวณเวลาที่เหลือ
  function getTimeRemaining(event) {
    if (!event?.start?.dateTime || !event?.end?.dateTime) return '-';
  
    const now = new Date();
    const start = new Date(event.start.dateTime + 'Z');
    const end = new Date(event.end.dateTime + 'Z');
  
    if (now < start) return 'Not time yet.';
    if (now >= end) return 'Time up.';
  
    const diff = end - now;
    const seconds = Math.floor(diff / 1000) % 60;
    const minutes = Math.floor(diff / (1000 * 60)) % 60;
    const hours = Math.floor(diff / (1000 * 60 * 60));
  
    let result = '';
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0 || hours > 0) result += `${minutes}m `;
    result += `${seconds}s`;
  
    return result.trim();
  }
  

  // แปลงเวลาจาก UTC เป็น UTC+7 รูปแบบ 24 ชั่วโมง hh:mm
  function to24HHMM_UTCplus7(dateTimeStr) {
    if (!dateTimeStr) return '--:--';
    const date = new Date(dateTimeStr + 'Z');
    const utcPlus7 = new Date(date.getTime() + 7 * 60 * 60 * 1000);
    const hours = String(utcPlus7.getUTCHours()).padStart(2, '0');
    const minutes = String(utcPlus7.getUTCMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  function toAMPM_UTCplus7(dateTimeStr) {
    if (!dateTimeStr) return '--:--';
    const date = new Date(dateTimeStr + 'Z');
    const utcPlus7 = new Date(date.getTime() + 7 * 60 * 60 * 1000);
    let hours = utcPlus7.getUTCHours();
    const minutes = utcPlus7.getUTCMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
  }

  // Auto-reset zoom TimeSchedule component
  useEffect(() => {
    if (zoomLevel !== getAdaptiveZoomLevel()) {
      const timer = setTimeout(() => {
        setZoomLevel(getAdaptiveZoomLevel());
      }, 60000);
      return () => clearTimeout(timer);
    }
  }, [zoomLevel, containerWidth]);

  // Update time position
  useEffect(() => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    const startMinutes = 8 * 60;
    const endMinutes = 19 * 60;
    const totalRange = endMinutes - startMinutes;
    if (totalMinutes < startMinutes) {
      setTimePosition(0);
    } else if (totalMinutes > endMinutes) {
      setTimePosition(100);
    } else {
      const percent = ((totalMinutes - startMinutes) / totalRange) * 100;
      setTimePosition(percent);
    }
  }, [currentTime]);

  function getTimePercent(timeStr) {
    if (!timeStr || !/^\d{2}:\d{2}$/.test(timeStr)) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    const startMinutes = 8 * 60;
    const endMinutes = 19 * 60;
    return ((totalMinutes - startMinutes) / (endMinutes - startMinutes)) * 100;
  }

  // Calculate the zoom level needed to fit the container
  function getAdaptiveZoomLevel() {
    if (containerWidth <= 0) return 1;
    const adaptiveZoom = containerWidth / baseWidth;
    return Math.max(adaptiveZoom, zoomMin);
  }

  useEffect(() => {
    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        
        // Ensure minimum zoom level
        const minZoom = getAdaptiveZoomLevel();
        setZoomLevel((prev) => Math.min(zoomMax, Math.max(minZoom, prev + delta)));
      }
    };
    const node = scheduleRef.current;
    if (node) {
      node.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (node) {
        node.removeEventListener('wheel', handleWheel);
      }
    };
  }, [containerWidth]);

  useEffect(() => {
    const node = scheduleRef.current;
    let initialDistance = null;
    const getDistance = (touches) => {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };
    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        initialDistance = getDistance(e.touches);
      }
    };
    const handleTouchMove = (e) => {
      if (e.touches.length === 2 && initialDistance) {
        e.preventDefault();
        const newDistance = getDistance(e.touches);
        const diff = newDistance - initialDistance;
        if (Math.abs(diff) > 5) {
          const deltaZoom = diff > 0 ? 0.03 : -0.03;
          setZoomLevel((prev) => {
            // Ensure minimum zoom level
            const minZoom = getAdaptiveZoomLevel();
            const newZoom = Math.min(zoomMax, Math.max(minZoom, prev + deltaZoom));
            return newZoom;
          });
          initialDistance = newDistance;
        }
      }
    };
    const handleTouchEnd = () => {
      initialDistance = null;
    };
    if (node) {
      node.addEventListener('touchstart', handleTouchStart, { passive: false });
      node.addEventListener('touchmove', handleTouchMove, { passive: false });
      node.addEventListener('touchend', handleTouchEnd);
      node.addEventListener('touchcancel', handleTouchEnd);
    }
    return () => {
      if (node) {
        node.removeEventListener('touchstart', handleTouchStart);
        node.removeEventListener('touchmove', handleTouchMove);
        node.removeEventListener('touchend', handleTouchEnd);
        node.removeEventListener('touchcancel', handleTouchEnd);
      }
    };
  }, [containerWidth]);

  useEffect(() => {
    if (selectedEvent) {
      const timer = setTimeout(() => {
        setSelectedEvent(null);
      }, 0.5 * 60 * 1000);
      return () => clearTimeout(timer);
    }
  }, [selectedEvent]);

  // Initialize zoom level when container width changes
  useEffect(() => {
    if (containerWidth > 0) {
      setZoomLevel(getAdaptiveZoomLevel());
    }
  }, [containerWidth]);

  // Effective zoom level is the max of current zoom and adaptive zoom
  const effectiveZoomLevel = Math.max(zoomLevel, getAdaptiveZoomLevel());

  return (
    <div 
      ref={containerRef}
      style={{ width: '100%', overflowX: 'auto', position: 'relative', zIndex: 1 }}
    >
      <div
        ref={scheduleRef}
        style={{
          position: 'relative',
          width: `${baseWidth * effectiveZoomLevel}px`,
          transition: 'width 0.3s ease'
        }}
      >
        {/* Time Labels */}
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '4px' }}>
          {times.map((time, i) => (
            <div key={i} style={{ fontSize: '16px', color: '#4E4E4E' }}>{time}</div>
          ))}
        </div>

        {/* Timeline */}
        <div
          style={{
            position: 'relative',
            height: '100px',
            backgroundColor: '#F3F4F6',
            borderRadius: '10px',
            overflow: 'hidden',
          }}
        >
          {/* Events */}
          {Array.isArray(events) && events.map((event, i) => {
            // Check if this is a 24-hour or multi-day event
            const isFullDayEvent = () => {
              if (!event?.start?.dateTime || !event?.end?.dateTime) return false;
              
              const startDate = new Date(event.start.dateTime + 'Z');
              const endDate = new Date(event.end.dateTime + 'Z');
              
              // Calculate duration in hours
              const durationHours = (endDate - startDate) / (1000 * 60 * 60);
              
              // Consider it a full day if duration is 24 hours or more
              return durationHours >= 24;
            };
            
            // If it's a full day event, display it across the entire schedule
            if (isFullDayEvent()) {
              const startAMPM = toAMPM_UTCplus7(event?.start?.dateTime);
              const endAMPM = toAMPM_UTCplus7(event?.end?.dateTime);
              const color = '#2E5074';
              
              return (
                <div
                  key={i}
                  onClick={() => setSelectedEvent(event)}
                  style={{
                    position: 'absolute',
                    top: '20%',
                    left: '0%',
                    width: '100%',
                    height: '60%',
                    backgroundColor: color,
                    borderRadius: '4px',
                    padding: '2px 6px',
                    fontSize: '14px',
                    color: 'white',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    cursor: 'pointer',
                  }}
                >
                  <p style={{ display: 'inline-block', fontSize: '1rem' }}>
                      {event?.organizer?.emailAddress?.name || 'No Name'}
                  </p>
                  <p>{startAMPM} - {endAMPM} (Full Day)</p>
                </div>
              );
            }
            
            // Regular event handling (existing code)
            const start24 = to24HHMM_UTCplus7(event?.start?.dateTime);
            const end24 = to24HHMM_UTCplus7(event?.end?.dateTime);
            const startPercent = getTimePercent(start24);
            const endPercent = getTimePercent(end24);
            const startAMPM = toAMPM_UTCplus7(event?.start?.dateTime);
            const endAMPM = toAMPM_UTCplus7(event?.end?.dateTime);
            const widthPercent = endPercent - startPercent;
            const color = '#2E5074';
            return (
              <div
                key={i}
                onClick={() => setSelectedEvent(event)}
                style={{
                  position: 'absolute',
                  top: '20%',
                  left: `${startPercent}%`,
                  width: `${widthPercent}%`,
                  height: '60%',
                  backgroundColor: color,
                  borderRadius: '4px',
                  padding: '2px 6px',
                  fontSize: '12px',
                  color: 'white',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  cursor: 'pointer',
                }}
              >
                <p style={{display: 'inline-block', fontSize: '1rem' }}>{event?.organizer?.emailAddress?.name || 'No Name'}</p>
                <p style={{ fontSize: '0.875rem' }}>{startAMPM} - {endAMPM}</p>
              </div>
            );
          })}

          {/* Time Indicator */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${timePosition}%`,
              width: '2px',
              backgroundColor: '#EF4444',
              zIndex: 10,
              transition: 'left 1s ease',
              boxShadow: '0 0 4px rgba(239, 68, 68, 0.5)'
            }}
          />

          {/* Hour Dividers */}
          <div style={{ display: 'flex', height: '100%' }}>
            {times.map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  borderRight: i === times.length - 1 ? 'none' : '1px solid #D1D5DB'
                }}
              />
            ))}
          </div>
        </div>

        {/* Bottom Labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
          <div style={{ fontSize: '16px', color: '#4E4E4E' }}>08:00 AM</div>
          <div style={{ fontSize: '16px', color: '#4E4E4E' }}>06:00 PM</div>
        </div>
      </div>

      {/* Popup overlay */}
      {selectedEvent && (
      <>
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            zIndex: 999
          }}
          onClick={() => setSelectedEvent(null)}
        />

        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#fff',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
            maxWidth: '480px',
            maxHeight: '85vh',
            overflowY: 'auto',
            zIndex: 1000,
            fontFamily: 'Segoe UI, sans-serif',
          }}
        >
          <h2 style={{ marginBottom: '8px', fontSize: '20px', fontWeight: '600', color: '#2E5074' }}>
            {selectedEvent?.organizer?.emailAddress?.name || 'No Name'}
          </h2>

          <div style={{ fontSize: '14px', color: '#374151', marginBottom: '6px' }}>
            <strong>Start - End:</strong> {toAMPM_UTCplus7(selectedEvent?.start?.dateTime)} - {toAMPM_UTCplus7(selectedEvent?.end?.dateTime)}
          </div>

          <div style={{
            fontSize: '14px',
            color: '#EF4444',
            fontWeight: '500',
            marginBottom: '12px'
          }}>
            ⏱ <strong>Time Remaining:</strong> {getTimeRemaining(selectedEvent)}
          </div>

          <div
            style={{
              borderTop: '1px solid #E5E7EB',
              paddingTop: '12px',
              fontSize: '14px',
              color: '#374151',
              lineHeight: '1.5',
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button
              onClick={() => setSelectedEvent(null)}
              style={{
                background: '#EF4444',
                color: '#fff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.background = '#dc2626'}
              onMouseOut={(e) => e.target.style.background = '#EF4444'}
            >
              Close
            </button>
          </div>
        </div>
      </>
    )}

    </div>
  );
}
