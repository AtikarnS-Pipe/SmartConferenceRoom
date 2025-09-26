import React, { useState, useEffect } from "react";
import { X, Plus, Minus, Home, Calendar } from "lucide-react";
import { useRoomData } from "../hooks/useRoomData";
import { useEvents } from "../hooks/useEvents";
import axios from "axios";

//constant
const COUNTDOWN_TIME = 60; // Booking Modal countdown time in 60 seconds
const BookingModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    subject: "",
    startTime: "",
    duration: 15,
    bookedBy: "",
  });
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [errors, setErrors] = useState({});
  const [subjectEnabled, setSubjectEnabled] = useState(false);
  const [bookedByEnabled, setBookedByEnabled] = useState(false); //ถ้าไม่ได้ใช้ลบออกด้วย
  const [showPinModal, setShowPinModal] = useState(false);
  const [bookingPin, setBookingPin] = useState("");
  const [showPinWarning, setShowPinWarning] = useState(false);
  const [waitingEvent, setWaitingEvent] = useState(false);
  const [targetStart, setTargetStart] = useState(null);
  const [targetEnd, setTargetEnd] = useState(null);
  const [countdown, setCountdown] = useState(COUNTDOWN_TIME);
  const [isModalInitialized, setIsModalInitialized] = useState(false);
  const [pastTimeWarning, setPastTimeWarning] = useState("");
  const [durationAdjustmentWarning, setDurationAdjustmentWarning] =
    useState("");
  const { floor, room } = useRoomData();
  const { events, loading: loadingEvents } = useEvents(floor, room);
  const roomId = `${floor}${room}`; // สร้าง roomId จาก floor และ room

  // Wrapper function for setFormData to validate time
  const safeSetFormData = (updateFunction) => {
    const newData =
      typeof updateFunction === "function"
        ? updateFunction(formData)
        : updateFunction;

    // ตรวจสอบ startTime ก่อน set
    if (newData.startTime && newData.startTime !== formData.startTime) {
      const now = new Date();
      const proposedTime = new Date(newData.startTime);
      const nowLocalTime = now.getHours() * 60 + now.getMinutes();
      const proposedLocalTime =
        proposedTime.getHours() * 60 + proposedTime.getMinutes();
      const allowedMinutesBack = 15;
      const earliestAllowedTime = nowLocalTime - allowedMinutesBack;

      // อนุญาตให้ set ได้ถ้า:
      // 1. เวลาที่จะ set ไม่เกิน 15 นาทีในอดีต หรือ
      // 2. เป็นการย้ายจากอนาคตมาอนาคตที่เร็วกว่า (แต่ยังเป็นอนาคต)
      const currentTime = formData.startTime
        ? new Date(formData.startTime)
        : null;
      const currentLocalTime = currentTime
        ? currentTime.getHours() * 60 + currentTime.getMinutes()
        : 0;
      const isMovingFromFutureToFuture =
        currentLocalTime > nowLocalTime && proposedLocalTime > nowLocalTime;

      if (
        proposedLocalTime < earliestAllowedTime &&
        !isMovingFromFutureToFuture
      ) {
        // console.log(
        //   "BLOCKED: Attempted to set time beyond 15-minute past limit"
        // );
        // console.log(
        //   "Proposed time:",
        //   `${Math.floor(proposedLocalTime / 60)}:${String(
        //     proposedLocalTime % 60
        //   ).padStart(2, "0")}`
        // );
        // console.log(
        //   "Earliest allowed:",
        //   `${Math.floor(earliestAllowedTime / 60)}:${String(
        //     earliestAllowedTime % 60
        //   ).padStart(2, "0")}`
        // );
        // console.log("Is moving future to future:", isMovingFromFutureToFuture);

        setPastTimeWarning("Cannot set time more than 15 minutes in the past");
        setTimeout(() => setPastTimeWarning(""), 3000);
        return; // ไม่อัปเดต formData
      }
    }

    setFormData(newData);
  };

  useEffect(() => {
    console.log("โหลดดดดด", loadingEvents);
  }, [loadingEvents]);

  // ปิด modal อัตโนมัติหลัง 5 นาที ถ้าไม่มีการโต้ตอบ
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5 * 60 * 1000); // 5 นาที
    return () => clearTimeout(timer);
  }, [loadingCreate]);

  //ปิด pinmodal หลัง 60 วินาที
  useEffect(() => {
    if (!showPinModal) return;
    const timeoutId = setTimeout(() => {
      setShowPinModal(false);
    }, 60000);

    return () => clearTimeout(timeoutId);
  }, [showPinModal]);

  // Reset countdown เมื่อ modal เปิด
  useEffect(() => {
    if (isOpen) {
      setCountdown(COUNTDOWN_TIME);
      setIsModalInitialized(true);
    } else {
      setIsModalInitialized(false);
    }
  }, [isOpen]);

  // Auto-close timer with countdown
  useEffect(() => {
    let countdownInterval;

    // console.log('Timer useEffect:', { isOpen, showPinModal, countdown });

    if (isOpen && !showPinModal) {
      // console.log('Starting/continuing countdown timer');

      // สร้าง interval สำหรับ countdown
      countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          // console.log('Countdown:', prev - 1);
          const newCount = prev - 1;
          return newCount;
        });
      }, 1000);
    } else {
      // console.log('Timer not started:', { isOpen, showPinModal });
      // หยุด countdown เมื่อมี PIN modal
      setCountdown(0);
    }

    // Cleanup timer เมื่อ modal ปิดหรือ component unmount
    return () => {
      if (countdownInterval) {
        // console.log('Clearing countdown interval');
        clearInterval(countdownInterval);
      }
    };
  }, [isOpen, showPinModal, countdown]); // เพิ่ม countdown เป็น dependency เพื่อรีสตาร์ทเมื่อรีเซ็ต

  // แยก useEffect สำหรับตรวจสอบ countdown และปิด modal
  useEffect(() => {
    if (
      countdown === 0 &&
      isOpen &&
      !showPinModal &&
      !loadingCreate &&
      !waitingEvent
    ) {
      // console.log('Countdown reached 0, closing modal');
      onClose();
    }
  }, [countdown, isOpen, showPinModal, onClose, loadingCreate, waitingEvent]);

  // fn เมื่อ users กดปุ่มใดๆ ใน modalจะรีเซ็ต countdown
  const handleUserInteraction = () => {
    // console.log('User interaction detected - restarting countdown');
    setCountdown(COUNTDOWN_TIME); // รีเซ็ต countdown กลับไปที่ 30 วินาที
  };

  //fn ปัดเวลาให้เป็น 15 นาที
  const getCurrentTime = () => {
    const now = new Date();
    const totalMinutes = now.getHours() * 60 + now.getMinutes();
    const roundedMinutes = Math.ceil(totalMinutes / 15) * 15;

    // Handle overflow และจำกัดไม่เกิน 23:45
    let hours = Math.floor(roundedMinutes / 60);
    let minutes = roundedMinutes % 60;

    // ถ้าเกิน 23:45 (11:45 PM) ให้จำกัดไว้ที่ 23:45
    if (hours >= 24 || (hours === 23 && minutes > 45)) {
      hours = 23;
      minutes = 45; // อนุญาตให้จองได้ถึง 23:45 (11:45 PM)
    }

    // Allow booking 24/7 - no time restrictions
    // (เอาข้อจำกัดเวลา 8:00-19:00 ออก)

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}T${String(hours).padStart(2, "0")}:${String(
      minutes
    ).padStart(2, "0")}`;
  };

  // ฟังก์ชันหาเวลาว่างถัดไป (รองรับทั้งไปข้างหน้าและย้อนหลังอย่างปลอดภัย)
  const findNextAvailableTime = (
    startTime,
    duration,
    direction = "forward"
  ) => {
    // console.log('🔍 findNextAvailableTime called:', { startTime, duration, direction, eventsCount: events?.length });

    if (!startTime) {
      // console.log('❌ No startTime provided');
      return "";
    }

    const proposedStart = new Date(startTime);
    const today = new Date();

    // เริ่มตรวจสอบจากเวลาที่กำหนด
    let checkTime = new Date(proposedStart);

    // ถ้าเป็น forward direction และเวลาที่ระบุเป็นเวลาในอดีต ให้เริ่มจากเวลาปัจจุบัน
    if (direction === "forward" && checkTime < today) {
      checkTime = new Date(today);
      // ปัดเวลาปัจจุบันให้เป็น 15 นาที
      const totalMinutes = checkTime.getHours() * 60 + checkTime.getMinutes();
      const roundedMinutes = Math.ceil(totalMinutes / 15) * 15;
      let hours = Math.floor(roundedMinutes / 60);
      let minutes = roundedMinutes % 60;

      if (hours >= 24 || (hours === 23 && minutes > 45)) {
        hours = 23;
        minutes = 45;
      }

      checkTime.setHours(hours, minutes, 0, 0);
    }

    // set time boundaries for today (24/7 availability)
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0); // เริ่มที่ 00:00 ของวันนี้
    const endOfDay = new Date(today);
    endOfDay.setHours(24, 0, 0, 0); // จบที่ 24:00 (เที่ยงคืน) ของวันนี้

    // console.log('📅 Time boundaries:', {
    //   startOfDay: startOfDay.toLocaleTimeString(),
    //   endOfDay: endOfDay.toLocaleTimeString(),
    //   checkTime: checkTime.toLocaleTimeString()
    // });

    // If no events, check if current time is within the day
    if (!events || events.length === 0) {
      // console.log('📋 No events to check against');
      if (checkTime >= startOfDay && checkTime < endOfDay) {
        const checkEnd = new Date(checkTime);
        checkEnd.setMinutes(checkEnd.getMinutes() + duration);
        if (checkEnd <= endOfDay) {
          // console.log('✅ Current time is valid with no events');
          return startTime;
        }
      }
      // If current time is outside valid range, adjust to valid time
      if (checkTime < startOfDay) {
        // console.log('⏰ Before start of day, moving to 00:00');
        checkTime = new Date(startOfDay);
      } else if (checkTime >= endOfDay) {
        // console.log('⏰ After end of day');
        if (direction === "forward") {
          // สำหรับ forward direction ถ้าเกิน endOfDay แล้วไม่มีเวลาว่าง ให้คืนค่าเดิม
          return startTime;
        } else {
          checkTime = new Date(startOfDay);
        }
      }
    }

    // กำหนดทิศทางการค้นหา
    const increment = direction === "forward" ? 15 : -15;
    const boundary = direction === "forward" ? endOfDay : startOfDay;
    const comparison =
      direction === "forward"
        ? (time, bound) => time < bound
        : (time, bound) => time >= bound;

    let maxIterations = 96; // 24 hours * 4 (15-min slots per hour)
    let iterations = 0;

    // console.log(`🔄 Starting search loop (${direction}), max iterations: ${maxIterations}`);

    while (comparison(checkTime, boundary) && iterations < maxIterations) {
      iterations++;
      // console.log(`🔄 Iteration ${iterations}: checking ${checkTime.toLocaleTimeString()}`);

      // สำหรับ backward direction: ตรวจสอบว่าไม่กลับไปในอดีตเกิน 15 นาที
      if (direction === "backward") {
        const minAllowedTime = new Date(today);
        minAllowedTime.setMinutes(minAllowedTime.getMinutes() - 15);

        if (checkTime < minAllowedTime) {
          // console.log(
          //   "⏰ Time too far in past (> 15 min), stopping backward search at:",
          //   checkTime.toLocaleTimeString()
          // );
          break;
        }
      }

      // ตรวจสอบว่าเวลานี้ว่างไหม
      const checkEnd = new Date(checkTime);
      checkEnd.setMinutes(checkEnd.getMinutes() + duration);

      // ตรวจสอบว่าไม่เกินขอบเขตเวลาทำการ
      if (direction === "forward" && checkEnd > endOfDay) {
        // console.log('🚫 Would exceed end of day, stopping search');
        break;
      }
      if (direction === "backward" && checkTime < startOfDay) {
        // console.log('🚫 Would go before start of day, stopping search');
        break;
      }

      // ตรวจสอบการทับซ้อนกับ events ที่มีอยู่
      let hasConflict = false;

      if (events && events.length > 0) {
        hasConflict = events.some((event) => {
          const eventStart = new Date(event.start.dateTime + "Z");
          const eventEnd = new Date(event.end.dateTime + "Z");

          // ตรวจสอบการทับซ้อน
          const conflicts = checkTime < eventEnd && checkEnd > eventStart;

          if (conflicts) {
            // console.log(`⚡ Conflict with event: ${eventStart.toLocaleTimeString()} - ${eventEnd.toLocaleTimeString()}`);
          }
          return conflicts;
        });
      }

      if (!hasConflict) {
        // console.log(`✅ Found available time: ${checkTime.toLocaleTimeString()}`);
        // เจอเวลาว่างแล้ว
        const year = checkTime.getFullYear();
        const month = String(checkTime.getMonth() + 1).padStart(2, "0");
        const day = String(checkTime.getDate()).padStart(2, "0");
        const hours = String(checkTime.getHours()).padStart(2, "0");
        const mins = String(checkTime.getMinutes()).padStart(2, "0");

        const result = `${year}-${month}-${day}T${hours}:${mins}`;
        // console.log(`🎯 Returning: ${result}`);
        return result;
      }

      // console.log('❌ Time slot occupied, moving to next slot');
      // เลื่อนไปตามทิศทางที่กำหนด
      checkTime.setMinutes(checkTime.getMinutes() + increment);
    }

    // console.log('No available time found in forward direction');

    // สำหรับ forward direction ไม่ต้องลองหาย้อนหลัง ให้คืนค่าเดิม
    // (เอา backward fallback ออกเพื่อไม่ให้หาเวลาในอดีต)

    // console.log('No available time found, returning original time:', startTime);
    // ถ้าหาไม่เจอ ให้คืนค่าเดิม
    return startTime;
  };

  // Initialize startTime when modal opens
  useEffect(() => {
    // console.log('useEffect triggered:', { isOpen, isModalInitialized, eventsLength: events?.length });

    // Only initialize when modal first opens, not on subsequent events updates
    if (isOpen && !isModalInitialized) {
      // console.log('🚀 Modal opened for first time, finding next available time...');
      // console.log('📅 Events available:', events?.length || 0);

      const rawCurrentTime = getCurrentTime();
      // console.log('⏰ Raw current time:', rawCurrentTime);

      // ตรวจสอบว่าเวลาปัจจุบันที่ได้มาไม่เกิน 15 นาทีในอดีตหรือไม่
      const now = new Date();
      const currentTimeObj = new Date(rawCurrentTime);
      const nowLocalTime = now.getHours() * 60 + now.getMinutes();
      const currentTimeLocal =
        currentTimeObj.getHours() * 60 + currentTimeObj.getMinutes();
      const earliestAllowedTime = nowLocalTime - 15;

      let validStartTime = rawCurrentTime;

      // ถ้าเวลาที่ได้มาเกิน 15 นาทีในอดีต ให้ปรับเป็นเวลาปัจจุบัน - 15 นาที
      if (currentTimeLocal < earliestAllowedTime) {
        // console.log(
        //   "Initial time is too far in past, adjusting to current time - 15 minutes"
        // );
        const adjustedTime = new Date(now);
        adjustedTime.setMinutes(adjustedTime.getMinutes() - 15);

        // ปัดเวลาให้เป็น 15 นาที
        const totalMinutes =
          adjustedTime.getHours() * 60 + adjustedTime.getMinutes();
        const roundedMinutes = Math.ceil(totalMinutes / 15) * 15;
        let hours = Math.floor(roundedMinutes / 60);
        let minutes = roundedMinutes % 60;

        if (hours >= 24) {
          hours = 23;
          minutes = 45;
        }

        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");

        validStartTime = `${year}-${month}-${day}T${String(hours).padStart(
          2,
          "0"
        )}:${String(minutes).padStart(2, "0")}`;
        // console.log("Adjusted valid start time:", validStartTime);
      }

      // Always try to find next available time, even if no events
      // console.log('🔍 Searching for available time...');
      const availableTime = findNextAvailableTime(
        validStartTime,
        15,
        "forward"
      );
      // console.log('✅ Available time result:', availableTime);

      if (availableTime && availableTime !== validStartTime) {
        // console.log('🎯 Setting available time:', availableTime);
        safeSetFormData((prev) => ({ ...prev, startTime: availableTime }));
      } else {
        // console.log('⚠️ No better time found, using valid time:', validStartTime);
        safeSetFormData((prev) => ({ ...prev, startTime: validStartTime }));
      }
    } else if (!isOpen) {
      // Reset when modal closes
      // console.log('🔄 Modal closed, resetting startTime');
      setFormData((prev) => ({ ...prev, startTime: "" }));
    }
  }, [isOpen, isModalInitialized]);

  // Handle events updates after modal is initialized
  useEffect(() => {
    if (
      isOpen &&
      isModalInitialized &&
      events &&
      events.length > 0 &&
      formData.startTime
    ) {
      // console.log('📋 Events updated, checking if current time needs adjustment...');
      // console.log('🔍 Current startTime:', formData.startTime);
      // console.log('🎯 Events count:', events.length);

      // Check if current time has conflict
      const hasConflict = checkTimeConflict(
        formData.startTime,
        formData.duration
      );
      // console.log('⚡ Has conflict:', hasConflict);

      if (hasConflict) {
        // console.log('🚨 Current time has conflict, finding better time...');
        const availableTime = findNextAvailableTime(
          formData.startTime,
          formData.duration,
          "forward"
        );
        // console.log('🎯 New available time:', availableTime);

        if (availableTime !== formData.startTime) {
          // console.log('✅ Updating to conflict-free time:', availableTime);
          safeSetFormData((prev) => ({ ...prev, startTime: availableTime }));
        }
      }
    }
  }, [events, isModalInitialized]);

  // ฟังก์ชันตรวจสอบการทับซ้อนของเวลา
  const checkTimeConflict = (startTime, duration) => {
    if (!startTime || !events || events.length === 0) return false;

    let proposedStart, proposedEnd;

    if (duration === 1440) {
      // All day booking (24 hours = 1440 minutes)
      // All day booking
      const baseDate = new Date(startTime);
      proposedStart = new Date(baseDate);
      proposedStart.setHours(0, 0, 0, 0); // All day starts at 00:00

      proposedEnd = new Date(proposedStart);
      proposedEnd.setHours(23, 59, 59, 999); // All day ends at 23:59
    } else {
      // Regular booking
      proposedStart = new Date(startTime);
      proposedEnd = new Date(proposedStart);
      proposedEnd.setMinutes(proposedEnd.getMinutes() + duration);

      // No business hours restrictions - allow 24-hour booking
    }

    // ตรวจสอบการทับซ้อนกับ events ที่มีอยู่
    const hasConflict = events.some((event) => {
      const eventStart = new Date(event.start.dateTime + "Z");
      const eventEnd = new Date(event.end.dateTime + "Z");

      // ตรวจสอบการทับซ้อน:
      // ทับซ้อนถ้า proposedStart < eventEnd และ proposedEnd > eventStart
      const isConflict = proposedStart < eventEnd && proposedEnd > eventStart;

      if (isConflict) {
        // console.log("Conflict detected:", {
        //   proposedStart: proposedStart.toISOString(),
        //   proposedEnd: proposedEnd.toISOString(),
        //   eventStart: eventStart.toISOString(),
        //   eventEnd: eventEnd.toISOString(),
        //   eventSubject: event.subject,
        // });
      }

      return isConflict;
    });

    // console.log("checkTimeConflict result:", {
    //   startTime,
    //   duration,
    //   proposedStart: proposedStart.toISOString(),
    //   proposedEnd: proposedEnd.toISOString(),
    //   eventsCount: events.length,
    //   hasConflict,
    // });

    return hasConflict;
  };

  // ตรวจสอบว่าสามารถจองได้หรือไม่
  const canBook = !checkTimeConflict(formData.startTime, formData.duration);

  // ฟังก์ชันสำหรับกำหนดข้อความปุ่ม
  const getBookingButtonText = () => {
    if (loadingEvents) return "Loading events...";
    if (loadingCreate) return "Booking...";
    if (waitingEvent) return "Waiting for confirmation...";
    if (!canBook) return "Time Conflict";
    return "Book Now";
  };

  const validateForm = () => {
    const newErrors = {};
    if (subjectEnabled && !formData.subject.trim())
      newErrors.subject = "Subject is required";
    if (!formData.startTime) newErrors.startTime = "Start time is required";
    if (bookedByEnabled && !formData.bookedBy.trim())
      newErrors.bookedBy = "Booked by is required";
    if (formData.duration < 15)
      newErrors.duration = "Minimum duration is 15 minutes";

    // เพิ่มการตรวจสอบการทับซ้อนเวลา
    if (checkTimeConflict(formData.startTime, formData.duration)) {
      newErrors.timeConflict = "Selected time conflicts with existing booking";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // อัปเดต timeline ให้แสดง existing events แบบละเอียด (แสดงแค่ 12 ชั่วโมง)
  const generateTimelineData = () => {
    const currentHour = formData.startTime
      ? new Date(formData.startTime).getHours()
      : new Date().getHours();

    // สร้าง timeline 12 ชั่วโมง โดยให้ currentHour อยู่ตรงกลาง
    const startHour = Math.max(0, currentHour - 6);
    const endHour = Math.min(23, startHour + 11);

    // ถ้า endHour ติดขอบ ให้ปรับ startHour
    const actualStartHour = Math.max(0, endHour - 11);

    const hours = Array.from({ length: 12 }, (_, i) => actualStartHour + i);
    const currentMinute = formData.startTime
      ? new Date(formData.startTime).getMinutes()
      : 0;
    const duration = formData.duration;

    return hours.map((hour) => {
      // คำนวณ existing events ที่ทับกับชั่วโมงนี้
      const existingEventsInHour = events.filter((event) => {
        const eventStart = new Date(event.start.dateTime + "Z");
        const eventEnd = new Date(event.end.dateTime + "Z");
        const hourStart = new Date();
        hourStart.setHours(hour, 0, 0, 0);
        const hourEnd = new Date();
        hourEnd.setHours(hour + 1, 0, 0, 0);

        return eventStart < hourEnd && eventEnd > hourStart;
      });

      // เก็บข้อมูล events ทั้งหมดในชั่วโมงนี้
      const eventsInThisHour = [];

      if (existingEventsInHour.length > 0) {
        existingEventsInHour.forEach((event) => {
          const eventStart = new Date(event.start.dateTime + "Z");
          const eventEnd = new Date(event.end.dateTime + "Z");

          // คำนวณช่วงเวลาที่ทับกับชั่วโมงนี้
          const hourStart = new Date();
          hourStart.setHours(hour, 0, 0, 0);
          const hourEnd = new Date();
          hourEnd.setHours(hour + 1, 0, 0, 0);

          const overlapStart = new Date(
            Math.max(eventStart.getTime(), hourStart.getTime())
          );
          const overlapEnd = new Date(
            Math.min(eventEnd.getTime(), hourEnd.getTime())
          );

          if (overlapStart < overlapEnd) {
            const eventStartMinutesFromHourStart =
              (overlapStart - hourStart) / (1000 * 60);
            const eventEndMinutesFromHourStart =
              (overlapEnd - hourStart) / (1000 * 60);

            const eventStartPercent =
              (eventStartMinutesFromHourStart / 60) * 100;
            const eventEndPercent = (eventEndMinutesFromHourStart / 60) * 100;

            eventsInThisHour.push({
              startPercent: eventStartPercent,
              endPercent: eventEndPercent,
              type: "existing",
            });
          }
        });
      }

      // รวมข้อมูลเป็น properties เดิมเพื่อความเข้ากันได้
      const hasExistingEvent = eventsInThisHour.length > 0;
      const existingEventStartPercent = hasExistingEvent
        ? eventsInThisHour[0].startPercent
        : 0;
      const existingEventPercentage = hasExistingEvent
        ? eventsInThisHour.reduce(
            (total, event) => total + (event.endPercent - event.startPercent),
            0
          )
        : 0;

      // คำนวณ proposed booking
      let proposedBookingPercentage = 0;
      let proposedBookingStartPercent = 0;

      if (formData.startTime && duration > 0) {
        // สร้าง proposed booking time range
        const proposedStart = new Date(formData.startTime);
        const proposedEnd = new Date(proposedStart);

        if (duration === 1440) {
          // All day booking (24 hours = 1440 minutes)
          // All day booking - ends at 23:59 of the same day
          proposedEnd.setHours(23, 59, 59, 999);
        } else {
          proposedEnd.setMinutes(proposedEnd.getMinutes() + duration);
        }

        // สร้าง hour range สำหรับชั่วโมงปัจจุบัน
        const hourStart = new Date();
        hourStart.setHours(hour, 0, 0, 0);
        const hourEnd = new Date();
        hourEnd.setHours(hour + 1, 0, 0, 0);

        // ตรวจสอบการทับซ้อน
        if (proposedStart < hourEnd && proposedEnd > hourStart) {
          // คำนวณช่วงเวลาที่ทับกับชั่วโมงนี้
          const overlapStart = new Date(
            Math.max(proposedStart.getTime(), hourStart.getTime())
          );
          const overlapEnd = new Date(
            Math.min(proposedEnd.getTime(), hourEnd.getTime())
          );

          if (overlapStart < overlapEnd) {
            const overlapMinutes = (overlapEnd - overlapStart) / (1000 * 60);
            proposedBookingPercentage = (overlapMinutes / 60) * 100;

            // คำนวณจุดเริ่มต้นของ booking ในชั่วโมงนี้
            const startMinutesFromHourStart =
              (overlapStart - hourStart) / (1000 * 60);
            proposedBookingStartPercent =
              (startMinutesFromHourStart / 60) * 100;
          }
        }
      }

      const isBooked = proposedBookingPercentage > 0;
      const isCurrentSlot = formData.startTime
        ? hour === new Date(formData.startTime).getHours()
        : false;

      return {
        hour,
        isBooked,
        isCurrentSlot,
        hasExistingEvent,
        existingEventPercentage,
        existingEventStartPercent,
        proposedBookingPercentage,
        proposedBookingStartPercent,
        eventsInThisHour, // เพิ่มข้อมูล events ทั้งหมดในชั่วโมง
      };
    });
  };

  // แปลง duration เป็น hh:mm ถ้าเกิน 60 นาที
  const formatDurationDisplay = (duration) => {
    if (duration < 60) return `${duration} min`;
    const hours = Math.floor(duration / 60);
    const mins = duration % 60;
    return `${hours}:${mins.toString().padStart(2, "0")} hr`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setLoadingCreate(true);
      try {
        let startDate, endDate;

        if (formData.duration === 1440) {
          // All day = 24 hours = 1440 minutes
          // กรณี All day → start เป็น 00:00:00 ของวันนั้น, end เป็น 23:59:59 ของวันเดียวกัน
          const baseDate = new Date(formData.startTime);
          startDate = new Date(baseDate);
          startDate.setHours(0, 0, 0, 0);

          endDate = new Date(baseDate);
          endDate.setHours(23, 59, 59, 999);
        } else {
          // Logic เดิม
          startDate = new Date(formData.startTime);
          endDate = new Date(startDate);
          endDate.setMinutes(endDate.getMinutes() + formData.duration);
        }

        // Format เป็น ISO string
        const startdatetime = startDate.toISOString();
        const enddatetime = endDate.toISOString();

        const payload = {
          RoomNumber: roomId,
          subject: formData.subject,
          email: formData.bookedBy,
          startdatetime,
          enddatetime,
        };

        // console.log("Submitting booking:", payload);

        // Step 1: Create the event
        const response = await axios.post("/api2/user/ms/create", {
          createroomdata: payload,
        });
        // console.log("Booking created successfully, waiting for events to update...");
        console.log("Create response:", response.data);
        // Step 2: ตั้ง flag เพื่อรอ event จาก SSE
        setTargetStart(startDate);
        setTargetEnd(endDate);
        setWaitingEvent(true);
      } catch (error) {
        console.error("Booking error:", error);
        setErrors({
          submit:
            error.response?.data?.error ||
            "Failed to book the room. Please try again.",
        });
        setLoadingCreate(false);
      }
    }
  };

  function randomPin() {
    return Math.floor(1000 + Math.random() * 9000).toString(); // 0.000-0.999*9000ได้ 0-8999 + 1000 จะได้ Range 1000-9999
  }

  // ฟังก์ชันสำหรับดึง PIN
  const getPin = async (matchevent) => {
    try {
      const Pin = randomPin();
      // console.log("Generated PIN:", Pin);
      const pinResponse = await axios.post("/api2/user/search-pin", {
        pindata: {
          eventId: matchevent.id,
          room_number: roomId,
          organizerMail: matchevent.organizer?.emailAddress?.address,
          pin: Pin,
          startDateTime: matchevent.start?.dateTime,
          endDateTime: matchevent.end?.dateTime,
        },
      });

      if (!pinResponse.data.success) {
        setErrors({
          submit:
            "Booking created successfully but failed to retrieve PIN. Please contact support.",
        });
        return;
      }
      setBookingPin(Pin);
      setShowPinWarning(false); // Reset warning state
      setShowPinModal(true);
      if (onSubmit) onSubmit(formData);

      setFormData({ subject: "", startTime: "", duration: 15, bookedBy: "" });
      setErrors({});
    } catch (error) {
      console.error("Booking error:", error);
      setErrors({
        submit:
          error.response?.data?.error ||
          "Failed to retrieve PIN. Please try again.",
      });
    } finally {
      setLoadingCreate(false);
    }
  };

  // useEffect สำหรับตรวจจับ event ใหม่จาก SSE
  useEffect(() => {
    if (
      !waitingEvent ||
      !targetStart ||
      !targetEnd ||
      !events ||
      events.length === 0
    )
      return;

    const matchedEvent = events.find((event) => {
      const eventStart = new Date(event.start.dateTime + "Z");
      const eventEnd = new Date(event.end.dateTime + "Z");
      const startTimeDiff = Math.abs(
        eventStart.getTime() - targetStart.getTime()
      );
      const endTimeDiff = Math.abs(eventEnd.getTime() - targetEnd.getTime());
      return startTimeDiff <= 2 * 60 * 1000 && endTimeDiff <= 2 * 60 * 1000;
    });

    if (matchedEvent) {
      // console.log("Found matching event from SSE:", matchedEvent.id);
      getPin(matchedEvent);
      setWaitingEvent(false);
      setTargetStart(null);
      setTargetEnd(null);
    }
  }, [events, waitingEvent, targetStart, targetEnd]);

  const handleChange = (field, value) => {
    handleUserInteraction(); // หยุด timer เมื่อผู้ใช้เปลี่ยนค่า

    if (field === "startTime" || field === "duration") {
      // ตรวจสอบและเลื่อนเวลาถ้ามี conflict
      const newStartTime = field === "startTime" ? value : formData.startTime;
      const newDuration = field === "duration" ? value : formData.duration;

      // ตรวจสอบ 15 นาทีในอดีตสำหรับ startTime
      if (field === "startTime" && newStartTime) {
        const now = new Date();
        const proposedTime = new Date(newStartTime);
        const nowLocalTime = now.getHours() * 60 + now.getMinutes();
        const proposedLocalTime =
          proposedTime.getHours() * 60 + proposedTime.getMinutes();
        const allowedMinutesBack = 15;
        const earliestAllowedTime = nowLocalTime - allowedMinutesBack;

        // อนุญาตให้ตั้งได้ถ้า:
        // 1. เวลาที่จะตั้งไม่เกิน 15 นาทีในอดีต หรือ
        // 2. เป็นการย้ายจากอนาคตมาอนาคตที่เร็วกว่า
        const currentTime = formData.startTime
          ? new Date(formData.startTime)
          : null;
        const currentLocalTime = currentTime
          ? currentTime.getHours() * 60 + currentTime.getMinutes()
          : 0;
        const isMovingFromFutureToFuture =
          currentLocalTime > nowLocalTime && proposedLocalTime > nowLocalTime;

        // Block เฉพาะเมื่อพยายามตั้งเวลาเกิน 15 นาทีในอดีต และไม่ใช่การย้ายจากอนาคตมาอนาคต
        if (
          proposedLocalTime < earliestAllowedTime &&
          !isMovingFromFutureToFuture
        ) {
          // console.log(
          //   "BLOCKED: Direct time change would exceed 15-minute past limit"
          // );
          // console.log(
          //   "Current time:",
          //   currentLocalTime > 0
          //     ? `${Math.floor(currentLocalTime / 60)}:${String(
          //         currentLocalTime % 60
          //       ).padStart(2, "0")}`
          //     : "None"
          // );
          // console.log(
          //   "Proposed time:",
          //   `${Math.floor(proposedLocalTime / 60)}:${String(
          //     proposedLocalTime % 60
          //   ).padStart(2, "0")}`
          // );
          // console.log("Is future to future:", isMovingFromFutureToFuture);
          // setPastTimeWarning(
          //   "Cannot set time more than 15 minutes in the past"
          // );
          setTimeout(() => setPastTimeWarning(""), 3000);
          return;
        }
      }

      if (newStartTime && newDuration) {
        const availableTime = findNextAvailableTime(
          newStartTime,
          newDuration,
          "forward"
        );
        if (availableTime !== newStartTime && field === "startTime") {
          // แจ้งผู้ใช้ว่าเวลาถูกเลื่อน
          // console.log(`Time adjusted from ${formatDisplayTime(newStartTime)} to ${formatDisplayTime(availableTime)} due to conflict`);
          safeSetFormData((prev) => ({ ...prev, startTime: availableTime }));
          return;
        } else if (field === "duration") {
          // เมื่อเปลี่ยน duration ให้ตรวจสอบและเลื่อนเวลาถ้าจำเป็น
          const availableTime = findNextAvailableTime(
            newStartTime,
            newDuration,
            "forward"
          );
          if (availableTime !== newStartTime) {
            setFormData((prev) => ({
              ...prev,
              [field]: value,
              startTime: availableTime,
            }));
            return;
          }
        }
      }
    }

    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const adjustTime = (increment) => {
    handleUserInteraction();
    if (!formData.startTime) return;

    try {
      const currentTime = new Date(formData.startTime);
      if (isNaN(currentTime.getTime())) return;

      // ตรวจสอบเวลาปัจจุบันก่อนจะลดเวลา
      if (!increment) {
        const now = new Date();
        const nowLocalTime = now.getHours() * 60 + now.getMinutes();
        const currentStartTimeLocal =
          currentTime.getHours() * 60 + currentTime.getMinutes();
        const allowedMinutesBack = 15;
        const earliestAllowedTime = nowLocalTime - allowedMinutesBack;

        // คำนวณเวลาที่จะได้หลังจากลด 15 นาที
        const proposedTimeAfterReduction = currentStartTimeLocal - 15;

        // console.log("Pre-reduction check:", {
        //   nowLocalTime: `${Math.floor(nowLocalTime / 60)}:${String(
        //     nowLocalTime % 60
        //   ).padStart(2, "0")}`,
        //   currentStartTime: `${Math.floor(currentStartTimeLocal / 60)}:${String(
        //     currentStartTimeLocal % 60
        //   ).padStart(2, "0")}`,
        //   proposedAfterReduction: `${Math.floor(
        //     proposedTimeAfterReduction / 60
        //   )}:${String(proposedTimeAfterReduction % 60).padStart(2, "0")}`,
        //   earliestAllowed: `${Math.floor(earliestAllowedTime / 60)}:${String(
        //     earliestAllowedTime % 60
        //   ).padStart(2, "0")}`,
        //   isCurrentInFuture: currentStartTimeLocal > nowLocalTime,
        //   wouldExceedLimit:
        //     proposedTimeAfterReduction < earliestAllowedTime &&
        //     currentStartTimeLocal <= nowLocalTime,
        // });

        // Block เฉพาะเมื่อ:
        // 1. การลดจะทำให้เกิน 15 นาทีในอดีต AND
        // 2. เวลาปัจจุบันไม่ได้อยู่ในอนาคต (ป้องกันการย้อนจากอดีตไปอดีตที่ไกลกว่า)
        if (
          proposedTimeAfterReduction < earliestAllowedTime &&
          currentStartTimeLocal <= nowLocalTime
        ) {
          // console.log(
          //   "BLOCKED: Reducing time would exceed 15-minute past limit from current time"
          // );
          setPastTimeWarning(
            "Cannot reduce time further - would exceed 15 minutes in the past"
          );
          setTimeout(() => setPastTimeWarning(""), 3000);
          return;
        }
      }

      const minutes = increment ? 15 : -15;
      const proposedTime = new Date(currentTime);
      proposedTime.setMinutes(proposedTime.getMinutes() + minutes);

      // ป้องกันการย้อนกลับไปเวลาอดีตเกินไป (ยืดหยุ่น 15 นาที) - เช็คสำหรับ proposedTime
      if (!increment) {
        const now = new Date();

        // ใช้เวลา local ในการเปรียบเทียบ (เพื่อหลีกเลี่ยง timezone issues)
        const nowLocalTime = now.getHours() * 60 + now.getMinutes();
        const proposedLocalTime =
          proposedTime.getHours() * 60 + proposedTime.getMinutes();
        const allowedMinutesBack = 15; // อนุญาตให้ย้อนหลัง 15 นาที

        // คำนวณเวลาเร็วสุดที่อนุญาต (ในนาทีของวัน)
        const earliestAllowedTime = nowLocalTime - allowedMinutesBack;

        // console.log("Time adjustment check (using minutes of day):", {
        //   currentStartTime: formData.startTime,
        //   nowLocalTime: `${Math.floor(nowLocalTime / 60)}:${String(
        //     nowLocalTime % 60
        //   ).padStart(2, "0")}`,
        //   proposedLocalTime: `${Math.floor(proposedLocalTime / 60)}:${String(
        //     proposedLocalTime % 60
        //   ).padStart(2, "0")}`,
        //   earliestAllowedTime: `${Math.floor(
        //     earliestAllowedTime / 60
        //   )}:${String(earliestAllowedTime % 60).padStart(2, "0")}`,
        //   isProposedTooEarly: proposedLocalTime < earliestAllowedTime,
        // });

        // ตรวจสอบว่า proposedTime ย้อนหลังเกินไป (เปรียบเทียบใน minutes of day)
        if (proposedLocalTime < earliestAllowedTime) {
          // console.log("BLOCKED: Time would be too far in the past");
          setPastTimeWarning("Cannot book more than 15 minutes in the past");
          setTimeout(() => setPastTimeWarning(""), 3000);
          return;
        }

        // console.log("ALLOWED: Time is within 15-minute flexibility");
      }

      // ป้องกันการเพิ่มเวลาให้ end time เกิน 24:00 (เที่ยงคืน)
      if (increment) {
        // ตรวจสอบไม่ให้ start time ข้ามไปวันถัดไป
        const originalDate = new Date(formData.startTime);
        const originalDay = originalDate.getDate();
        const proposedDay = proposedTime.getDate();

        if (proposedDay !== originalDay) {
          return; // หยุดไม่ให้เพิ่มเวลาถ้าข้ามไปวันถัดไป
        }

        // คำนวณ end time ที่จะเกิดขึ้น
        const proposedEndTime = new Date(proposedTime);
        proposedEndTime.setMinutes(
          proposedEndTime.getMinutes() + formData.duration
        );

        // อนุญาตให้ end time เป็น 00:00 ของวันถัดไป (เที่ยงคืน)
        const maxAllowedEndTime = new Date(originalDate);
        maxAllowedEndTime.setHours(24, 0, 0, 0); // 24:00 = เที่ยงคืนของวันถัดไป

        if (proposedEndTime > maxAllowedEndTime) {
          return; // หยุดไม่ให้เพิ่มเวลาถ้า end time เกิน 00:00 ของวันถัดไป
        }
      }

      const year = proposedTime.getFullYear();
      const month = String(proposedTime.getMonth() + 1).padStart(2, "0");
      const day = String(proposedTime.getDate()).padStart(2, "0");
      const hours = String(proposedTime.getHours()).padStart(2, "0");
      const mins = String(proposedTime.getMinutes()).padStart(2, "0");

      const newTimeString = `${year}-${month}-${day}T${hours}:${mins}`;

      // ตรวจสอบว่าเวลาใหม่มี conflict หรือไม่
      const hasConflict = checkTimeConflict(newTimeString, formData.duration);

      // console.log("Time adjustment check:", {
      //   newTimeString,
      //   hasConflict,
      //   increment,
      //   duration: formData.duration,
      // });

      if (!hasConflict) {
        // ถ้าไม่มี conflict ให้ใช้เวลานี้เลย
        // console.log("No conflict, setting new time:", newTimeString);
        safeSetFormData((prev) => ({ ...prev, startTime: newTimeString }));
      } else {
        // console.log("Has conflict, finding alternative time");

        // เลือกทิศทางการค้นหาตามการปรับเวลา
        const direction = increment ? "forward" : "backward";
        // console.log(`Searching for alternative time in ${direction} direction`);

        let availableTime = findNextAvailableTime(
          newTimeString,
          formData.duration,
          direction
        );

        if (availableTime) {
          // ตรวจสอบว่า availableTime ไม่ทำให้ end time เกิน 24:00
          const availableEndTime = new Date(availableTime);
          availableEndTime.setMinutes(
            availableEndTime.getMinutes() + formData.duration
          );
          const availableMaxEndTime = new Date(availableTime);
          availableMaxEndTime.setHours(24, 0, 0, 0);

          if (availableEndTime <= availableMaxEndTime) {
            // console.log(
            //   `Setting alternative time (${direction}):`,
            //   availableTime
            // );
            safeSetFormData((prev) => ({ ...prev, startTime: availableTime }));
          } else {
            // console.log(
            //   "Alternative time would exceed day limit, trying forward instead"
            // );
            // ถ้า direction เดิมไม่ได้ ให้ลอง forward
            if (direction === "backward") {
              availableTime = findNextAvailableTime(
                newTimeString,
                formData.duration,
                "forward"
              );
              if (availableTime) {
                // console.log("Setting forward alternative time:", availableTime);
                safeSetFormData((prev) => ({
                  ...prev,
                  startTime: availableTime,
                }));
              }
            }
          }
        } else {
          // console.log(`No available time found in ${direction} direction`);
          // ถ้าหาไม่เจอในทิศทางที่ต้องการ ลองทิศทางตรงข้าม
          const fallbackDirection =
            direction === "forward" ? "backward" : "forward";
          // console.log(`Trying fallback direction: ${fallbackDirection}`);

          availableTime = findNextAvailableTime(
            newTimeString,
            formData.duration,
            fallbackDirection
          );
          if (availableTime) {
            // console.log(
            //   `Setting fallback time (${fallbackDirection}):`,
            //   availableTime
            // );
            safeSetFormData((prev) => ({ ...prev, startTime: availableTime }));
          } else {
            // console.log("No available time found in either direction");
            setConflictWarning("No available time slot found");
            setTimeout(() => setConflictWarning(""), 3000);
          }
        }
      }
    } catch (error) {
      console.error("Error adjusting time:", error);
    }
  };

  const adjustDuration = (increment) => {
    handleUserInteraction(); // หยุด timer เมื่อผู้ใช้ปรับระยะเวลา
    const change = increment ? 15 : -15;
    let requestedDuration = Math.max(15, formData.duration + change);

    if (!formData.startTime) {
      handleChange("duration", requestedDuration);
      return;
    }

    // ตรวจสอบก่อนว่าสามารถใช้ duration ใหม่กับเวลาปัจจุบันได้หรือไม่
    const startDate = new Date(formData.startTime);
    const proposedEndDate = new Date(startDate);
    proposedEndDate.setMinutes(
      proposedEndDate.getMinutes() + requestedDuration
    );

    // ตรวจสอบขอบเขตเวลาในวัน (ไม่เกิน 24:00)
    const maxEndTime = new Date(startDate);
    maxEndTime.setHours(24, 0, 0, 0);

    // ถ้าเกินขอบเขตเวลา ให้หยุดไม่ให้เพิ่ม/ลด duration
    if (proposedEndDate > maxEndTime && increment) {
      // กรณีเพิ่ม duration แต่เกิน 24:00 ให้หยุด
      return;
    }

    // ตรวจสอบ conflict กับเวลาปัจจุบัน
    const hasConflict = checkTimeConflict(
      formData.startTime,
      requestedDuration
    );

    if (!hasConflict) {
      // ถ้าไม่มี conflict ให้ใช้เวลาปัจจุบันกับ duration ใหม่
      setFormData((prev) => ({
        ...prev,
        duration: requestedDuration,
      }));
    } else {
      // ถ้ามี conflict และเป็นการเพิ่ม duration ให้หาเวลาใหม่
      // แต่ถ้าเป็นการลด duration ให้ลดที่เวลาเดิม
      if (!increment) {
        // การลด duration ที่เวลาเดิม
        setFormData((prev) => ({
          ...prev,
          duration: requestedDuration,
        }));
      } else {
        // การเพิ่ม duration มี conflict ให้หาเวลาใหม่
        const bestOption = findBestTimeForDuration(requestedDuration);

        // แสดงข้อความแจ้งเตือนเมื่อต้องย้ายเวลา
        if (bestOption.startTime !== formData.startTime) {
          const originalTime = formatDisplayTime(formData.startTime);
          const newTime = formatDisplayTime(bestOption.startTime);
          setDurationAdjustmentWarning(
            `Time moved from ${originalTime} to ${newTime} due to conflict`
          );
          setTimeout(() => setDurationAdjustmentWarning(""), 4000);
        }

        setFormData((prev) => ({
          ...prev,
          duration: bestOption.duration,
          startTime: bestOption.startTime,
        }));
      }
    }
  };

  // Calculate end time based on start time and duration
  const getEndTime = () => {
    if (!formData.startTime) return "00:00";
    try {
      const startDate = new Date(formData.startTime);
      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + formData.duration);
      return formatDisplayTime(endDate.toISOString());
    } catch (error) {
      return "00:00";
    }
  };

  // ฟังก์ชันคำนวณ duration สูงสุดที่สามารถจองได้จากเวลาที่กำหนด
  const calculateMaxDurationFromTime = (startTime) => {
    if (!startTime) return 15;

    const startDate = new Date(startTime);
    const maxEndTime = new Date(startDate);
    maxEndTime.setHours(24, 0, 0, 0); // สิ้นสุดที่ 24:00 (เที่ยงคืน)

    const maxDuration =
      (maxEndTime.getTime() - startDate.getTime()) / (1000 * 60);
    return Math.max(15, Math.floor(maxDuration / 15) * 15);
  };

  // ฟังก์ชันหาเวลาที่ดีที่สุดสำหรับ duration ที่ต้องการ
  const findBestTimeForDuration = (requestedDuration) => {
    const now = new Date();
    const currentTimeString = getCurrentTime();

    // Use Case 1: ลองใช้เวลาปัจจุบันก่อน (ถ้าไม่มี conflict และเวลาพอ)
    const maxFromCurrent = calculateMaxDurationFromTime(currentTimeString);
    if (maxFromCurrent >= requestedDuration) {
      const hasConflict = checkTimeConflict(
        currentTimeString,
        requestedDuration
      );
      if (!hasConflict) {
        return { startTime: currentTimeString, duration: requestedDuration };
      }
    }

    // Use Case 2: หาช่วงเวลาว่างที่รองรับ duration เต็มได้ (forward search)
    const availableTime = findNextAvailableTime(
      currentTimeString,
      requestedDuration,
      "forward"
    );
    if (availableTime && availableTime !== currentTimeString) {
      const maxFromAvailable = calculateMaxDurationFromTime(availableTime);
      if (maxFromAvailable >= requestedDuration) {
        return { startTime: availableTime, duration: requestedDuration };
      }
    }

    // Use Case 3: ไม่มีช่วงเวลาว่างที่รองรับ duration เต็ม -> หา duration สูงสุดที่เป็นไปได้
    // ลองหาช่วงเวลาว่างถัดไปด้วย duration ขั้นต่ำ แล้วคำนวณ duration สูงสุด
    const bestAvailableTime = findNextAvailableTime(
      currentTimeString,
      15,
      "forward"
    );
    if (bestAvailableTime) {
      const maxDurationPossible =
        calculateMaxDurationFromTime(bestAvailableTime);
      // ตรวจสอบว่า duration ที่คำนวณได้ไม่มี conflict
      const hasConflictWithMax = checkTimeConflict(
        bestAvailableTime,
        maxDurationPossible
      );
      if (!hasConflictWithMax) {
        return { startTime: bestAvailableTime, duration: maxDurationPossible };
      } else {
        // ถ้ายังมี conflict ให้ลองลดเวลาลงจนกว่าจะไม่มี conflict
        for (
          let testDuration = maxDurationPossible;
          testDuration >= 15;
          testDuration -= 15
        ) {
          const testConflict = checkTimeConflict(
            bestAvailableTime,
            testDuration
          );
          if (!testConflict) {
            return { startTime: bestAvailableTime, duration: testDuration };
          }
        }
      }
    }

    // Use Case 4: เวลาปัจจุบันมี conflict แต่สามารถใช้ได้บางส่วน
    if (maxFromCurrent >= 15) {
      // ลองลด duration จนกว่าจะไม่มี conflict
      for (
        let testDuration = maxFromCurrent;
        testDuration >= 15;
        testDuration -= 15
      ) {
        const hasConflict = checkTimeConflict(currentTimeString, testDuration);
        if (!hasConflict) {
          return { startTime: currentTimeString, duration: testDuration };
        }
      }
    }

    // Use Case 5: ไม่มีเวลาว่างเลยในวันนี้ (fallback)
    return {
      startTime: currentTimeString,
      duration: 15, // duration ขั้นต่ำ
    };
  };

  // Set quick duration presets
  const setQuickDuration = (minutes) => {
    handleUserInteraction(); // หยุด timer เมื่อผู้ใช้เลือก quick duration

    // Support 24-hour booking
    if (minutes === 1440) {
      // All day booking - ใช้ logic เดียวกับปุ่มอื่น ๆ
      if (!formData.startTime) {
        handleChange("duration", minutes);
        return;
      }

      // หาเวลาและ duration ที่ดีที่สุดสำหรับ All day (1440 นาที)
      const bestOption = findBestTimeForDuration(minutes);

      // แสดงข้อความแจ้งเตือนถ้า duration ถูกปรับลง
      if (bestOption.duration < minutes) {
        const requestedHours = Math.floor(minutes / 60);
        const adjustedHours = Math.floor(bestOption.duration / 60);
        const adjustedMinutes = bestOption.duration % 60;

        let adjustedText = "";
        if (adjustedHours > 0) adjustedText += `${adjustedHours}hr`;
        if (adjustedMinutes > 0)
          adjustedText += adjustedText
            ? ` ${adjustedMinutes}min`
            : `${adjustedMinutes}min`;

        setDurationAdjustmentWarning(
          `All day (${requestedHours}hr) not available. Adjusted to ${adjustedText}.`
        );
        setTimeout(() => setDurationAdjustmentWarning(""), 5000);
      } else {
        setDurationAdjustmentWarning("");
      }

      setFormData((prev) => ({
        ...prev,
        duration: bestOption.duration,
        startTime: bestOption.startTime,
      }));
      return;
    }

    if (!formData.startTime) {
      handleChange("duration", minutes);
      return;
    }

    // หาเวลาและ duration ที่ดีที่สุดสำหรับ duration ที่ต้องการ
    const bestOption = findBestTimeForDuration(minutes);

    // แสดงข้อความแจ้งเตือนถ้า duration ถูกปรับลง
    if (bestOption.duration < minutes) {
      const requestedHours = Math.floor(minutes / 60);
      const requestedMins = minutes % 60;
      const adjustedHours = Math.floor(bestOption.duration / 60);
      const adjustedMinutes = bestOption.duration % 60;

      let requestedText = "";
      if (requestedHours > 0) requestedText += `${requestedHours}hr`;
      if (requestedMins > 0)
        requestedText += requestedText
          ? ` ${requestedMins}min`
          : `${requestedMins}min`;

      let adjustedText = "";
      if (adjustedHours > 0) adjustedText += `${adjustedHours}hr`;
      if (adjustedMinutes > 0)
        adjustedText += adjustedText
          ? ` ${adjustedMinutes}min`
          : `${adjustedMinutes}min`;

      setDurationAdjustmentWarning(
        `Requested ${requestedText} not available. Adjusted to ${adjustedText} (max available for today)`
      );
      setTimeout(() => setDurationAdjustmentWarning(""), 4000);
    } else {
      setDurationAdjustmentWarning("");
    }

    setFormData((prev) => ({
      ...prev,
      duration: bestOption.duration,
      startTime: bestOption.startTime,
    }));
  };

  // ฟังก์ชันตรวจสอบว่าสามารถลดเวลาได้หรือไม่
  const canReduceTime = () => {
    if (!formData.startTime) return true;

    const now = new Date();
    const currentTime = new Date(formData.startTime);
    const nowLocalTime = now.getHours() * 60 + now.getMinutes();
    const currentStartTimeLocal =
      currentTime.getHours() * 60 + currentTime.getMinutes();
    const allowedMinutesBack = 15;
    const earliestAllowedTime = nowLocalTime - allowedMinutesBack;

    // คำนวณเวลาที่จะได้หลังจากลด 15 นาที
    const proposedTimeAfterReduction = currentStartTimeLocal - 15;

    // อนุญาตให้ลดได้ถ้า:
    // 1. เวลาหลังจากลดยังไม่เกิน 15 นาทีในอดีต หรือ
    // 2. เวลาปัจจุบันยังเป็นอนาคตอยู่ (กรณีลดจากอนาคตมาอนาคตที่เร็วกว่า)
    const canReduce =
      proposedTimeAfterReduction >= earliestAllowedTime ||
      currentStartTimeLocal > nowLocalTime;

    // console.log("canReduceTime check:", {
    //   currentStartTime: `${Math.floor(currentStartTimeLocal / 60)}:${String(
    //     currentStartTimeLocal % 60
    //   ).padStart(2, "0")}`,
    //   nowTime: `${Math.floor(nowLocalTime / 60)}:${String(
    //     nowLocalTime % 60
    //   ).padStart(2, "0")}`,
    //   proposedAfterReduction: `${Math.floor(
    //     proposedTimeAfterReduction / 60
    //   )}:${String(proposedTimeAfterReduction % 60).padStart(2, "0")}`,
    //   earliestAllowed: `${Math.floor(earliestAllowedTime / 60)}:${String(
    //     earliestAllowedTime % 60
    //   ).padStart(2, "0")}`,
    //   isCurrentInFuture: currentStartTimeLocal > nowLocalTime,
    //   canReduce,
    // });

    return canReduce;
  };

  const formatDisplayTime = (timeString) => {
    try {
      const time = new Date(timeString);
      if (isNaN(time.getTime())) return "12:00 AM"; // Check for Invalid Date

      return time.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      console.error("Invalid date format:", timeString);
      return "12:00 AM";
    }
  };
  //วันที่ปัจจุบันโชว์ที่ header
  const getCurrentDate = () => {
    const now = new Date();
    return now.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  const timelineData = generateTimelineData();

  // PIN Modal Component
  const PinModal = () => (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <button
            onClick={() => {
              setShowPinModal(false);
              onClose(); // ปิด modal หลัก เมื่อกด X
            }}
            className="close-button"
          >
            <X size={25} />
          </button>
          <div className="header-info">
            <div className="modal-title">Booking Confirmed!</div>
          </div>
        </div>
        <div className="modal-body">
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <h2>Your Meeting PIN</h2>
            <div
              style={{
                fontSize: "3rem",
                fontWeight: "bold",
                color: "#16a34a",
                margin: "1rem 0",
                letterSpacing: "0.2em",
              }}
            >
              {bookingPin}
            </div>
            <p style={{ color: "#666", marginBottom: "1rem" }}>
              Please save this PIN. You'll need it to access the room.
            </p>

            {/* แสดง warning เมื่อกด Got it! ครั้งแรก */}
            {showPinWarning && (
              <div
                style={{
                  backgroundColor: "#FEF9C3", // เหลืองสดใสกว่า
                  border: "1px solid #EAB308", // เหลืองทอง
                  borderRadius: "0.5rem",
                  padding: "0.5rem",
                  marginBottom: "1rem",
                  color: "#713F12", // น้ำตาลทองเข้ม (ข้อความ)
                  fontSize: "0.9rem",
                  fontWeight: "500",
                }}
              >
                !! Save your PIN. It will not be shown again.
              </div>
            )}

            <button
              onClick={() => {
                if (!showPinWarning) {
                  // ครั้งแรกที่กด - แสดง warning
                  setShowPinWarning(true);
                } else {
                  // ครั้งที่สองที่กด - ปิด modal
                  setShowPinModal(false);
                  setShowPinWarning(false);
                  onClose(); // ปิด modal หลัก เมื่อกด Got it! ครั้งที่สอง
                }
              }}
              className="submit-btn"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // แสดง warning ถ้ามีการทับซ้อน
  const renderTimeConflictWarning = () => {
    // ไม่แสดง warning เมื่อกำลัง loadingCreate, waiting หรือ loading events เพื่อไม่ให้ user งง
    if (loadingCreate || waitingEvent || loadingEvents) {
      return null;
    }

    if (formData.startTime) {
      // ตรวจสอบการทับซ้อนกับ events อื่น
      if (checkTimeConflict(formData.startTime, formData.duration)) {
        return (
          <div
            style={{
              backgroundColor: "#FEF2F2",
              border: "1px solid #FECACA",
              borderRadius: "0.5rem",
              padding: "0.75rem",
              marginBottom: "1rem",
              color: "#DC2626",
            }}
          >
            ⚠️ Selected time conflicts with existing booking
          </div>
        );
      }
    }

    return null;
  };

  if (!isOpen) return null;

  return (
    <>
      {showPinModal && <PinModal />}
      {!showPinModal && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            // ป้องกันการปิด modal เมื่อคลิกที่ overlay ขณะกำลัง loadingCreate หรือ waiting หรือ loading events
            if (
              e.target === e.currentTarget &&
              !loadingCreate &&
              !waitingEvent &&
              !loadingEvents
            ) {
              onClose();
            }
          }}
        >
          <div className="modal-container">
            <div className="modal-header">
              <button
                onClick={
                  loadingCreate || waitingEvent || loadingEvents
                    ? undefined
                    : onClose
                }
                className="close-button"
                disabled={loadingCreate || waitingEvent || loadingEvents}
                style={{
                  opacity:
                    loadingCreate || waitingEvent || loadingEvents ? 0.3 : 1,
                  cursor:
                    loadingCreate || waitingEvent || loadingEvents
                      ? "not-allowed"
                      : "pointer",
                  pointerEvents:
                    loadingCreate || waitingEvent || loadingEvents
                      ? "none"
                      : "auto",
                }}
              >
                <X size={25} />
              </button>
              <div className="header-info">
                <div className="date-text">{getCurrentDate()}</div>
                <div className="modal-title">New Booking</div>
              </div>
            </div>

            <div className="modal-body" style={{ position: "relative" }}>
              {/* Loading Overlay for Modal Body Only */}
              {(loadingCreate || waitingEvent) && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(255, 255, 255, 0.8)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 1000,
                    borderRadius: "0 0 1rem 1rem",
                  }}
                >
                  <div
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "bold",
                      color: "#4B5563",
                      marginBottom: "1rem",
                      animation: "fadeInOut 1.5s infinite",
                    }}
                  >
                    {loadingCreate ? "Booking..." : "Waiting..."}
                  </div>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      border: "4px solid #E5E7EB",
                      borderTop: "4px solid #10B981",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  ></div>

                  <style jsx>{`
                    @keyframes spin {
                      0% {
                        transform: rotate(0deg);
                      }
                      100% {
                        transform: rotate(360deg);
                      }
                    }
                    @keyframes fadeInOut {
                      0%,
                      100% {
                        opacity: 0.6;
                      }
                      50% {
                        opacity: 1;
                      }
                    }
                  `}</style>
                </div>
              )}

              {/* --- Subject Name --- */}
              <div className="form-group">
                <div className="label-checkbox-row">
                  <label className="label-left">Subject Name</label>
                  <input
                    type="checkbox"
                    checked={subjectEnabled}
                    onChange={(e) => {
                      handleUserInteraction(); // หยุด timer เมื่อผู้ใช้เปิด/ปิด checkbox
                      setSubjectEnabled(e.target.checked);
                    }}
                    disabled={loadingCreate || waitingEvent || loadingEvents}
                    style={{
                      opacity:
                        loadingCreate || waitingEvent || loadingEvents
                          ? 0.3
                          : 1,
                      cursor:
                        loadingCreate || waitingEvent || loadingEvents
                          ? "not-allowed"
                          : "pointer",
                      pointerEvents:
                        loadingCreate || waitingEvent || loadingEvents
                          ? "none"
                          : "auto",
                    }}
                  />
                </div>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => {
                    handleUserInteraction(); // หยุด timer เมื่อผู้ใช้พิมพ์
                    handleChange("subject", e.target.value);
                  }}
                  onFocus={handleUserInteraction} // หยุด timer เมื่อผู้ใช้คลิกที่ input
                  className={errors.subject ? "input-error" : ""}
                  placeholder="Enter meeting subject"
                  disabled={
                    !subjectEnabled ||
                    loadingCreate ||
                    waitingEvent ||
                    loadingEvents
                  }
                  style={{
                    opacity:
                      !subjectEnabled ||
                      loadingCreate ||
                      waitingEvent ||
                      loadingEvents
                        ? 0.3
                        : 1,
                    cursor:
                      !subjectEnabled ||
                      loadingCreate ||
                      waitingEvent ||
                      loadingEvents
                        ? "not-allowed"
                        : "text",
                    pointerEvents:
                      !subjectEnabled ||
                      loadingCreate ||
                      waitingEvent ||
                      loadingEvents
                        ? "none"
                        : "auto",
                  }}
                />
                {errors.subject && (
                  <p className="error-text">{errors.subject}</p>
                )}
              </div>

              {/* --- Booked By --- */}
              {/* <div className="form-group">
                <div className="label-checkbox-row">
                  <label className="label-left">Booked By</label>
                  <input 
                    type="checkbox" 
                    checked={bookedByEnabled}
                    onChange={(e) => setBookedByEnabled(e.target.checked)}
                  />
                </div>
                <input
                  type="text"
                  value={formData.bookedBy}
                  onChange={(e) => handleChange('bookedBy', e.target.value)}
                  className={errors.bookedBy ? 'input-error' : ''}
                  placeholder="Enter your name"
                  disabled={!bookedByEnabled}
                />
                {errors.bookedBy && <p className="error-text">{errors.bookedBy}</p>}
              </div> */}

              {/* แสดง warning ถ้ามีการทับซ้อน */}
              {renderTimeConflictWarning()}

              {/* แสดงข้อความแจ้งเตือนเมื่อพยายามย้อนเวลาเกิน 15 นาที */}
              {pastTimeWarning && (
                <div
                  style={{
                    backgroundColor: "#FEF3C7",
                    border: "1px solid #F59E0B",
                    borderRadius: "0.5rem",
                    padding: "0.75rem",
                    marginBottom: "1rem",
                    color: "#92400E",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  ⚠️ {pastTimeWarning}
                </div>
              )}

              {/* แสดงข้อความแจ้งเตือนเมื่อ duration ถูกปรับลง */}
              {durationAdjustmentWarning && (
                <div
                  style={{
                    backgroundColor: "#DBEAFE",
                    border: "1px solid #3B82F6",
                    borderRadius: "0.5rem",
                    padding: "0.75rem",
                    marginBottom: "1rem",
                    color: "#1D4ED8",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  ℹ️ {durationAdjustmentWarning}
                </div>
              )}

              <div className="timeline" style={{ position: "relative" }}>
                {/* Current Time Indicator */}
                {(() => {
                  const now = new Date();
                  const currentHour = now.getHours();
                  const currentMinute = now.getMinutes();

                  // หาว่า currentHour อยู่ใน timeline หรือไม่
                  const currentHourIndex = timelineData.findIndex(
                    ({ hour }) => hour === currentHour
                  );

                  if (currentHourIndex !== -1) {
                    // คำนวณตำแหน่งของเส้นเวลาปัจจุบัน
                    const percentageInHour = (currentMinute / 60) * 100;
                    const leftPosition =
                      currentHourIndex * (100 / timelineData.length) +
                      (percentageInHour * (100 / timelineData.length)) / 100;

                    return (
                      <div
                        style={{
                          position: "absolute",
                          left: `${leftPosition}%`,
                          top: "-5px",
                          bottom: "-5px",
                          width: "3px",
                          backgroundColor: "#EF4444",
                          zIndex: 10,
                          boxShadow: "0 0 6px rgba(239, 68, 68, 0.8)",
                          borderRadius: "1px",
                        }}
                      >
                        {/* Tooltip แสดงเวลาปัจจุบัน */}
                        <div
                          style={{
                            position: "absolute",
                            top: "-25px",
                            left: "50%",
                            transform: "translateX(-50%)",
                            backgroundColor: "#EF4444",
                            color: "white",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontSize: "10px",
                            fontWeight: "bold",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {now.toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {timelineData.map(
                  ({
                    hour,
                    isBooked,
                    isCurrentSlot,
                    hasExistingEvent,
                    existingEventPercentage,
                    existingEventStartPercent,
                    proposedBookingPercentage,
                    proposedBookingStartPercent,
                    eventsInThisHour,
                  }) => (
                    <div
                      key={hour}
                      className={`timeline-block ${
                        hasExistingEvent ? "existing-event" : ""
                      } ${
                        isBooked
                          ? isCurrentSlot
                            ? "current-slot"
                            : "booked-slot"
                          : ""
                      }`}
                      style={{
                        position: "relative",
                        background: (() => {
                          // สร้าง gradient สำหรับแสดง multiple events
                          const segments = [];
                          let currentPos = 0;

                          // รวม existing events และ proposed booking
                          const allEvents = [...eventsInThisHour];

                          // เพิ่ม proposed booking ถ้ามี
                          if (isBooked) {
                            allEvents.push({
                              startPercent: proposedBookingStartPercent,
                              endPercent:
                                proposedBookingStartPercent +
                                proposedBookingPercentage,
                              type: "proposed",
                            });
                          }

                          // เรียงลำดับตามตำแหน่ง
                          allEvents.sort(
                            (a, b) => a.startPercent - b.startPercent
                          );

                          // วิธีใหม่: สร้าง timeline โดยตรวจสอบทุกจุดที่มีการเปลี่ยนแปลง
                          const changePoints = [];
                          allEvents.forEach((event) => {
                            changePoints.push({
                              pos: event.startPercent,
                              type: "start",
                              event,
                            });
                            changePoints.push({
                              pos: event.endPercent,
                              type: "end",
                              event,
                            });
                          });
                          changePoints.sort(
                            (a, b) =>
                              a.pos - b.pos || (a.type === "start" ? -1 : 1)
                          );

                          let activeEvents = [];
                          let lastPos = 0;

                          changePoints.forEach((point) => {
                            // เติมส่วนก่อนหน้า
                            if (lastPos < point.pos) {
                              if (activeEvents.length === 0) {
                                segments.push(
                                  `#E5E7EB ${lastPos}%`,
                                  `#E5E7EB ${point.pos}%`
                                );
                              } else if (activeEvents.length === 1) {
                                const color =
                                  activeEvents[0].type === "existing"
                                    ? "#4B5563"
                                    : "#10B981";
                                segments.push(
                                  `${color} ${lastPos}%`,
                                  `${color} ${point.pos}%`
                                );
                              } else {
                                // มีมากกว่า 1 event = conflict
                                segments.push(
                                  `#eccd32 ${lastPos}%`,
                                  `#eccd32 ${point.pos}%`
                                );
                              }
                            }

                            // อัปเดต activeEvents
                            if (point.type === "start") {
                              activeEvents.push(point.event);
                            } else {
                              activeEvents = activeEvents.filter(
                                (e) => e !== point.event
                              );
                            }

                            lastPos = point.pos;
                          });

                          // เติมส่วนที่เหลือ
                          if (lastPos < 100) {
                            if (activeEvents.length === 0) {
                              segments.push(
                                `#E5E7EB ${lastPos}%`,
                                `#E5E7EB 100%`
                              );
                            } else if (activeEvents.length === 1) {
                              const color =
                                activeEvents[0].type === "existing"
                                  ? "#4B5563"
                                  : "#10B981";
                              segments.push(
                                `${color} ${lastPos}%`,
                                `${color} 100%`
                              );
                            } else {
                              segments.push(
                                `#eccd32 ${lastPos}%`,
                                `#eccd32 100%`
                              );
                            }
                          }

                          // ถ้าไม่มี events ใดๆ
                          if (segments.length === 0) {
                            return "#E5E7EB";
                          }

                          return `linear-gradient(to right, ${segments.join(
                            ", "
                          )})`;
                        })(),
                      }}
                    ></div>
                  )
                )}
              </div>
              <div className="timeline-labels">
                {timelineData.map(({ hour }) => {
                  const timeString = `2000-01-01T${String(hour).padStart(
                    2,
                    "0"
                  )}:00:00`;
                  const formattedTime = new Date(timeString).toLocaleTimeString(
                    "en-US",
                    {
                      hour: "numeric",
                      hour12: true,
                    }
                  );
                  return <span key={hour}>{formattedTime}</span>;
                })}
              </div>

              {/* Timeline Legend */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "1rem",
                  marginTop: "0.5rem",
                  marginBottom: "1rem",
                  fontSize: "0.75rem",
                  color: "#666",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                  }}
                >
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      backgroundColor: "#4B5563",
                      borderRadius: "2px",
                    }}
                  ></div>
                  <span>unavailable</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                  }}
                >
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      backgroundColor: "#10B981",
                      borderRadius: "2px",
                    }}
                  ></div>
                  <span>Available</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                  }}
                >
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      backgroundColor: "#eccd32",
                      borderRadius: "2px",
                    }}
                  ></div>
                  <span>conflict</span>
                </div>
              </div>

              <div className="form-group">
                <label>Start Time</label>
                <div className="adjust-group">
                  <button
                    onClick={() => adjustTime(false)}
                    disabled={
                      loadingCreate ||
                      waitingEvent ||
                      loadingEvents ||
                      !canReduceTime()
                    }
                    style={{
                      opacity:
                        loadingCreate ||
                        waitingEvent ||
                        loadingEvents ||
                        !canReduceTime()
                          ? 0.3
                          : 1,
                      cursor:
                        loadingCreate ||
                        waitingEvent ||
                        loadingEvents ||
                        !canReduceTime()
                          ? "not-allowed"
                          : "pointer",
                      pointerEvents:
                        loadingCreate ||
                        waitingEvent ||
                        loadingEvents ||
                        !canReduceTime()
                          ? "none"
                          : "auto",
                    }}
                  >
                    <Minus size={16} />
                  </button>
                  <div className="display-time">
                    {formatDisplayTime(formData.startTime)}
                  </div>
                  <button
                    onClick={() => adjustTime(true)}
                    disabled={loadingCreate || waitingEvent || loadingEvents}
                    style={{
                      opacity:
                        loadingCreate || waitingEvent || loadingEvents
                          ? 0.3
                          : 1,
                      cursor:
                        loadingCreate || waitingEvent || loadingEvents
                          ? "not-allowed"
                          : "pointer",
                      pointerEvents:
                        loadingCreate || waitingEvent || loadingEvents
                          ? "none"
                          : "auto",
                    }}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                {errors.startTime && (
                  <p className="error-text">{errors.startTime}</p>
                )}
              </div>

              <div className="form-group">
                <label>End Time</label>
                <div className="adjust-group">
                  <button
                    onClick={() => adjustDuration(false)}
                    disabled={loadingCreate || waitingEvent || loadingEvents}
                    style={{
                      opacity:
                        loadingCreate || waitingEvent || loadingEvents
                          ? 0.3
                          : 1,
                      cursor:
                        loadingCreate || waitingEvent || loadingEvents
                          ? "not-allowed"
                          : "pointer",
                      pointerEvents:
                        loadingCreate || waitingEvent || loadingEvents
                          ? "none"
                          : "auto",
                    }}
                  >
                    <Minus size={16} />
                  </button>
                  <div className="display-time">{getEndTime()}</div>
                  <button
                    onClick={() => adjustDuration(true)}
                    disabled={loadingCreate || waitingEvent || loadingEvents}
                    style={{
                      opacity:
                        loadingCreate || waitingEvent || loadingEvents
                          ? 0.3
                          : 1,
                      cursor:
                        loadingCreate || waitingEvent || loadingEvents
                          ? "not-allowed"
                          : "pointer",
                      pointerEvents:
                        loadingCreate || waitingEvent || loadingEvents
                          ? "none"
                          : "auto",
                    }}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                {errors.duration && (
                  <p className="error-text">{errors.duration}</p>
                )}

                {/* Quick Duration Menu */}
                <div className="quick-duration-menu">
                  <div className="quick-duration-container">
                    <button
                      type="button"
                      onClick={() => setQuickDuration(15)}
                      className={`quick-duration-btn ${
                        formData.duration === 15 ? "active" : ""
                      }`}
                      disabled={loadingCreate || waitingEvent || loadingEvents}
                      style={{
                        opacity:
                          loadingCreate || waitingEvent || loadingEvents
                            ? 0.3
                            : 1,
                        cursor:
                          loadingCreate || waitingEvent || loadingEvents
                            ? "not-allowed"
                            : "pointer",
                        pointerEvents:
                          loadingCreate || waitingEvent || loadingEvents
                            ? "none"
                            : "auto",
                      }}
                    >
                      15min
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickDuration(30)}
                      className={`quick-duration-btn ${
                        formData.duration === 30 ? "active" : ""
                      }`}
                      disabled={loadingCreate || waitingEvent || loadingEvents}
                      style={{
                        opacity:
                          loadingCreate || waitingEvent || loadingEvents
                            ? 0.3
                            : 1,
                        cursor:
                          loadingCreate || waitingEvent || loadingEvents
                            ? "not-allowed"
                            : "pointer",
                        pointerEvents:
                          loadingCreate || waitingEvent || loadingEvents
                            ? "none"
                            : "auto",
                      }}
                    >
                      30min
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickDuration(60)}
                      className={`quick-duration-btn ${
                        formData.duration === 60 ? "active" : ""
                      }`}
                      disabled={loadingCreate || waitingEvent || loadingEvents}
                      style={{
                        opacity:
                          loadingCreate || waitingEvent || loadingEvents
                            ? 0.3
                            : 1,
                        cursor:
                          loadingCreate || waitingEvent || loadingEvents
                            ? "not-allowed"
                            : "pointer",
                        pointerEvents:
                          loadingCreate || waitingEvent || loadingEvents
                            ? "none"
                            : "auto",
                      }}
                    >
                      1hr
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickDuration(120)}
                      className={`quick-duration-btn ${
                        formData.duration === 120 ? "active" : ""
                      }`}
                      disabled={loadingCreate || waitingEvent || loadingEvents}
                      style={{
                        opacity:
                          loadingCreate || waitingEvent || loadingEvents
                            ? 0.3
                            : 1,
                        cursor:
                          loadingCreate || waitingEvent || loadingEvents
                            ? "not-allowed"
                            : "pointer",
                        pointerEvents:
                          loadingCreate || waitingEvent || loadingEvents
                            ? "none"
                            : "auto",
                      }}
                    >
                      2hr
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickDuration(1440)}
                      className={`quick-duration-btn ${
                        formData.duration === 1440 ? "active" : ""
                      }`}
                      disabled={loadingCreate || waitingEvent || loadingEvents}
                      style={{
                        opacity:
                          loadingCreate || waitingEvent || loadingEvents
                            ? 0.3
                            : 1,
                        cursor:
                          loadingCreate || waitingEvent || loadingEvents
                            ? "not-allowed"
                            : "pointer",
                        pointerEvents:
                          loadingCreate || waitingEvent || loadingEvents
                            ? "none"
                            : "auto",
                      }}
                    >
                      All day
                    </button>
                  </div>
                </div>
              </div>

              <div className="submit-btn-wrapper">
                <button
                  onClick={(e) => {
                    handleUserInteraction();
                    handleSubmit(e);
                  }}
                  className="submit-btn"
                  disabled={
                    loadingEvents || loadingCreate || !canBook || waitingEvent
                  }
                  style={{
                    opacity:
                      loadingEvents || loadingCreate || !canBook || waitingEvent
                        ? 0.5
                        : 1,
                    cursor:
                      loadingEvents || loadingCreate || !canBook || waitingEvent
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {getBookingButtonText()}
                </button>
                {errors.submit && <p className="error-text">{errors.submit}</p>}
                {errors.timeConflict && (
                  <p className="error-text">{errors.timeConflict}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BookingModal;
