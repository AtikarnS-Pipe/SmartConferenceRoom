import { User, Clock, Hourglass,NotepadText} from 'lucide-react';
import { useIsFullDayEvent } from '../hooks/useIsFullDayEvent.jsx';
import BookingModal from './BookingModal';
import React, { useState } from 'react';
import axios from 'axios';
import { useRoomData } from '../hooks/useRoomData';

export default function Boxdetail({ isOccupied, event, getTimeRemaining, loading, onSetBookingInProgress}) {
  const isFullDayEvent = useIsFullDayEvent();
  const [showModal, setShowModal] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const { floor, room } = useRoomData(); 
  const roomId = `${floor}${room}`;

  const handleEndMeeting = async () => {
    if (!event || !event.organizer || !event.start || !event.end) {
      alert('ไม่พบข้อมูลการประชุม');
      return;
    }

    setIsEnding(true);
    try {
      const endmeetingdata = {
        eventId : event.id,
        startdatetime: event.start.dateTime + 'Z',
        room_number: roomId,
      };
      console.log('Sending endmeeting data:', endmeetingdata);

      const response = await axios.patch('/user/endmeeting', { endmeetingdata });
      
      if (response.status === 200) {
        alert('สิ้นสุดการประชุมเรียบร้อยแล้ว');
      }
    } catch (error) {
      console.error('Error ending meeting:', error);
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
                  <NotepadText size={30} /> Subject :
                </span>
                <span className="detail-value">
                  {event.subject}
                </span>
              </div>
            </div>

            {/* ✅ Organizer */}
            <div style={{ marginBottom: "10px" }} className="detail-row">
              <span className="detail-label">
                <User size={30} /> Organizer :
              </span>
              <span className="detail-value">
                {event.organizer.emailAddress.name}
              </span>
            </div>

            {/* ✅ Time */}
            <div style={{ marginBottom: "10px" }} className="detail-row">
              <span className="detail-label">
                <Clock size={30} /> Time :
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
            <button
              className="book-next-button"
              onClick={() => {
                onSetBookingInProgress?.(true);
                setShowModal(true);
              }}
            >
              Book Next Slot
            </button>
          </div>
        </div>
      ) : (
        <div className="box-detail available">
          <div className="detail-content available">
            <div>( The room is currently available )</div>
            <button
              className="pin-button"
              onClick={() => {
                onSetBookingInProgress?.(true);
                setShowModal(true);
              }}
            >
              <span className="pin-text">Book Now</span>
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <BookingModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            onSetBookingInProgress?.(false);
          }}
          onSubmit={() => { }}
          event
        />
      )}
    </>
  );
}
