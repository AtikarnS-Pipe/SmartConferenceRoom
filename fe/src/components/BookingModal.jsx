import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Home, Calendar } from 'lucide-react';
import { useRoomData } from '../hooks/useRoomData';
import axios from 'axios';

//constant
const COUNTDOWN_TIME = 30; //เวลาปิดอัตโนมัติ 30 วินาที
const BookingModal = ({ isOpen, onClose, onSubmit,}) => {
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
  const [countdown, setCountdown] = useState(COUNTDOWN_TIME);
  const { floor, room } = useRoomData();
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
    
    console.log('Timer useEffect:', { isOpen, showPinModal, countdown });
    
    if (isOpen && !showPinModal) {
      console.log('Starting/continuing countdown timer');
      
      // สร้าง interval สำหรับ countdown
      countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          console.log('Countdown:', prev - 1);
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
    const hours = Math.floor(roundedMinutes / 60) % 24;
    const minutes = roundedMinutes % 60;
    
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

  const validateForm = () => {
    const newErrors = {};
    if (subjectEnabled && !formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.startTime) newErrors.startTime = 'Start time is required';
    if (bookedByEnabled && !formData.bookedBy.trim()) newErrors.bookedBy = 'Booked by is required';
    if (formData.duration < 15) newErrors.duration = 'Minimum duration is 15 minutes';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (validateForm()) {
    setLoading(true);
    try {
      let startDate, endDate;

      if (formData.duration === 660) {
        // กรณี All day → start เป็น 00:00:00 ของวันนั้น, end เป็น 00:00:00 ของวันถัดไป
        const baseDate = new Date(formData.startTime);
        startDate = new Date(baseDate);
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
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
      const response = await axios.post('/user/ms/create', { createroomdata: payload });
      const Pin = response.data.key;

      setBookingPin(Pin);
      setShowPinModal(true);
      if (onSubmit) onSubmit(formData);

      setFormData({ subject: '', startTime: '', duration: 15, bookedBy: '' });
      setErrors({});
    } catch (error) {
      console.error("Booking error:", error);
      setErrors({
        submit: error.response?.data?.error || "Failed to book the room. Please try again."
      });
    } finally {
      setLoading(false);
    }
  }
};


  const handleChange = (field, value) => {
    handleUserInteraction(); // หยุด timer เมื่อผู้ใช้เปลี่ยนค่า
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
    
      const year = currentTime.getFullYear();
      const month = String(currentTime.getMonth() + 1).padStart(2, '0');
      const day = String(currentTime.getDate()).padStart(2, '0');
      const hours = String(currentTime.getHours()).padStart(2, '0');
      const mins = String(currentTime.getMinutes()).padStart(2, '0');
    
      handleChange('startTime', `${year}-${month}-${day}T${hours}:${mins}`);
    } catch (error) {
      console.error('Error adjusting time:', error);
    }
  };

  const adjustDuration = (increment) => {
    handleUserInteraction(); // หยุด timer เมื่อผู้ใช้ปรับระยะเวลา
    const change = increment ? 15 : -15;
    const newDuration = Math.max(15, formData.duration + change);
    handleChange('duration', newDuration);
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
    handleChange('duration', minutes);
  };

  const formatDisplayTime = (timeString) => {
    if (!timeString) return '00:00';
    
    try {
      const time = new Date(timeString);
      if (isNaN(time.getTime())) return '00:00'; // Check for Invalid Date
    
      return time.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      });
    } catch (error) {
      console.error('Invalid date format:', timeString);
      return '00:00';
    }
  };
  //วันที่ปัจจุบันโชว์ที่ header
  const getCurrentDate = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const generateTimelineData = () => {
    const hours = Array.from({ length: 11 }, (_, i) => i + 8);
    const currentHour = formData.startTime ? new Date(formData.startTime).getHours() : 14;
    const duration = formData.duration;
    return hours.map(hour => {
      const isBooked = hour >= currentHour && hour <= currentHour + (duration / 60);
      const isCurrentSlot = hour === currentHour;
      return { hour, isBooked, isCurrentSlot };
    });
  };

  if (!isOpen) return null;

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

  const timelineData = generateTimelineData();

  // แปลง duration เป็น hh:mm ถ้าเกิน 60 นาที
  const formatDurationDisplay = (duration) => {
    if (duration < 60) return `${duration} min`;
    const hours = Math.floor(duration / 60);
    const mins = duration % 60;
    return `${hours}:${mins.toString().padStart(2, '0')} hr`;
  };

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
              

              <div className="timeline">
                {timelineData.map(({ hour, isBooked, isCurrentSlot }) => (
                  <div
                    key={hour}
                    className={`timeline-block ${isBooked ? (isCurrentSlot ? 'current-slot' : 'booked-slot') : ''}`}
                  />
                ))}
              </div>
              <div className="timeline-labels">
                {timelineData.map(({ hour }) => (
                  <span key={hour}>{hour}:00</span>
                ))}
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
                  disabled={loading}
                >
                  {loading ? 'Booking...' : 'Book Now'}
                </button>
                {errors.submit && <p className="error-text">{errors.submit}</p>}
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
