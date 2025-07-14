import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Home, Calendar } from 'lucide-react';
import { useRoomData } from '../hooks/useRoomData';
import axios from 'axios';

//constant
const BookingModal = ({ isOpen, onClose, onSubmit, roomName }) => {
  const [formData, setFormData] = useState({
    subject: '',
    startTime: '',
    duration: 45,
    bookedBy: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [subjectEnabled, setSubjectEnabled] = useState(false);
  const [bookedByEnabled, setBookedByEnabled] = useState(false);
  const { floor, room } = useRoomData();
  const roomId = `${floor}${room}`; // สร้าง roomId จาก floor และ room

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
        // Extract room number from roomName if available, or use default
        const extractedRoomNumber = roomName?.match(/\d+/)?.[0] || '150';
        
        // Calculate end time based on start time and duration
        const startDate = new Date(formData.startTime);
        const endDate = new Date(startDate);
        endDate.setMinutes(endDate.getMinutes() + formData.duration);
        
        // Format as UTC ISO string for the backend
        const startdatetime = startDate.toISOString();
        const enddatetime = endDate.toISOString();
        
        // Create payload in the format expected by the backend
        const payload = {
          RoomNumber: roomId, // Use roomId from useRoomData
          email: formData.bookedBy, // Using bookedBy as email
          startdatetime: startdatetime,
          enddatetime: enddatetime,
          subject: formData.subject
        };
        
        console.log("Submitting booking:", payload);
        
        // Call the backend API
        const response = await axios.post('/user/ms/create', payload);
        console.log("Booking successful:", response.data);
        
        // Call the onSubmit prop if provided
        if (onSubmit) {
          onSubmit(formData);
        }
        
        // Reset form and close modal
        setFormData({ subject: '', startTime: '', duration: 45, bookedBy: '' });
        setErrors({});
        onClose();
        
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
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const adjustTime = (increment) => {
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
    const change = increment ? 15 : -15;
    const newDuration = Math.max(15, formData.duration + change);
    handleChange('duration', newDuration);
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
      const isBooked = hour >= currentHour && hour < currentHour + (duration / 60);
      const isCurrentSlot = hour === currentHour;
      return { hour, isBooked, isCurrentSlot };
    });
  };

  if (!isOpen) return null;

  const timelineData = generateTimelineData();

  // แปลง duration เป็น hh:mm ถ้าเกิน 60 นาที
  const formatDurationDisplay = (duration) => {
    if (duration < 60) return `${duration} min`;
    const hours = Math.floor(duration / 60);
    const mins = duration % 60;
    return `${hours}:${mins.toString().padStart(2, '0')} hr`;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <button onClick={onClose} className="close-button">
            <X size={25} />
          </button>
          <div className="header-info">
            <div className="date-text">{getCurrentDate()}</div>
            <div className="modal-title">New Booking</div>
            <div className="room-name">{roomName}</div>
          </div>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <div className="label-checkbox-row">
              <label className="label-left">Subject Name</label>
              <input 
                type="checkbox" 
                checked={subjectEnabled}
                onChange={(e) => setSubjectEnabled(e.target.checked)}
              />
            </div>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => handleChange('subject', e.target.value)}
              className={errors.subject ? 'input-error' : ''}
              placeholder="Enter meeting subject"
              disabled={!subjectEnabled}
            />
            {errors.subject && <p className="error-text">{errors.subject}</p>}
          </div>
          <div className="form-group">
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
          </div>
          

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
            <label>Duration</label>
            <div className="adjust-group">
              <button onClick={() => adjustDuration(false)}><Minus size={16} /></button>
              <div className="display-time">{formatDurationDisplay(formData.duration)}</div>
              <button onClick={() => adjustDuration(true)}><Plus size={16} /></button>
            </div>
            {errors.duration && <p className="error-text">{errors.duration}</p>}
          </div>

          <div className="submit-btn-wrapper">
            <button 
              onClick={handleSubmit} 
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
  );
};

export default BookingModal;
