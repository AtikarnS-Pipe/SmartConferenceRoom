import React, { useEffect, useState, useRef } from "react";
import { useIsFullDayEvent } from "../hooks/useIsFullDayEvent.jsx";
import { Timer, Clock, User } from "lucide-react";

export default function TimeSchedule({
  currentTime,
  events = [],
  zoomLevel,
  setZoomLevel,
}) {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [timePosition, setTimePosition] = useState(0);
  const scheduleRef = useRef(null);
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const baseWidth = 1200;
  const [hasScrolledToDefault, setHasScrolledToDefault] = useState(false);
  const [isAtDefaultPosition, setIsAtDefaultPosition] = useState(true);
  const zoomMin = 0.5;
  const zoomMax = 4;

  // Default time range: 8:00 AM to 7:00 PM (11 hours out of 24)
  const defaultStartHour = 8; // 8:00 AM
  const defaultEndHour = 19; // 7:00 PM
  const defaultRangeHours = defaultEndHour - defaultStartHour; // 11 hours
  const times = [
    "12:00 AM",
    "01:00 AM",
    "02:00 AM",
    "03:00 AM",
    "04:00 AM",
    "05:00 AM",
    "06:00 AM",
    "07:00 AM",
    "08:00 AM",
    "09:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "01:00 PM",
    "02:00 PM",
    "03:00 PM",
    "04:00 PM",
    "05:00 PM",
    "06:00 PM",
    "07:00 PM",
    "08:00 PM",
    "09:00 PM",
    "10:00 PM",
    "11:00 PM",
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
    window.addEventListener("resize", updateContainerWidth);

    return () => {
      window.removeEventListener("resize", updateContainerWidth);
    };
  }, []);

  // ฟังก์ชันคำนวณเวลาที่เหลือ
  function getTimeRemaining(event) {
    if (!event?.start?.dateTime || !event?.end?.dateTime) return "-";

    const now = new Date();
    const start = new Date(event.start.dateTime + "Z");
    const end = new Date(event.end.dateTime + "Z");

    if (now < start) {
      // แสดง countdown เวลาที่เหลือจนกว่าจะเริ่ม event (ไม่มีคำว่า "Starts in")
      const diff = start - now;
      const seconds = Math.floor(diff / 1000) % 60;
      const minutes = Math.floor(diff / (1000 * 60)) % 60;
      const hours = Math.floor(diff / (1000 * 60 * 60)) % 24;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      let result = "";
      if (days > 0) result += `${days}d `;
      if (hours > 0) result += `${hours}h `;
      if (minutes > 0 || hours > 0 || days > 0) result += `${minutes}m `;
      result += `${seconds}s`;

      return result.trim();
    }

    if (now >= end) return "Time up.";

    // แสดงเวลาที่เหลือของ event ที่กำลังดำเนินอยู่
    const diff = end - now;
    const seconds = Math.floor(diff / 1000) % 60;
    const minutes = Math.floor(diff / (1000 * 60)) % 60;
    const hours = Math.floor(diff / (1000 * 60 * 60));

    let result = "";
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0 || hours > 0) result += `${minutes}m `;
    result += `${seconds}s`;

    return result.trim();
  }

  // เพิ่มฟังก์ชันใหม่เพื่อตรวจสอบว่า event ยังไม่เริ่มหรือไม่
  function isEventNotStarted(event) {
    if (!event?.start?.dateTime) return false;
    const now = new Date();
    const start = new Date(event.start.dateTime + "Z");
    return now < start;
  }

  // แปลงเวลาจาก UTC เป็น UTC+7 รูปแบบ 24 ชั่วโมง hh:mm
  function to24HHMM_UTCplus7(dateTimeStr) {
    if (!dateTimeStr) return "--:--";
    const date = new Date(dateTimeStr + "Z");
    const utcPlus7 = new Date(date.getTime() + 7 * 60 * 60 * 1000);
    const hours = String(utcPlus7.getUTCHours()).padStart(2, "0");
    const minutes = String(utcPlus7.getUTCMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  function toAMPM_UTCplus7(dateTimeStr) {
    if (!dateTimeStr) return "--:--";
    const date = new Date(dateTimeStr + "Z");
    const utcPlus7 = new Date(date.getTime() + 7 * 60 * 60 * 1000);
    let hours = utcPlus7.getUTCHours();
    const minutes = utcPlus7.getUTCMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )} ${ampm}`;
  }

  // Single timer for both zoom and scroll reset
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let inactivityTimer;

    // Function to reset to default view with precise calculation
    const resetToDefaultView = () => {
      const defaultZoom = getDefaultRangeZoomLevel();
      const scheduleWidth = baseWidth * defaultZoom;
      const startHourPercent = defaultStartHour / 24; // 8/24 = 0.333
      const targetPosition = startHourPercent * scheduleWidth;

      // Set zoom and scroll simultaneously without delay
      setZoomLevel(defaultZoom);
      container.scrollLeft = targetPosition; // Direct assignment, no smooth scroll
    };

    // Reset timer on any interaction
    const resetTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(resetToDefaultView, 60000); // 60 seconds
    };

    // Event handlers
    const handleScroll = resetTimer;
    const handleWheel = resetTimer;
    const handleTouch = resetTimer;

    // Add event listeners
    container.addEventListener("scroll", handleScroll);
    container.addEventListener("wheel", handleWheel, { passive: true });
    container.addEventListener("touchstart", handleTouch);
    container.addEventListener("touchmove", handleTouch);

    // Initial timer
    resetTimer();

    return () => {
      container.removeEventListener("scroll", handleScroll);
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("touchstart", handleTouch);
      container.removeEventListener("touchmove", handleTouch);
      if (inactivityTimer) clearTimeout(inactivityTimer);
    };
  }, [containerWidth, baseWidth, defaultStartHour, zoomLevel]);

  // Update time position
  useEffect(() => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    const startMinutes = 0; // Start at 00:00
    const endMinutes = 24 * 60; // End at 24:00
    const totalRange = endMinutes - startMinutes;
    const percent = (totalMinutes / totalRange) * 100;
    setTimePosition(percent);
  }, [currentTime]);

  function getTimePercent(timeStr) {
    if (!timeStr || !/^\d{2}:\d{2}$/.test(timeStr)) return 0;
    const [hours, minutes] = timeStr.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes;
    const startMinutes = 0; // Start at 00:00
    const endMinutes = 24 * 60; // End at 24:00
    return (totalMinutes / (endMinutes - startMinutes)) * 100;
  }

  // Calculate the zoom level needed to fit the container
  function getAdaptiveZoomLevel() {
    if (containerWidth <= 0) return 1;
    const adaptiveZoom = containerWidth / baseWidth;
    return Math.max(adaptiveZoom, zoomMin);
  }

  // Calculate zoom level to show default time range (8 AM - 7 PM)
  function getDefaultRangeZoomLevel() {
    if (containerWidth <= 0) return 2.0;

    // คำนวณ zoom ที่ต้องการให้ช่วง 8am-7pm (11 ชั่วโมง) แสดงเต็มหน้าจอ
    // baseWidth = 1200px แสดง 24 ชั่วโมง
    // ต้องการให้ containerWidth แสดง 11 ชั่วโมง
    // zoom = (containerWidth / baseWidth) * (24 / 11)

    const baseZoomForContainer = containerWidth / baseWidth; // zoom สำหรับให้ timeline เต็มหน้าจอ
    const hoursRatio = 24 / defaultRangeHours; // 24 / 11 ≈ 2.18
    const dynamicZoom = baseZoomForContainer * hoursRatio;

    // ให้ minimum zoom เป็น 1.5 เพื่อไม่ให้เล็กเกินไป
    return Math.max(dynamicZoom, 1.5);
  }

  useEffect(() => {
    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;

        // Allow zooming out to see full timeline, but maintain minimum adaptive zoom
        const minZoom = getAdaptiveZoomLevel();
        setZoomLevel((prev) =>
          Math.min(zoomMax, Math.max(minZoom, prev + delta))
        );
      }
    };
    const node = scheduleRef.current;
    if (node) {
      node.addEventListener("wheel", handleWheel, { passive: false });
    }
    return () => {
      if (node) {
        node.removeEventListener("wheel", handleWheel);
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
            // Allow zooming out to see full timeline, but maintain minimum adaptive zoom
            const minZoom = getAdaptiveZoomLevel();
            const newZoom = Math.min(
              zoomMax,
              Math.max(minZoom, prev + deltaZoom)
            );
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
      node.addEventListener("touchstart", handleTouchStart, { passive: false });
      node.addEventListener("touchmove", handleTouchMove, { passive: false });
      node.addEventListener("touchend", handleTouchEnd);
      node.addEventListener("touchcancel", handleTouchEnd);
    }
    return () => {
      if (node) {
        node.removeEventListener("touchstart", handleTouchStart);
        node.removeEventListener("touchmove", handleTouchMove);
        node.removeEventListener("touchend", handleTouchEnd);
        node.removeEventListener("touchcancel", handleTouchEnd);
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
    if (containerWidth > 0 && !hasScrolledToDefault) {
      // Use the default range zoom level for initial display
      setZoomLevel(getDefaultRangeZoomLevel());
    }
  }, [containerWidth]);

  // Effective zoom level prioritizes default range zoom for initial view
  const effectiveZoomLevel = Math.max(
    zoomLevel,
    hasScrolledToDefault ? getAdaptiveZoomLevel() : getDefaultRangeZoomLevel()
  );

  // Auto-scroll to show 8:00 AM - 7:00 PM range on mount
  useEffect(() => {
    if (containerRef.current && !hasScrolledToDefault && containerWidth > 0) {
      const container = containerRef.current;
      // scheduleWidth = baseWidth * zoom (zoom = 24/11)
      const scheduleWidth = baseWidth * getDefaultRangeZoomLevel();
      // 8am = 8/24 ของ scheduleWidth
      const startHourPercent = defaultStartHour / 24;
      const targetPosition = startHourPercent * scheduleWidth;
      // scrollLeft = ตำแหน่ง 8am
      container.scrollLeft = targetPosition;
      setHasScrolledToDefault(true);
      setIsAtDefaultPosition(true);
    }
  }, [
    containerWidth,
    zoomLevel,
    hasScrolledToDefault,
    baseWidth,
    defaultStartHour,
    defaultRangeHours,
  ]);

  // Monitor scroll position to detect if user scrolled away from default
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (!hasScrolledToDefault) return;

      const scheduleWidth = baseWidth * effectiveZoomLevel;
      const startHourPercent = defaultStartHour / 24;
      const defaultPosition = startHourPercent * scheduleWidth;
      const currentPosition = container.scrollLeft;

      // Check if we're close to the default position (within 20px tolerance)
      const isAtDefault = Math.abs(currentPosition - defaultPosition) < 20;
      setIsAtDefaultPosition(isAtDefault);
    };

    container.addEventListener("scroll", handleScroll);

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [hasScrolledToDefault, effectiveZoomLevel, baseWidth, defaultStartHour]);

  const isFullDayEvent = useIsFullDayEvent();

  return (
    <>
      <div
        ref={containerRef}
        style={{
          width: "100%",
          overflowX: "auto",
          overflowY: "hidden",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          ref={scheduleRef}
          style={{
            position: "relative",
            width: `${baseWidth * effectiveZoomLevel}px`,
            transition: "width 0.3s ease",
            zIndex: 1,
          }}
        >
          {/* Time Labels */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              marginBottom: "4px",
            }}
          >
            {times.map((time, i) => (
              <div key={i} style={{ fontSize: "16px", color: "#4E4E4E" }}>
                {time}
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div
            style={{
              position: "relative",
              height: "100px",
              backgroundColor: "#F3F4F6",
              borderRadius: "10px",
              overflow: "hidden",
            }}
          >
            {/* Events */}
            {Array.isArray(events) &&
              events.map((event, i) => {
                // Check if this is a 24-hour or multi-day event
                const isFullDayEvent = () => {
                  if (!event?.start?.dateTime || !event?.end?.dateTime)
                    return false;

                  const startDate = new Date(event.start.dateTime + "Z");
                  const endDate = new Date(event.end.dateTime + "Z");

                  // Calculate duration in hours
                  const durationHours =
                    (endDate - startDate) / (1000 * 60 * 60);

                  // Consider it a full day if duration is 24 hours or more
                  return durationHours >= 24;
                };

                // If it's a full day event, display it across the entire schedule
                if (isFullDayEvent()) {
                  const startAMPM = toAMPM_UTCplus7(event?.start?.dateTime);
                  const endAMPM = toAMPM_UTCplus7(event?.end?.dateTime);
                  const color = "#2E5074";

                  return (
                    <div
                      key={i}
                      onClick={() => setSelectedEvent(event)}
                      style={{
                        position: "absolute",
                        top: "20%",
                        left: "0%",
                        width: "100%",
                        height: "60%",
                        backgroundColor: color,
                        borderRadius: "4px",
                        padding: "2px 6px",
                        fontSize: "14px",
                        color: "white",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        cursor: "pointer",
                      }}
                    >
                      <p style={{ display: "inline-block", fontSize: "1rem" }}>
                        {event?.organizer?.emailAddress?.name || "No Name"}
                      </p>
                      <p>(Full Day)</p>
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
                const color = "#2E5074";
                return (
                  <div
                    key={i}
                    onClick={() => setSelectedEvent(event)}
                    style={{
                      position: "absolute",
                      top: "20%",
                      left: `${startPercent}%`,
                      width: `${widthPercent}%`,
                      height: "60%",
                      backgroundColor: color,
                      borderRadius: "4px",
                      padding: "2px 6px",
                      fontSize: "12px",
                      color: "white",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                      cursor: "pointer",
                    }}
                  >
                    <p style={{ display: "inline-block", fontSize: "1rem" }}>
                      {event?.organizer?.emailAddress?.name || "No Name"}
                    </p>
                    <p style={{ fontSize: "0.875rem" }}>
                      {startAMPM} - {endAMPM}
                    </p>
                  </div>
                );
              })}

            {/* Time Indicator */}
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${timePosition}%`,
                width: "2px",
                backgroundColor: "#EF4444",
                zIndex: 10,
                transition: "left 1s ease",
                boxShadow: "0 0 4px rgba(239, 68, 68, 0.5)",
              }}
            />

            {/* Hour Dividers */}
            <div style={{ display: "flex", height: "100%" }}>
              {times.map((_, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    borderRight:
                      i === times.length - 1 ? "none" : "1px solid #D1D5DB",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Bottom Labels - Conditional based on zoom level */}
          <div
            style={{
              position: "relative",
              marginTop: "4px",
              height: "20px",
            }}
          >
            {Math.abs(effectiveZoomLevel - getDefaultRangeZoomLevel()) < 0.1 &&
            isAtDefaultPosition ? (
              // Show default range labels when at default zoom AND default scroll position
              <>
                <div
                  style={{
                    position: "absolute",
                    left: `${((8 + 0.3) / 24) * 100}%`,
                    transform: "translateX(-50%)",
                    fontSize: "16px",
                    color: "#4E4E4E",
                  }}
                >
                  8:00 AM
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: `${((18 + 0.7) / 24) * 100}%`,
                    transform: "translateX(-50%)",
                    fontSize: "16px",
                    color: "#4E4E4E",
                  }}
                >
                  7:00 PM
                </div>
              </>
            ) : (
              // Show full day labels at edges when zoomed in/out
              <>
                <div
                  style={{
                    position: "absolute",
                    left: "0",
                    fontSize: "16px",
                    color: "#4E4E4E",
                  }}
                >
                  12:00 AM
                </div>
                <div
                  style={{
                    position: "absolute",
                    right: "0",
                    fontSize: "16px",
                    color: "#4E4E4E",
                  }}
                >
                  12:00 AM
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Popup overlay (ย้ายออกมานอก container) */}
      {selectedEvent && (
        <>
          {/* Overlay */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(6px)",
              zIndex: 9999,
            }}
            onClick={() => setSelectedEvent(null)}
          />

          {/* Popup */}
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "#fff",
              padding: "32px",
              borderRadius: "20px",
              boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
              width: "90%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflowY: "auto",
              zIndex: 10000,
              fontFamily: "Segoe UI, sans-serif",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "20px",
                gap: "12px",
                marginLeft: "12px",
              }}
            >
              <User size={32} color="#2563EB" />
              <h2
                style={{
                  margin: 0,
                  fontSize: "24px",
                  fontWeight: 600,
                  color: "#1F2937",
                }}
              >
                {selectedEvent?.organizer?.emailAddress?.name || "No Name"}
              </h2>
            </div>

            {/* Time Range */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "16px",
                gap: "10px",
                color: "#374151",
                fontSize: "20px",
                marginLeft: "12px",
              }}
            >
              <Clock size={30} />
              <span>
                <strong>Start - End:</strong>{" "}
                {isFullDayEvent(selectedEvent)
                  ? "Full day"
                  : `${toAMPM_UTCplus7(
                      selectedEvent?.start?.dateTime
                    )} - ${toAMPM_UTCplus7(selectedEvent?.end?.dateTime)}`}
              </span>
            </div>

            {/* Time Remaining */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "24px",
                gap: "10px",
                color: "#DC2626",
                fontSize: "20px",
                fontWeight: 500,
                background: "#FEF2F2",
                padding: "10px 14px",
                borderRadius: "8px",
              }}
            >
              <Timer size={25} />
              <span>
                <strong>
                  {isEventNotStarted(selectedEvent)
                    ? "Count Down Time:"
                    : "Time Remaining:"}
                </strong>{" "}
                {getTimeRemaining(selectedEvent)}
              </span>
            </div>

            {/* Divider */}
            <hr
              style={{
                border: "none",
                borderTop: "1px solid #E5E7EB",
                margin: "20px 0",
              }}
            />

            {/* Footer Actions */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
              }}
            >
              <button
                onClick={() => setSelectedEvent(null)}
                style={{
                  background: "#DC2626",
                  color: "#fff",
                  border: "none",
                  padding: "15px 25px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "background 0.2s ease",
                }}
                onMouseOver={(e) => (e.target.style.background = "#B91C1C")}
                onMouseOut={(e) => (e.target.style.background = "#DC2626")}
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
