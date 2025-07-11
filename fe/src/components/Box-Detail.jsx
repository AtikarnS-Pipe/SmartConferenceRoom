import Organizer from '../icons/Organizer.svg';
import Time from '../icons/Time.svg';
import TimeRemaining from '../icons/Time-remaining.svg';
import { useIsFullDayEvent } from '../hooks/useIsFullDayEvent.jsx';
import { useRoomData } from '../hooks/useRoomData';
import React, { useState } from 'react';
import BookingModal from './BookingModal';
import axios from 'axios';

export default function Boxdetail({ isOccupied, event, getTimeRemaining, loading }) {
  const isFullDayEvent = useIsFullDayEvent();
  const [showModal, setShowModal] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const { floor, room } = useRoomData();
  const roomNumber = `${floor}${room}`;

  const handleEndMeeting = async () => {
    if (!event || !event.organizer || !event.start || !event.end) {
      alert('ไม่พบข้อมูลการประชุม');
      return;
    }

    setIsEnding(true);
    try {
      const endmeetingdata = {
        RoomNumber: roomNumber,
        email: event.organizer.emailAddress.address,
        startdatetime: event.start.dateTime,
        enddatetime: event.end.dateTime
      };
      console.log('Sending endmeeting data:', endmeetingdata);

      const response = await axios.patch('/user/endmeeting', { endmeetingdata });
      
      if (response.status === 200) {
        alert('สิ้นสุดการประชุมเรียบร้อยแล้ว');
        // อาจจะต้อง refresh หรือ update state
      }
    } catch (error) {
      console.error('Error ending meeting:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      alert(`เกิดข้อผิดพลาดในการสิ้นสุดการประชุม: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsEnding(false);
    }
  };

  if (loading) {
    return (
      <div className="box-detail">
        <div className="detail-content loading">loading...</div>
      </div>
    );
  }

  return (
    <>
      {isOccupied ? (
        <div className="box-detail occupied">
          <div className="detail-content occupied">
            {/* ✅ Subject */}
            <div className="detail-row flex-row-between">
              <div className="detail-row-left">
                <span className="detail-label">
                  <img src={Organizer} alt="Organizer" />
                  Subject :
                </span>
                <span className="detail-value">
                  {event.subject}
                </span>
              </div>
            </div>

            {/* ✅ Organizer */}
            <div style={{ marginBottom: "10px" }} className="detail-row">
              <span className="detail-label">
                <img src={Organizer} alt="Organizer" />
                Organizer :
              </span>
              <span className="detail-value">
                {event.organizer.emailAddress.name}
              </span>
            </div>

            {/* ✅ Time */}
            <div style={{ marginBottom: "10px" }} className="detail-row">
              <span className="detail-label">
                <img src={Time} alt="Time" />
                Time :
              </span>
              <span className="time-value">
                {isFullDayEvent(event)
                  ? 'Full day'
                  : `${new Date(event.start.dateTime + 'Z').toLocaleTimeString('en-US', {
                      timeZone: 'Asia/Bangkok',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })} - ${new Date(event.end.dateTime + 'Z').toLocaleTimeString('en-US', {
                      timeZone: 'Asia/Bangkok',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}`
                }
              </span>
            </div>
          </div>
          <div className="box-detail-action-buttons">
            <button 
              className="end-button" 
              onClick={handleEndMeeting}
              disabled={isEnding}
            >
              {isEnding ? 'Ending...' : 'End'}
            </button>
            <button className="book-next-button" onClick={() => setShowModal(true)}>Book Next</button>
          </div>

          {/* ถ้าจะใช้ Time Remaining เปิดได้ */}
          
          {/* <div className="detail-row-time-remaining highlight">
            <span className="detail-label highlight">
              <img src={TimeRemaining} alt="Time Remaining" />
              Time-Remaining :
            </span>
            <span className="detail-value highlight">
              {getTimeRemaining(event)}
            </span>
          </div> */}
        </div>
      ) : (
        <div className="box-detail available">
          <div className="detail-content available">
            <div>( The room is currently available )</div>
            <button className="pin-button" onClick={() => setShowModal(true)}>
              <span className="pin-text">Book Now</span>
            </button>
          </div>
        </div>
      )}

      {/* ✅ ใช้ BookingModal ร่วมกัน */}
      {showModal && (
        <BookingModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          roomName={''}
          onSubmit={() => { }}
        />
      )}
    </>
  );
}
