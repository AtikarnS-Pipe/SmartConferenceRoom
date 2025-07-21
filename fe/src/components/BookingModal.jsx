import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Home, Calendar } from 'lucide-react';
import { useRoomData } from '../hooks/useRoomData';
import { useEvents } from '../hooks/useEvents';
import axios from 'axios';

//constant
const COUNTDOWN_TIME = 1000; //เวลาปิดอัตโนมัติ 30 วินาที
const BookingModal = ({ isOpen, onClose, onSubmit, onPinModalClose }) => {
  const [formData, setFormData] = useState({
    subject: '',
    startTime: '',
    duration: 15,
    bookedBy: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [subjectEnabled, setSubjectEnabled] = useState(false);
  const [bookedByEnabled, setBookedByEnabled] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [bookingPin, setBookingPin] = useState('');
  const [waitingEvent, setWaitingEvent] = useState(false);
  const [targetStart, setTargetStart] = useState(null);
  const [targetEnd, setTargetEnd] = useState(null);
  const [countdown, setCountdown] = useState(COUNTDOWN_TIME);
  const { floor, room } = useRoomData();
  const { events } = useEvents(floor, room);
  const roomId = `${floor}${room}`; // สร้าง roomId จาก floor และ room

  // Reset countdown when modal opens
  useEffect(() => {
    if (isOpen) {
      setCountdown(COUNTDOWN_TIME);
    }
  }, [isOpen]);

  // Auto-close timer with countdown
  useEffect(() => {
    let countdownInterval;
    
    // console.log('Timer useEffect:', { isOpen, showPinModal, countdown });
    
    if (isOpen && !showPinModal) {
      console.log('Starting/continuing countdown timer');
      
      // สร้าง interval สำหรับ countdown
      countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          // console.log('Countdown:', prev - 1);
          const newCount = prev - 1;
          return newCount;
        });
      }, 1000);

    } else {
      console.log('Timer not started:', { isOpen, showPinModal });
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
    if (countdown === 0 && isOpen && !showPinModal) {
      console.log('Countdown reached 0, closing modal');
      onClose();
    }
  }, [countdown, isOpen, showPinModal, onClose]);

  // fn เมื่อ users กดปุ่มใดๆ ใน modalจะรีเซ็ต countdown
  const handleUserInteraction = () => {
    console.log('User interaction detected - restarting countdown');
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

  useEffect(() => {
    if (isOpen && !formData.startTime) {
      // Set startTime without triggering handleUserInteraction
      setFormData(prev => ({ ...prev, startTime: getCurrentTime() }));
    }
  }, [isOpen]);

  // ฟังก์ชันหาเวลาว่างถัดไป (รองรับทั้งไปข้างหน้าและย้อนหลัง)
  const findNextAvailableTime = (startTime, duration, direction = 'forward') => {
    if (!startTime || !events || events.length === 0) return startTime;

    const proposedStart = new Date(startTime);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // เริ่มตรวจสอบจากเวลาที่กำหนด
    let checkTime = new Date(proposedStart);
    
    // กำหนดขอบเขตการค้นหา
    const startOfDay = new Date(today);
    startOfDay.setHours(8, 0, 0, 0); // เริ่มที่ 8:00
    const endOfDay = new Date(today);
    endOfDay.setHours(19, 0, 0, 0); // จบที่ 19:00
    
    // กำหนดทิศทางการค้นหา
    const increment = direction === 'forward' ? 15 : -15;
    const boundary = direction === 'forward' ? endOfDay : startOfDay;
    const comparison = direction === 'forward' ? 
      (time, bound) => time < bound : 
      (time, bound) => time >= bound;
    
    let maxIterations = 50; // ป้องกัน infinite loop
    let iterations = 0;
    
    while (comparison(checkTime, boundary) && iterations < maxIterations) {
      iterations++;
      
      // ตรวจสอบว่าเวลานี้ว่างไหม
      const checkEnd = new Date(checkTime);
      checkEnd.setMinutes(checkEnd.getMinutes() + duration);
      
      // ตรวจสอบว่าไม่เกินขอบเขตเวลาทำการ
      if (direction === 'forward' && checkEnd > endOfDay) break;
      if (direction === 'backward' && checkTime < startOfDay) break;
      
      const hasConflict = events.some(event => {
        const eventStart = new Date(event.start.dateTime + 'Z');
        const eventEnd = new Date(event.end.dateTime + 'Z');
        return checkTime < eventEnd && checkEnd > eventStart;
      });
      
      if (!hasConflict) {
        // เจอเวลาว่างแล้ว
        const year = checkTime.getFullYear();
        const month = String(checkTime.getMonth() + 1).padStart(2, '0');
        const day = String(checkTime.getDate()).padStart(2, '0');
        const hours = String(checkTime.getHours()).padStart(2, '0');
        const mins = String(checkTime.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day}T${hours}:${mins}`;
      }
      
      // เลื่อนไปตามทิศทางที่กำหนด
      checkTime.setMinutes(checkTime.getMinutes() + increment);
    }
    
    // ถ้าหาไม่เจอ และเป็นการค้นหาข้างหน้า ให้ลองค้นหาย้อนหลัง
    if (direction === 'forward') {
      const backwardResult = findNextAvailableTime(startTime, duration, 'backward');
      if (backwardResult !== startTime) {
        return backwardResult;
      }
    }
    
    // ถ้าหาไม่เจอ ให้คืนค่าเดิม
    return startTime;
  };

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

  const validateForm = () => {
    const newErrors = {};
    if (subjectEnabled && !formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.startTime) newErrors.startTime = 'Start time is required';
    if (bookedByEnabled && !formData.bookedBy.trim()) newErrors.bookedBy = 'Booked by is required';
    if (formData.duration < 15) newErrors.duration = 'Minimum duration is 15 minutes';
    
    // เพิ่มการตรวจสอบการทับซ้อนเวลา
    if (checkTimeConflict(formData.startTime, formData.duration)) {
      newErrors.timeConflict = 'Selected time conflicts with existing booking';
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

      // คำนวณ percentage ที่มี existing events
      let existingEventPercentage = 0;
      let existingEventStartPercent = 0;
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
            const overlapMinutes = (overlapEnd - overlapStart) / (1000 * 60);
            const eventPercentage = (overlapMinutes / 60) * 100;
            
            // คำนวณจุดเริ่มต้นของ existing event ในชั่วโมงนี้
            const eventStartMinutesFromHourStart = (overlapStart - hourStart) / (1000 * 60);
            const eventStartPercent = (eventStartMinutesFromHourStart / 60) * 100;
            
            // สำหรับ existing events หลายอัน เราจะใช้อันแรกเป็นหลัก
            if (existingEventPercentage === 0) {
              existingEventStartPercent = eventStartPercent;
            }
            
            existingEventPercentage += eventPercentage;
          }
        });
        existingEventPercentage = Math.min(existingEventPercentage, 100);
      }

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
      const hasExistingEvent = existingEventPercentage > 0;
      
      return { 
        hour, 
        isBooked, 
        isCurrentSlot,
        hasExistingEvent,
        existingEventPercentage,
        existingEventStartPercent,
        proposedBookingPercentage,
        proposedBookingStartPercent
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
      setLoading(true);
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

        console.log("Submitting booking:", payload);
        
        // Step 1: Create the event
        const response = await axios.post('/user/ms/create', { createroomdata: payload });
        
        if (!response.data.success) {
          throw new Error('Failed to create booking');
        }

        console.log("Booking created successfully, waiting for events to update...");

        // Step 2: ตั้ง flag เพื่อรอ event จาก SSE
        setTargetStart(startDate);
        setTargetEnd(endDate);
        setWaitingEvent(true);
      } catch (error) {
        console.error("Booking error:", error);
        setErrors({
          submit: error.response?.data?.error || "Failed to book the room. Please try again."
        });
        setLoading(false);
      }
    }
  };

  // ฟังก์ชันสำหรับดึง PIN
  const getPin = async (eventId) => {
    try {
      const pinResponse = await axios.post('/user/search-pin', {
        eventId,
        room_number: roomId
      });

      if (!pinResponse.data.success) {
        setErrors({
          submit: "Booking created successfully but failed to retrieve PIN. Please contact support."
        });
        return;
      }

      const Pin = pinResponse.data.pin;
      console.log("Retrieved PIN:", Pin);

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
      setLoading(false);
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
      console.log("Found matching event from SSE:", matchedEvent.id);
      getPin(matchedEvent.id);
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
          console.log(`Time adjusted from ${formatDisplayTime(newStartTime)} to ${formatDisplayTime(availableTime)} due to conflict`);
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
        const maxDuration = (maxEndTime.getTime() - startDate.getTime()) / (1000 * 60);
        newDuration = Math.max(15, Math.floor(maxDuration / 15) * 15);
        if (newDuration < minutes) {
          // หาเวลาเริ่มต้นที่เหมาะสมสำหรับ duration ที่ต้องการ
          const availableTime = findNextAvailableTime(formData.startTime, minutes, 'backward');
          setFormData(prev => ({ ...prev, duration: minutes, startTime: availableTime }));
          return;
        }
      }
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
    if (checkTimeConflict(formData.startTime, formData.duration)) {
      return (
        <div style={{
          backgroundColor: '#FEF2F2',
          border: '1px solid #FECACA',
          borderRadius: '0.5rem',
          padding: '0.75rem',
          marginBottom: '1rem',
          color: '#DC2626'
        }}>
          ⚠️ Selected time conflicts with existing booking
        </div>
      );
    }
    return null;
  };

  if (!isOpen) return null;

  return (
    <>
      {showPinModal && <PinModal />}
      {!showPinModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <button onClick={onClose} className="close-button">
                <X size={25} />
              </button>
              <div className="header-info">
                <div className="date-text">{getCurrentDate()}</div>
                <div className="modal-title">
                  New Booking{countdown > 0 ? ` (${countdown}s)` : ''}
                </div>
              </div>
            </div>

            <div className="modal-body">
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
                  disabled={!subjectEnabled}
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
                {timelineData.map(({ hour, isBooked, isCurrentSlot, hasExistingEvent, existingEventPercentage, existingEventStartPercent, proposedBookingPercentage, proposedBookingStartPercent }) => (
                  <div
                    key={hour}
                    className={`timeline-block ${
                      hasExistingEvent ? 'existing-event' : ''
                    } ${isBooked ? (isCurrentSlot ? 'current-slot' : 'booked-slot') : ''}`}
                    style={{
                      position: 'relative',
                      background: (() => {
                        if (hasExistingEvent && isBooked) {
                          // มีทั้ง existing event และ proposed booking ในชั่วโมงเดียวกัน
                          // สร้าง gradient ที่แสดงทั้งสองสี
                          const segments = [];
                          
                          // เรียงลำดับตามตำแหน่ง
                          const events = [
                            { start: existingEventStartPercent, end: existingEventStartPercent + existingEventPercentage, color: '#DC2626' },
                            { start: proposedBookingStartPercent, end: proposedBookingStartPercent + proposedBookingPercentage, color: '#3B82F6' }
                          ].sort((a, b) => a.start - b.start);
                          
                          let currentPos = 0;
                          events.forEach(event => {
                            if (currentPos < event.start) {
                              segments.push(`#E5E7EB ${currentPos}%`, `#E5E7EB ${event.start}%`);
                            }
                            segments.push(`${event.color} ${event.start}%`, `${event.color} ${event.end}%`);
                            currentPos = event.end;
                          });
                          
                          if (currentPos < 100) {
                            segments.push(`#E5E7EB ${currentPos}%`, `#E5E7EB 100%`);
                          }
                          
                          return `linear-gradient(to right, ${segments.join(', ')})`;
                        } else if (hasExistingEvent) {
                          return `linear-gradient(to right, #E5E7EB 0%, #E5E7EB ${existingEventStartPercent}%, #DC2626 ${existingEventStartPercent}%, #DC2626 ${existingEventStartPercent + existingEventPercentage}%, #E5E7EB ${existingEventStartPercent + existingEventPercentage}%, #E5E7EB 100%)`;
                        } else if (isBooked) {
                          return `linear-gradient(to right, #E5E7EB 0%, #E5E7EB ${proposedBookingStartPercent}%, #3B82F6 ${proposedBookingStartPercent}%, #3B82F6 ${proposedBookingStartPercent + proposedBookingPercentage}%, #E5E7EB ${proposedBookingStartPercent + proposedBookingPercentage}%, #E5E7EB 100%)`;
                        }
                        return undefined;
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

              <div className="form-group">
                <label>Start Time</label>
                <div className="adjust-group">
                  <button onClick={() => adjustTime(false)}><Minus size={16} /></button>
                  <div className="display-time">{formatDisplayTime(formData.startTime)}</div>
                  <button onClick={() => adjustTime(true)}><Plus size={16} /></button>
                </div>
                {errors.startTime && <p className="error-text">{errors.startTime}</p>}
              </div>

              <div className="form-group">
                <label>End Time</label>
                <div className="adjust-group">
                  <button onClick={() => adjustDuration(false)}><Minus size={16} /></button>
                  <div className="display-time">{getEndTime()}</div>
                  <button onClick={() => adjustDuration(true)}><Plus size={16} /></button>
                </div>
                {errors.duration && <p className="error-text">{errors.duration}</p>}
                
                {/* Quick Duration Menu */}
                <div className="quick-duration-menu">
                  <div className="quick-duration-container">
                    <button 
                      type="button"
                      onClick={() => setQuickDuration(30)}
                      className={`quick-duration-btn ${formData.duration === 30 ? 'active' : ''}`}
                    >
                      30min
                    </button>
                    <button 
                      type="button"
                      onClick={() => setQuickDuration(60)}
                      className={`quick-duration-btn ${formData.duration === 60 ? 'active' : ''}`}
                    >
                      1hr
                    </button>
                    <button 
                      type="button"
                      onClick={() => setQuickDuration(120)}
                      className={`quick-duration-btn ${formData.duration === 120 ? 'active' : ''}`}
                    >
                      2hr
                    </button>
                    <button 
                      type="button"
                      onClick={() => setQuickDuration(660)}
                      className={`quick-duration-btn ${formData.duration === 660 ? 'active' : ''}`}
                    >
                      All day
                    </button>
                    {/* <button 
                      type="button"
                      onClick={() => setQuickDuration(180)}
                      className={`quick-duration-btn ${formData.duration === 180 ? 'active' : ''}`}
                    >
                      3hr
                    </button> */}
                  </div>
                </div>
              </div>

              <div className="submit-btn-wrapper">
                <button 
                  onClick={(e) => {
                    handleUserInteraction(); // หยุด timer เมื่อผู้ใช้คลิก Book Now
                    handleSubmit(e);
                  }} 
                  className="submit-btn"
                  disabled={loading || !canBook}
                  style={{
                    opacity: !canBook ? 0.5 : 1,
                    cursor: !canBook ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Booking...' : (canBook ? 'Book Now' : 'Time Conflict')}
                </button>
                {errors.submit && <p className="error-text">{errors.submit}</p>}
                {errors.timeConflict && <p className="error-text">{errors.timeConflict}</p>}
              </div>

              {/* <div className="footer-nav">
                <button onClick={onClose}><Home size={16} /> <span>Home</span></button>
                <button onClick={onClose}><span>All Meetings</span> <Calendar size={16} /></button>
              </div> */}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BookingModal;