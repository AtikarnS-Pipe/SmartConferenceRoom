import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Home, Calendar } from 'lucide-react';

const BookingModal = ({ isOpen, onClose, onSubmit, roomName }) => {
  const [formData, setFormData] = useState({
    subject: '',
    startTime: '',
    duration: 45,
    bookedBy: ''
  });

  const [errors, setErrors] = useState({});

  const getCurrentTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(Math.ceil(now.getMinutes() / 15) * 15).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  useEffect(() => {
    if (isOpen && !formData.startTime) {
      setFormData(prev => ({ ...prev, startTime: getCurrentTime() }));
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.startTime) newErrors.startTime = 'Start time is required';
    if (!formData.bookedBy.trim()) newErrors.bookedBy = 'Booked by is required';
    if (formData.duration < 15) newErrors.duration = 'Minimum duration is 15 minutes';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
      setFormData({ subject: '', startTime: '', duration: 45, bookedBy: '' });
      setErrors({});
      onClose();
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const adjustTime = (increment) => {
    if (!formData.startTime) return;
    const currentTime = new Date(formData.startTime);
    const minutes = increment ? 15 : -15;
    currentTime.setMinutes(currentTime.getMinutes() + minutes);
    const year = currentTime.getFullYear();
    const month = String(currentTime.getMonth() + 1).padStart(2, '0');
    const day = String(currentTime.getDate()).padStart(2, '0');
    const hours = String(currentTime.getHours()).padStart(2, '0');
    const mins = String(currentTime.getMinutes()).padStart(2, '0');
    handleChange('startTime', `${year}-${month}-${day}T${hours}:${mins}`);
  };

  const adjustDuration = (increment) => {
    const change = increment ? 15 : -15;
    const newDuration = Math.max(15, formData.duration + change);
    handleChange('duration', newDuration);
  };

  const formatDisplayTime = (timeString) => {
    if (!timeString) return '00:00';
    const time = new Date(timeString);
    return time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
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
            <label>Subject Name</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => handleChange('subject', e.target.value)}
              className={errors.subject ? 'input-error' : ''}
              placeholder="Enter meeting subject"
            />
            {errors.subject && <p className="error-text">{errors.subject}</p>}
          </div>

          {/* <div className="timeline">
            {timelineData.map(({ hour, isBooked, isCurrentSlot }) => (
              <div
                key={hour}
                className={`timeline-block ${isBooked ? (isCurrentSlot ? 'current-slot' : 'booked-slot') : ''}`}
              />
            ))}
            <div className="timeline-labels">
              <span>08:00</span>
              <span>12:00</span>
              <span>18:00</span>
            </div>
          </div> */}

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
              <div className="display-time">{formData.duration} <span>min</span></div>
              <button onClick={() => adjustDuration(true)}><Plus size={16} /></button>
            </div>
            {errors.duration && <p className="error-text">{errors.duration}</p>}
          </div>

          <div className="form-group">
            <label>Booked By</label>
            <input
              type="text"
              value={formData.bookedBy}
              onChange={(e) => handleChange('bookedBy', e.target.value)}
              className={errors.bookedBy ? 'input-error' : ''}
              placeholder="Enter your name"
            />
            {errors.bookedBy && <p className="error-text">{errors.bookedBy}</p>}
          </div>

          <div className="submit-btn-wrapper">
            <button onClick={handleSubmit} className="submit-btn">Book Now</button>
          </div>

          <div className="footer-nav">
            {/* <button onClick={onClose}><Home size={16} /> <span>Home</span></button> */}
            {/* <button><span>All Meetings</span> <Calendar size={16} /></button> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
