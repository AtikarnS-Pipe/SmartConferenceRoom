import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Home, Calendar } from 'lucide-react';
import { useRoomData } from '../hooks/useRoomData';
import { useEvents } from '../hooks/useEvents';
import axios from 'axios';


//constant
const COUNTDOWN_TIME = 60;// Booking Modal countdown time in 60 seconds
const BookingModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    subject: '',
    startTime: '',
    duration: 15,
    bookedBy: ''
  });
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [errors, setErrors] = useState({});
  const [subjectEnabled, setSubjectEnabled] = useState(false);
  const [bookedByEnabled, setBookedByEnabled] = useState(false);//ถ้าไม่ได้ใช้ลบออกด้วย
  const [showPinModal, setShowPinModal] = useState(false);
  const [bookingPin, setBookingPin] = useState('');
  const [waitingEvent, setWaitingEvent] = useState(false);
  const [targetStart, setTargetStart] = useState(null);
  const [targetEnd, setTargetEnd] = useState(null);
  const [countdown, setCountdown] = useState(COUNTDOWN_TIME);
  const [isModalInitialized, setIsModalInitialized] = useState(false);
  const { floor, room } = useRoomData();
  const { events, loading: loadingEvents } = useEvents(floor, room);
  const roomId = `${floor}${room}`; // สร้าง roomId จาก floor และ room

  // ปิด modal อัตโนมัติหลัง 5 นาที ถ้าไม่มีการโต้ตอบ
  useEffect(() => {
  const timer = setTimeout(() => {
    onClose();
  }, 5 * 60 * 1000); // 5 นาที 
  return () => clearTimeout(timer);
}, [loadingCreate]);


  //ปิด pinmodal หลัง 30 วินาที
  useEffect(() => {
  if (!showPinModal) return;
    const timeoutId = setTimeout(() => {
      setShowPinModal(false);
    }, 30000);

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
        console.log('Clearing countdown interval');
        clearInterval(countdownInterval);
      }
    };
  }, [isOpen, showPinModal, countdown]); // เพิ่ม countdown เป็น dependency เพื่อรีสตาร์ทเมื่อรีเซ็ต

  // แยก useEffect สำหรับตรวจสอบ countdown และปิด modal
  useEffect(() => {
    if (countdown === 0 && isOpen && !showPinModal && !loadingCreate && !waitingEvent) {
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
    
    // Handle overflow (24:00 → next day 00:00)
    let hours = Math.floor(roundedMinutes / 60) % 24; 
    const minutes = roundedMinutes % 60;
    
    // Enforce business hours: 8:00 - 19:00
    if (hours < 8) { 
      hours = 8;
    } else if (hours >= 19) {
      hours = 8; // Reset to next day 8:00 if after 19:00
    }
    
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); 
    const day = String(now.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  // ฟังก์ชันหาเวลาว่างถัดไป (รองรับทั้งไปข้างหน้าและย้อนหลัง)
  const findNextAvailableTime = (startTime, duration, direction = 'forward') => { 
    // console.log('🔍 findNextAvailableTime called:', { startTime, duration, direction, eventsCount: events?.length });
    
    if (!startTime) {
      // console.log('❌ No startTime provided');
      return '';
    }

    const proposedStart = new Date(startTime);
    const today = new Date();
    
    // เริ่มตรวจสอบจากเวลาที่กำหนด
    let checkTime = new Date(proposedStart);
    
    // set time boundaries for today
    const startOfDay = new Date(today);
    startOfDay.setHours(8, 0, 0, 0); // เริ่มที่ 8:00 ของวันนี้
    const endOfDay = new Date(today);
    endOfDay.setHours(19, 0, 0, 0); // จบที่ 19:00 ของวันนี้
    
    // console.log('📅 Time boundaries:', { 
    //   startOfDay: startOfDay.toLocaleTimeString(), 
    //   endOfDay: endOfDay.toLocaleTimeString(), 
    //   checkTime: checkTime.toLocaleTimeString() 
    // });
    
    // If no events, check if current time is within business hours
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
      // If current time is outside business hours, find next valid time
      if (checkTime < startOfDay) {
        // console.log('⏰ Before business hours, moving to 8:00 AM');
        checkTime = new Date(startOfDay);
      } else if (checkTime >= endOfDay) {
        // console.log('⏰ After business hours, moving to 8:00 AM next day');
        checkTime = new Date(startOfDay);
      }
    }
    
    // กำหนดทิศทางการค้นหา
    const increment = direction === 'forward' ? 15 : -15;
    const boundary = direction === 'forward' ? endOfDay : startOfDay;
    const comparison = direction === 'forward' ? 
      (time, bound) => time < bound : 
      (time, bound) => time >= bound;
    
    let maxIterations = 44; // 11 hours * 4 (15-min slots per hour)
    let iterations = 0;
    
    // console.log(`🔄 Starting search loop (${direction}), max iterations: ${maxIterations}`);
    
    while (comparison(checkTime, boundary) && iterations < maxIterations) {
      iterations++;
      // console.log(`🔄 Iteration ${iterations}: checking ${checkTime.toLocaleTimeString()}`);
      
      // ตรวจสอบว่าเวลานี้ว่างไหม
      const checkEnd = new Date(checkTime);
      checkEnd.setMinutes(checkEnd.getMinutes() + duration);
      
      // ตรวจสอบว่าไม่เกินขอบเขตเวลาทำการ
      if (direction === 'forward' && checkEnd > endOfDay) {
        // console.log('🚫 Would exceed end of day, stopping search');
        break;
      }
      if (direction === 'backward' && checkTime < startOfDay) {
        // console.log('🚫 Would go before start of day, stopping search');
        break;
      }
      
      // ตรวจสอบการทับซ้อนกับ events ที่มีอยู่
      let hasConflict = false;
      
      if (events && events.length > 0) {
        hasConflict = events.some(event => {
          const eventStart = new Date(event.start.dateTime + 'Z');
          const eventEnd = new Date(event.end.dateTime + 'Z');
          
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
        const month = String(checkTime.getMonth() + 1).padStart(2, '0');
        const day = String(checkTime.getDate()).padStart(2, '0');
        const hours = String(checkTime.getHours()).padStart(2, '0');
        const mins = String(checkTime.getMinutes()).padStart(2, '0');
        
        const result = `${year}-${month}-${day}T${hours}:${mins}`;
        // console.log(`🎯 Returning: ${result}`);
        return result;
      }
      
      // console.log('❌ Time slot occupied, moving to next slot');
      // เลื่อนไปตามทิศทางที่กำหนด
      checkTime.setMinutes(checkTime.getMinutes() + increment);
    }
    
    // console.log('No available time found in forward direction, trying backward...');
    
    // ถ้าหาไม่เจอ และเป็นการค้นหาข้างหน้า ให้ลองค้นหาย้อนหลัง
    if (direction === 'forward') {
      const backwardResult = findNextAvailableTime(startTime, duration, 'backward');
      if (backwardResult !== startTime) {
        // console.log('Found available time in backward direction:', backwardResult);
        return backwardResult;
      }
    }
    
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
      
      const currentTime = getCurrentTime();
      // console.log('⏰ Current time:', currentTime);
      
      // Always try to find next available time, even if no events
      // console.log('🔍 Searching for available time...');
      const availableTime = findNextAvailableTime(currentTime, 15, 'forward');
      // console.log('✅ Available time result:', availableTime);
      
      if (availableTime && availableTime !== currentTime) {
        // console.log('🎯 Setting available time:', availableTime);
        setFormData(prev => ({ ...prev, startTime: availableTime }));
      } else {
        // console.log('⚠️ No better time found, using current time:', currentTime);
        setFormData(prev => ({ ...prev, startTime: currentTime }));
      }
    } else if (!isOpen) {
      // Reset when modal closes
      // console.log('🔄 Modal closed, resetting startTime');
      setFormData(prev => ({ ...prev, startTime: '' }));
    }
  }, [isOpen, isModalInitialized]);

  // Handle events updates after modal is initialized
  useEffect(() => {
    if (isOpen && isModalInitialized && events && events.length > 0 && formData.startTime) {
      // console.log('📋 Events updated, checking if current time needs adjustment...');
      // console.log('🔍 Current startTime:', formData.startTime);
      // console.log('🎯 Events count:', events.length);
      
      // Check if current time has conflict
      const hasConflict = checkTimeConflict(formData.startTime, formData.duration);
      // console.log('⚡ Has conflict:', hasConflict);
      
      if (hasConflict) {
        // console.log('🚨 Current time has conflict, finding better time...');
        const availableTime = findNextAvailableTime(formData.startTime, formData.duration, 'forward');
        // console.log('🎯 New available time:', availableTime);
        
        if (availableTime !== formData.startTime) {
          // console.log('✅ Updating to conflict-free time:', availableTime);
          setFormData(prev => ({ ...prev, startTime: availableTime }));
        }
      }
    }
  }, [events, isModalInitialized]);

  // ฟังก์ชันตรวจสอบการทับซ้อนของเวลา
  const checkTimeConflict = (startTime, duration) => {
    if (!startTime || !events || events.length === 0) return false;

    let proposedStart, proposedEnd;

    if (duration === 660) {
      // All day booking
      const baseDate = new Date(startTime);
      proposedStart = new Date(baseDate);
      proposedStart.setHours(8, 0, 0, 0); // All day starts at 8:00
      
      proposedEnd = new Date(proposedStart);
      proposedEnd.setHours(19, 0, 0, 0); // All day ends at 19:00
    } else {
      // Regular booking
      proposedStart = new Date(startTime);
      proposedEnd = new Date(proposedStart);
      proposedEnd.setMinutes(proposedEnd.getMinutes() + duration);
      
      // Check if booking exceeds business hours
      const startHour = proposedStart.getHours();
      const endHour = proposedEnd.getHours();
      const endMinute = proposedEnd.getMinutes();
      
      // แก้ไข: อนุญาตให้จบที่ 19:00 พอดี แต่ห้ามเกิน 19:00
      if (startHour < 8 || startHour >= 19 || endHour > 19) {
        return true; // Conflict due to business hours violation
      }
    }

    // ตรวจสอบว่าเวลาที่จองไม่ใช่เวลาในอดีต
    const now = new Date();
    // เพิ่ม buffer 1 นาที เพื่อให้สามารถจองเวลาปัจจุบันได้
    const bufferTime = new Date(now.getTime() - 15 * 60 * 1000); // ลบ 1 นาที
    if (proposedStart < bufferTime) {
      return true; // Conflict: ไม่สามารถจองย้อนหลังได้
    }

    // ตรวจสอบการทับซ้อนกับ events ที่มีอยู่
    return events.some(event => {
      const eventStart = new Date(event.start.dateTime + 'Z');
      const eventEnd = new Date(event.end.dateTime + 'Z');

      // ตรวจสอบการทับซ้อน: 
      // ทับซ้อนถ้า proposedStart < eventEnd และ proposedEnd > eventStart
      return proposedStart < eventEnd && proposedEnd > eventStart;
    });
  };

  // ตรวจสอบว่าสามารถจองได้หรือไม่
  const canBook = !checkTimeConflict(formData.startTime, formData.duration);
  
  // ตรวจสอบว่าเป็นเวลาในอดีตหรือไม่ สำหรับแสดงข้อความปุ่ม
  const isPastTime = () => {
    if (!formData.startTime) return false;
    const proposedStart = new Date(formData.startTime);
    const now = new Date();
    // เพิ่ม buffer 1 นาที เพื่อให้สามารถจองเวลาปัจจุบันได้
    const bufferTime = new Date(now.getTime() - 15 * 60 * 1000);; // ลบ 1 นาที
    return proposedStart < bufferTime;
  };

  // ฟังก์ชันสำหรับกำหนดข้อความปุ่ม
  const getBookingButtonText = () => {
    if (loadingEvents) return 'Loading events...';
    if (loadingCreate) return 'Booking...';
    if (waitingEvent) return 'Waiting for confirmation...';
    if (isPastTime()) return 'Past Time - Cannot Book';
    if (!canBook) return 'Time Conflict';
    return 'Book Now';
  };

  const validateForm = () => {
    const newErrors = {};
    if (subjectEnabled && !formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.startTime) newErrors.startTime = 'Start time is required';
    if (bookedByEnabled && !formData.bookedBy.trim()) newErrors.bookedBy = 'Booked by is required';
    if (formData.duration < 15) newErrors.duration = 'Minimum duration is 15 minutes';
    
    // ตรวจสอบการจองย้อนหลัง
    if (formData.startTime) {
      const proposedStart = new Date(formData.startTime);
      const now = new Date();
      // เพิ่ม buffer 1 นาที เพื่อให้สามารถจองเวลาปัจจุบันได้
      const bufferTime = new Date(now.getTime() - 15 * 60 * 1000); // ลบ 1 นาที
      if (proposedStart < bufferTime) {
        newErrors.timeConflict = 'Cannot book for past time. Please select a future time.';
      }
    }
    
    // เพิ่มการตรวจสอบการทับซ้อนเวลา
    if (checkTimeConflict(formData.startTime, formData.duration)) {
      if (!newErrors.timeConflict) { // ถ้ายังไม่มี error จากการจองย้อนหลัง
        newErrors.timeConflict = 'Selected time conflicts with existing booking';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // อัปเดต timeline ให้แสดง existing events แบบละเอียด
  const generateTimelineData = () => {
    const hours = Array.from({ length: 11 }, (_, i) => i + 8); // 8:00 - 18:00 (11 hours)
    const currentHour = formData.startTime ? new Date(formData.startTime).getHours() : 14;
    const currentMinute = formData.startTime ? new Date(formData.startTime).getMinutes() : 0;
    const duration = formData.duration;
    
    return hours.map(hour => {
      // คำนวณ existing events ที่ทับกับชั่วโมงนี้
      const existingEventsInHour = events.filter(event => {
        const eventStart = new Date(event.start.dateTime + 'Z');
        const eventEnd = new Date(event.end.dateTime + 'Z');
        const hourStart = new Date();
        hourStart.setHours(hour, 0, 0, 0);
        const hourEnd = new Date();
        hourEnd.setHours(hour + 1, 0, 0, 0);
        
        return eventStart < hourEnd && eventEnd > hourStart;
      });

      // เก็บข้อมูล events ทั้งหมดในชั่วโมงนี้
      const eventsInThisHour = [];
      
      if (existingEventsInHour.length > 0) {
        existingEventsInHour.forEach(event => {
          const eventStart = new Date(event.start.dateTime + 'Z');
          const eventEnd = new Date(event.end.dateTime + 'Z');
          
          // คำนวณช่วงเวลาที่ทับกับชั่วโมงนี้
          const hourStart = new Date();
          hourStart.setHours(hour, 0, 0, 0);
          const hourEnd = new Date();
          hourEnd.setHours(hour + 1, 0, 0, 0);
          
          const overlapStart = new Date(Math.max(eventStart.getTime(), hourStart.getTime()));
          const overlapEnd = new Date(Math.min(eventEnd.getTime(), hourEnd.getTime()));
          
          if (overlapStart < overlapEnd) {
            const eventStartMinutesFromHourStart = (overlapStart - hourStart) / (1000 * 60);
            const eventEndMinutesFromHourStart = (overlapEnd - hourStart) / (1000 * 60);
            
            const eventStartPercent = (eventStartMinutesFromHourStart / 60) * 100;
            const eventEndPercent = (eventEndMinutesFromHourStart / 60) * 100;
            
            eventsInThisHour.push({
              startPercent: eventStartPercent,
              endPercent: eventEndPercent,
              type: 'existing'
            });
          }
        });
      }

      // รวมข้อมูลเป็น properties เดิมเพื่อความเข้ากันได้
      const hasExistingEvent = eventsInThisHour.length > 0;
      const existingEventStartPercent = hasExistingEvent ? eventsInThisHour[0].startPercent : 0;
      const existingEventPercentage = hasExistingEvent ? 
        eventsInThisHour.reduce((total, event) => total + (event.endPercent - event.startPercent), 0) : 0;

      // คำนวณ proposed booking
      let proposedBookingPercentage = 0;
      let proposedBookingStartPercent = 0;
      
      if (formData.startTime && duration > 0) {
        // สร้าง proposed booking time range
        const proposedStart = new Date(formData.startTime);
        const proposedEnd = new Date(proposedStart);
        
        if (duration === 660) {
          // All day booking
          proposedEnd.setDate(proposedEnd.getDate() + 1);
          proposedEnd.setHours(0, 0, 0, 0);
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
          const overlapStart = new Date(Math.max(proposedStart.getTime(), hourStart.getTime()));
          const overlapEnd = new Date(Math.min(proposedEnd.getTime(), hourEnd.getTime()));
          
          if (overlapStart < overlapEnd) {
            const overlapMinutes = (overlapEnd - overlapStart) / (1000 * 60);
            proposedBookingPercentage = (overlapMinutes / 60) * 100;
            
            // คำนวณจุดเริ่มต้นของ booking ในชั่วโมงนี้
            const startMinutesFromHourStart = (overlapStart - hourStart) / (1000 * 60);
            proposedBookingStartPercent = (startMinutesFromHourStart / 60) * 100;
          }
        }
      }

      const isBooked = proposedBookingPercentage > 0;
      const isCurrentSlot = formData.startTime ? 
        hour === new Date(formData.startTime).getHours() : false;
      
      return { 
        hour, 
        isBooked, 
        isCurrentSlot,
        hasExistingEvent,
        existingEventPercentage,
        existingEventStartPercent,
        proposedBookingPercentage,
        proposedBookingStartPercent,
        eventsInThisHour  // เพิ่มข้อมูล events ทั้งหมดในชั่วโมง
      };
    });
  };

  // แปลง duration เป็น hh:mm ถ้าเกิน 60 นาที
  const formatDurationDisplay = (duration) => {
    if (duration < 60) return `${duration} min`;
    const hours = Math.floor(duration / 60);
    const mins = duration % 60;
    return `${hours}:${mins.toString().padStart(2, '0')} hr`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setLoadingCreate(true);
      try {
        let startDate, endDate;

        if (formData.duration === 660) {
          // กรณี All day → start เป็น 08:00:00 ของวันนั้น, end เป็น 19:00:00 ของวันเดียวกัน
          const baseDate = new Date(formData.startTime);
          startDate = new Date(baseDate);
          startDate.setHours(8, 0, 0, 0);

          endDate = new Date(baseDate);
          endDate.setHours(19, 0, 0, 0);
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
        const response = await axios.post('/api2/user/ms/create', { createroomdata: payload })
        // console.log("Booking created successfully, waiting for events to update...");

        // Step 2: ตั้ง flag เพื่อรอ event จาก SSE
        setTargetStart(startDate);
        setTargetEnd(endDate);
        setWaitingEvent(true);
      } catch (error) {
        console.error("Booking error:", error);
        setErrors({
          submit: error.response?.data?.error || "Failed to book the room. Please try again."
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
      const pinResponse = await axios.post('/api2/user/search-pin', {
        pindata: {
          eventId: matchevent.id,
          room_number: roomId,
          organizerMail: matchevent.organizer?.emailAddress?.address,        
          pin: Pin,
          startDateTime: matchevent.start?.dateTime,
          endDateTime: matchevent.end?.dateTime
        }
      });

      if (!pinResponse.data.success) {
        setErrors({
          submit: "Booking created successfully but failed to retrieve PIN. Please contact support."
        });
        return;
      }
      setBookingPin(Pin);
      setShowPinModal(true);
      if (onSubmit) onSubmit(formData);

      setFormData({ subject: '', startTime: '', duration: 15, bookedBy: '' });
      setErrors({});
    } catch (error) {
      console.error("Booking error:", error);
      setErrors({
        submit: error.response?.data?.error || "Failed to retrieve PIN. Please try again."
      });
    } finally {
      setLoadingCreate(false);
    }
  };

  // useEffect สำหรับตรวจจับ event ใหม่จาก SSE
  useEffect(() => {
    if (!waitingEvent || !targetStart || !targetEnd || !events || events.length === 0) return;

    const matchedEvent = events.find(event => {
      const eventStart = new Date(event.start.dateTime + 'Z');
      const eventEnd = new Date(event.end.dateTime + 'Z');
      const startTimeDiff = Math.abs(eventStart.getTime() - targetStart.getTime());
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
    
    if (field === 'startTime' || field === 'duration') {
      // ตรวจสอบและเลื่อนเวลาถ้ามี conflict
      const newStartTime = field === 'startTime' ? value : formData.startTime;
      const newDuration = field === 'duration' ? value : formData.duration;
      
      if (newStartTime && newDuration) {
        const availableTime = findNextAvailableTime(newStartTime, newDuration);
        if (availableTime !== newStartTime && field === 'startTime') {
          // แจ้งผู้ใช้ว่าเวลาถูกเลื่อน
          // console.log(`Time adjusted from ${formatDisplayTime(newStartTime)} to ${formatDisplayTime(availableTime)} due to conflict`);
          setFormData(prev => ({ ...prev, startTime: availableTime }));
          return;
        } else if (field === 'duration') {
          // เมื่อเปลี่ยน duration ให้ตรวจสอบและเลื่อนเวลาถ้าจำเป็น
          const availableTime = findNextAvailableTime(newStartTime, newDuration);
          if (availableTime !== newStartTime) {
            setFormData(prev => ({ ...prev, [field]: value, startTime: availableTime }));
            return;
          }
        }
      }
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const adjustTime = (increment) => {
    handleUserInteraction(); // หยุด timer เมื่อผู้ใช้ปรับเวลา
    if (!formData.startTime) return;
    
    try {
      const currentTime = new Date(formData.startTime);
      if (isNaN(currentTime.getTime())) return; // Check for Invalid Date
    
      const minutes = increment ? 15 : -15;
      currentTime.setMinutes(currentTime.getMinutes() + minutes);
    
      // Ensure we have a valid date after adjustment
      if (isNaN(currentTime.getTime())) return;
      
      // Enforce business hours boundaries for start time
      let maxStartTime = new Date(currentTime);
      let minStartTime = new Date(currentTime);
      minStartTime.setHours(8, 0, 0, 0);
      maxStartTime.setHours(19, 0, 0, 0);
      // If start time < 8:00, set to 8:00
      if (currentTime < minStartTime) {
        currentTime.setHours(8, 0, 0, 0);
      }
      // If end time > 19:00, set start time to latest possible
      const proposedEnd = new Date(currentTime);
      proposedEnd.setMinutes(proposedEnd.getMinutes() + formData.duration);
      if (proposedEnd > maxStartTime) {
        // ปรับ start time ให้พอดี 19:00
        const maxStartMinutes = 19 * 60 - formData.duration;
        const maxStartHour = Math.floor(maxStartMinutes / 60);
        const maxStartMin = maxStartMinutes % 60;
        currentTime.setHours(maxStartHour, maxStartMin, 0, 0);
      }
    
      const year = currentTime.getFullYear();
      const month = String(currentTime.getMonth() + 1).padStart(2, '0');
      const day = String(currentTime.getDate()).padStart(2, '0');
      const hours = String(currentTime.getHours()).padStart(2, '0');
      const mins = String(currentTime.getMinutes()).padStart(2, '0');
    
      const newTimeString = `${year}-${month}-${day}T${hours}:${mins}`;
      
      // ตรวจสอบว่าเวลาใหม่มี conflict หรือไม่
      const hasConflict = checkTimeConflict(newTimeString, formData.duration);
      
      if (!hasConflict) {
        // ถ้าไม่มี conflict ให้ใช้เวลานี้เลย
        setFormData(prev => ({ ...prev, startTime: newTimeString }));
      } else {
        // ถ้ามี conflict ให้หาเวลาว่างในทิศทางที่ผู้ใช้ต้องการ
        const direction = increment ? 'forward' : 'backward';
        const availableTime = findNextAvailableTime(newTimeString, formData.duration, direction);
        setFormData(prev => ({ ...prev, startTime: availableTime }));
      }
    } catch (error) {
      console.error('Error adjusting time:', error);
    }
  };

  const adjustDuration = (increment) => {
    handleUserInteraction(); // หยุด timer เมื่อผู้ใช้ปรับระยะเวลา
    const change = increment ? 15 : -15;
    let newDuration = Math.max(15, formData.duration + change);
    let startDate = formData.startTime ? new Date(formData.startTime) : null;
    // Always enforce end time <= 19:00
    if (startDate) {
      let proposedEndDate = new Date(startDate);
      proposedEndDate.setMinutes(proposedEndDate.getMinutes() + newDuration);
      const maxEndTime = new Date(startDate);
      maxEndTime.setHours(19, 0, 0, 0);
      if (proposedEndDate > maxEndTime) {
        // ปรับ duration ให้พอดี 19:00
        const maxDuration = (maxEndTime.getTime() - startDate.getTime()) / (1000 * 60);
        newDuration = Math.max(15, Math.floor(maxDuration / 15) * 15);
        // ถ้า duration ไม่เปลี่ยน แสดงว่าไม่สามารถเพิ่มได้แล้ว
        if (newDuration === formData.duration) return;
      }
    }
    // ตรวจสอบและเลื่อนเวลาถ้ามี conflict เมื่อเปลี่ยน duration
    if (formData.startTime) {
      const hasConflict = checkTimeConflict(formData.startTime, newDuration);
      if (!hasConflict) {
        setFormData(prev => ({ ...prev, duration: newDuration }));
      } else {
        const availableTime = findNextAvailableTime(formData.startTime, newDuration, 'forward');
        setFormData(prev => ({ ...prev, duration: newDuration, startTime: availableTime }));
      }
    } else {
      handleChange('duration', newDuration);
    }
  };

  // Calculate end time based on start time and duration
  const getEndTime = () => {
    if (!formData.startTime) return '00:00';
    try {
      const startDate = new Date(formData.startTime);
      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + formData.duration);
      return formatDisplayTime(endDate.toISOString());
    } catch (error) {
      return '00:00';
    }
  };

  // Set quick duration presets
  const setQuickDuration = (minutes) => {
    handleUserInteraction(); // หยุด timer เมื่อผู้ใช้เลือก quick duration
    if (formData.startTime) {
      let newDuration = minutes;
      const startDate = new Date(formData.startTime);
      const maxEndTime = new Date(startDate);
      maxEndTime.setHours(19, 0, 0, 0);
      const proposedEndDate = new Date(startDate);
      proposedEndDate.setMinutes(proposedEndDate.getMinutes() + newDuration);
      
      if (proposedEndDate > maxEndTime) {
        // คำนวณ duration สูงสุดที่เป็นไปได้
        const maxDuration = (maxEndTime.getTime() - startDate.getTime()) / (1000 * 60);
        const maxDurationRounded = Math.max(15, Math.floor(maxDuration / 15) * 15);
        
        if (maxDurationRounded < minutes) {
          // ถ้า duration ที่ต้องการมากเกินไป ให้หาเวลาเริ่มต้นใหม่
          const availableTime = findNextAvailableTime(formData.startTime, minutes, 'backward');
          
          // ตรวจสอบอีกครั้งว่าเวลาใหม่สามารถรองรับ duration ที่ต้องการได้หรือไม่
          const newStartDate = new Date(availableTime);
          const newProposedEndDate = new Date(newStartDate);
          newProposedEndDate.setMinutes(newProposedEndDate.getMinutes() + minutes);
          const newMaxEndTime = new Date(newStartDate);
          newMaxEndTime.setHours(19, 0, 0, 0);
          
          if (newProposedEndDate <= newMaxEndTime) {
            // ถ้าเวลาใหม่รองรับได้ ให้ใช้
            setFormData(prev => ({ ...prev, duration: minutes, startTime: availableTime }));
          } else {
            // ถ้ายังไม่รองรับ ให้ใช้ duration สูงสุดที่เป็นไปได้
            setFormData(prev => ({ ...prev, duration: maxDurationRounded }));
          }
          return;
        } else {
          // ถ้า duration ที่คำนวณได้รองรับ ให้ใช้
          newDuration = maxDurationRounded;
        }
      }
      
      // ตรวจสอบ conflict และหาเวลาที่เหมาะสม
      const availableTime = findNextAvailableTime(formData.startTime, newDuration);
      setFormData(prev => ({ ...prev, duration: newDuration, startTime: availableTime }));
    } else {
      handleChange('duration', minutes);
    }
  };

  const formatDisplayTime = (timeString) => {
    if (!timeString) return '12:00 AM';
    
    try {
      const time = new Date(timeString);
      if (isNaN(time.getTime())) return '12:00 AM'; // Check for Invalid Date
    
      return time.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      });
    } catch (error) {
      console.error('Invalid date format:', timeString);
      return '12:00 AM';
    }
  };
  //วันที่ปัจจุบันโชว์ที่ header
  const getCurrentDate = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const timelineData = generateTimelineData();

  // PIN Modal Component
  const PinModal = () => (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <button onClick={() => {
            setShowPinModal(false);
            onClose(); // ปิด modal หลัก เมื่อกด X
          }} className="close-button">
            <X size={25} />
          </button>
          <div className="header-info">
            <div className="modal-title">Booking Confirmed!</div>
          </div>
        </div>
        <div className="modal-body">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h2>Your Meeting PIN</h2>
            <div style={{ 
              fontSize: '3rem', 
              fontWeight: 'bold', 
              color: '#16a34a', 
              margin: '1rem 0',
              letterSpacing: '0.2em'
            }}>
              {bookingPin}
            </div>
            <p style={{ color: '#666', marginBottom: '2rem' }}>
              Please save this PIN. You'll need it to access the room.
            </p>
            <button 
              onClick={() => {
                setShowPinModal(false);
                onClose(); // ปิด modal หลัก เมื่อกด Got it!
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
      const proposedStart = new Date(formData.startTime);
      const now = new Date();
      
      // ตรวจสอบการจองย้อนหลัง
      if (proposedStart < now) {
        // เพิ่ม buffer 1 นาที เพื่อให้สามารถจองเวลาปัจจุบันได้
        const bufferTime = new Date(now.getTime() - 15 * 60 * 1000); // ลบ 1 นาที
        if (proposedStart < bufferTime) {
          return (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              marginBottom: '1rem',
              color: '#DC2626'
            }}>
              ⚠️ Cannot book for past time. Please select current or future time.
            </div>
          );
        }
      }
      
      // ตรวจสอบการทับซ้อนกับ events อื่น
      if (checkTimeConflict(formData.startTime, formData.duration) && proposedStart > now) {
        return (
          <div style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '0.5rem',
            padding: '0.75rem',
            marginBottom: '1rem',
            color: '#DC2626'
          }}>
            ⚠️ Selected time conflicts with existing booking or business hours
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
            if (e.target === e.currentTarget && !loadingCreate && !waitingEvent && !loadingEvents) {
              onClose();
            }
          }}
        >
          <div className="modal-container">
            <div className="modal-header">
              <button 
                onClick={(loadingCreate || waitingEvent || loadingEvents) ? undefined : onClose} 
                className="close-button"
                disabled={loadingCreate || waitingEvent || loadingEvents}
                style={{
                  opacity: (loadingCreate || waitingEvent || loadingEvents) ? 0.3 : 1,
                  cursor: (loadingCreate || waitingEvent || loadingEvents) ? 'not-allowed' : 'pointer',
                  pointerEvents: (loadingCreate || waitingEvent || loadingEvents) ? 'none' : 'auto'
                }}
              >
                <X size={25} />
              </button>
              <div className="header-info">
                <div className="date-text">{getCurrentDate()}</div>
                <div className="modal-title">
                  New Booking
                </div>
              </div>
            </div>

            <div className="modal-body" style={{ position: 'relative' }}>
              {/* Loading Overlay for Modal Body Only */}
              {(loadingCreate || waitingEvent) && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 1000,
                  borderRadius: '0 0 1rem 1rem'
                }}>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: '#4B5563',
                    marginBottom: '1rem',
                    animation: 'fadeInOut 1.5s infinite'
                  }}>
                    {loadingCreate ? 'Booking...' : 'Waiting...'}
                  </div>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid #E5E7EB',
                    borderTop: '4px solid #10B981',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  
                  <style jsx>{`
                    @keyframes spin {
                      0% { transform: rotate(0deg); }
                      100% { transform: rotate(360deg); }
                    }
                    @keyframes fadeInOut {
                      0%, 100% { opacity: 0.6; }
                      50% { opacity: 1; }
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
                      opacity: (loadingCreate || waitingEvent || loadingEvents) ? 0.3 : 1,
                      cursor: (loadingCreate || waitingEvent || loadingEvents) ? 'not-allowed' : 'pointer',
                      pointerEvents: (loadingCreate || waitingEvent || loadingEvents) ? 'none' : 'auto'
                    }}
                  />
                </div>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => {
                    handleUserInteraction(); // หยุด timer เมื่อผู้ใช้พิมพ์
                    handleChange('subject', e.target.value);
                  }}
                  onFocus={handleUserInteraction} // หยุด timer เมื่อผู้ใช้คลิกที่ input
                  className={errors.subject ? 'input-error' : ''}
                  placeholder="Enter meeting subject"
                  disabled={!subjectEnabled || loadingCreate || waitingEvent || loadingEvents}
                  style={{
                    opacity: (!subjectEnabled || loadingCreate || waitingEvent || loadingEvents) ? 0.3 : 1,
                    cursor: (!subjectEnabled || loadingCreate || waitingEvent || loadingEvents) ? 'not-allowed' : 'text',
                    pointerEvents: (!subjectEnabled || loadingCreate || waitingEvent || loadingEvents) ? 'none' : 'auto'
                  }}
                />
                {errors.subject && <p className="error-text">{errors.subject}</p>}
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

              <div className="timeline">
                {timelineData.map(({ hour, isBooked, isCurrentSlot, hasExistingEvent, existingEventPercentage, existingEventStartPercent, proposedBookingPercentage, proposedBookingStartPercent, eventsInThisHour }) => (
                  <div
                    key={hour}
                    className={`timeline-block ${
                      hasExistingEvent ? 'existing-event' : ''
                    } ${isBooked ? (isCurrentSlot ? 'current-slot' : 'booked-slot') : ''}`}
                    style={{
                      position: 'relative',
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
                            endPercent: proposedBookingStartPercent + proposedBookingPercentage,
                            type: 'proposed'
                          });
                        }
                        
                        // เรียงลำดับตามตำแหน่ง
                        allEvents.sort((a, b) => a.startPercent - b.startPercent);
                        
                        // วิธีใหม่: สร้าง timeline โดยตรวจสอบทุกจุดที่มีการเปลี่ยนแปลง
                        const changePoints = [];
                        allEvents.forEach(event => {
                          changePoints.push({ pos: event.startPercent, type: 'start', event });
                          changePoints.push({ pos: event.endPercent, type: 'end', event });
                        });
                        changePoints.sort((a, b) => a.pos - b.pos || (a.type === 'start' ? -1 : 1));
                        
                        let activeEvents = [];
                        let lastPos = 0;
                        
                        changePoints.forEach(point => {
                          // เติมส่วนก่อนหน้า
                          if (lastPos < point.pos) {
                            if (activeEvents.length === 0) {
                              segments.push(`#E5E7EB ${lastPos}%`, `#E5E7EB ${point.pos}%`);
                            } else if (activeEvents.length === 1) {
                              const color = activeEvents[0].type === 'existing' ? '#4B5563' : '#10B981';
                              segments.push(`${color} ${lastPos}%`, `${color} ${point.pos}%`);
                            } else {
                              // มีมากกว่า 1 event = conflict
                              segments.push(`#eccd32 ${lastPos}%`, `#eccd32 ${point.pos}%`);
                            }
                          }
                          
                          // อัปเดต activeEvents
                          if (point.type === 'start') {
                            activeEvents.push(point.event);
                          } else {
                            activeEvents = activeEvents.filter(e => e !== point.event);
                          }
                          
                          lastPos = point.pos;
                        });
                        
                        // เติมส่วนที่เหลือ
                        if (lastPos < 100) {
                          if (activeEvents.length === 0) {
                            segments.push(`#E5E7EB ${lastPos}%`, `#E5E7EB 100%`);
                          } else if (activeEvents.length === 1) {
                            const color = activeEvents[0].type === 'existing' ? '#4B5563' : '#10B981';
                            segments.push(`${color} ${lastPos}%`, `${color} 100%`);
                          } else {
                            segments.push(`#eccd32 ${lastPos}%`, `#eccd32 100%`);
                          }
                        }
                        
                        // ถ้าไม่มี events ใดๆ
                        if (segments.length === 0) {
                          return '#E5E7EB';
                        }
                        
                        return `linear-gradient(to right, ${segments.join(', ')})`;
                      })()
                    }}
                  >
                  </div>
                ))}
              </div>
              <div className="timeline-labels">
                {timelineData.map(({ hour }) => {
                  const timeString = `2000-01-01T${String(hour).padStart(2, '0')}:00:00`;
                  const formattedTime = new Date(timeString).toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    hour12: true 
                  });
                  return (
                    <span key={hour}>{formattedTime}</span>
                  );
                })}
              </div>

              {/* Timeline Legend */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: '1rem', 
                marginTop: '0.5rem', 
                marginBottom: '1rem',
                fontSize: '0.75rem',
                color: '#666'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <div style={{ 
                    width: '12px', 
                    height: '12px', 
                    backgroundColor: '#4B5563', 
                    borderRadius: '2px' 
                  }}></div>
                  <span>unavailable</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <div style={{ 
                    width: '12px', 
                    height: '12px', 
                    backgroundColor: '#10B981', 
                    borderRadius: '2px' 
                  }}></div>
                  <span>Available</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <div style={{ 
                    width: '12px', 
                    height: '12px', 
                    backgroundColor: '#eccd32', 
                    borderRadius: '2px' 
                  }}></div>
                  <span>conflict</span>
                </div>
              </div>

              <div className="form-group">
                <label>Start Time</label>
                <div className="adjust-group">
                  <button 
                    onClick={() => adjustTime(false)}
                    disabled={loadingCreate || waitingEvent || loadingEvents}
                    style={{
                      opacity: (loadingCreate || waitingEvent || loadingEvents) ? 0.3 : 1,
                      cursor: (loadingCreate || waitingEvent || loadingEvents) ? 'not-allowed' : 'pointer',
                      pointerEvents: (loadingCreate || waitingEvent || loadingEvents) ? 'none' : 'auto'
                    }}
                  >
                    <Minus size={16} />
                  </button>
                  <div className="display-time">{formatDisplayTime(formData.startTime)}</div>
                  <button 
                    onClick={() => adjustTime(true)}
                    disabled={loadingCreate || waitingEvent || loadingEvents}
                    style={{
                      opacity: (loadingCreate || waitingEvent || loadingEvents) ? 0.3 : 1,
                      cursor: (loadingCreate || waitingEvent || loadingEvents) ? 'not-allowed' : 'pointer',
                      pointerEvents: (loadingCreate || waitingEvent || loadingEvents) ? 'none' : 'auto'
                    }}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                {errors.startTime && <p className="error-text">{errors.startTime}</p>}
              </div>

              <div className="form-group">
                <label>End Time</label>
                <div className="adjust-group">
                  <button 
                    onClick={() => adjustDuration(false)}
                    disabled={loadingCreate || waitingEvent || loadingEvents}
                    style={{
                      opacity: (loadingCreate || waitingEvent || loadingEvents) ? 0.3 : 1,
                      cursor: (loadingCreate || waitingEvent || loadingEvents) ? 'not-allowed' : 'pointer',
                      pointerEvents: (loadingCreate || waitingEvent || loadingEvents) ? 'none' : 'auto'
                    }}
                  >
                    <Minus size={16} />
                  </button>
                  <div className="display-time">{getEndTime()}</div>
                  <button 
                    onClick={() => adjustDuration(true)}
                    disabled={loadingCreate || waitingEvent || loadingEvents}
                    style={{
                      opacity: (loadingCreate || waitingEvent || loadingEvents) ? 0.3 : 1,
                      cursor: (loadingCreate || waitingEvent || loadingEvents) ? 'not-allowed' : 'pointer',
                      pointerEvents: (loadingCreate || waitingEvent || loadingEvents) ? 'none' : 'auto'
                    }}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                {errors.duration && <p className="error-text">{errors.duration}</p>}
                
                {/* Quick Duration Menu */}
                <div className="quick-duration-menu">
                  <div className="quick-duration-container">
                    <button 
                      type="button"
                      onClick={() => setQuickDuration(15)}
                      className={`quick-duration-btn ${formData.duration === 15 ? 'active' : ''}`}
                      disabled={loadingCreate || waitingEvent || loadingEvents}
                      style={{
                        opacity: (loadingCreate || waitingEvent || loadingEvents) ? 0.3 : 1,
                        cursor: (loadingCreate || waitingEvent || loadingEvents) ? 'not-allowed' : 'pointer',
                        pointerEvents: (loadingCreate || waitingEvent || loadingEvents) ? 'none' : 'auto'
                      }}
                    >
                      15min
                    </button>
                    <button 
                      type="button"
                      onClick={() => setQuickDuration(30)}
                      className={`quick-duration-btn ${formData.duration === 30 ? 'active' : ''}`}
                      disabled={loadingCreate || waitingEvent || loadingEvents}
                      style={{
                        opacity: (loadingCreate || waitingEvent || loadingEvents) ? 0.3 : 1,
                        cursor: (loadingCreate || waitingEvent || loadingEvents) ? 'not-allowed' : 'pointer',
                        pointerEvents: (loadingCreate || waitingEvent || loadingEvents) ? 'none' : 'auto'
                      }}
                    >
                      30min
                    </button>
                    <button 
                      type="button"
                      onClick={() => setQuickDuration(60)}
                      className={`quick-duration-btn ${formData.duration === 60 ? 'active' : ''}`}
                      disabled={loadingCreate || waitingEvent || loadingEvents}
                      style={{
                        opacity: (loadingCreate || waitingEvent || loadingEvents) ? 0.3 : 1,
                        cursor: (loadingCreate || waitingEvent || loadingEvents) ? 'not-allowed' : 'pointer',
                        pointerEvents: (loadingCreate || waitingEvent || loadingEvents) ? 'none' : 'auto'
                      }}
                    >
                      1hr
                    </button>
                    <button 
                      type="button"
                      onClick={() => setQuickDuration(120)}
                      className={`quick-duration-btn ${formData.duration === 120 ? 'active' : ''}`}
                      disabled={loadingCreate || waitingEvent || loadingEvents}
                      style={{
                        opacity: (loadingCreate || waitingEvent || loadingEvents) ? 0.3 : 1,
                        cursor: (loadingCreate || waitingEvent || loadingEvents) ? 'not-allowed' : 'pointer',
                        pointerEvents: (loadingCreate || waitingEvent || loadingEvents) ? 'none' : 'auto'
                      }}
                    >
                      2hr
                    </button>
                    <button 
                      type="button"
                      onClick={() => setQuickDuration(660)}
                      className={`quick-duration-btn ${formData.duration === 660 ? 'active' : ''}`}
                      disabled={loadingCreate || waitingEvent || loadingEvents}
                      style={{
                        opacity: (loadingCreate || waitingEvent || loadingEvents) ? 0.3 : 1,
                        cursor: (loadingCreate || waitingEvent || loadingEvents) ? 'not-allowed' : 'pointer',
                        pointerEvents: (loadingCreate || waitingEvent || loadingEvents) ? 'none' : 'auto'
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
                  disabled={loadingEvents || loadingCreate || !canBook || waitingEvent || isPastTime()}
                  style={{
                    opacity: (loadingEvents || loadingCreate || !canBook || waitingEvent || isPastTime()) ? 0.5 : 1,
                    cursor: (loadingEvents || loadingCreate || !canBook || waitingEvent || isPastTime()) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {getBookingButtonText()}
                </button>
                {errors.submit && <p className="error-text">{errors.submit}</p>}
                {errors.timeConflict && <p className="error-text">{errors.timeConflict}</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BookingModal;