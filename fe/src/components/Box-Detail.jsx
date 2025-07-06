import Organizer from '../icons/Organizer.svg';
import Time from '../icons/Time.svg';
import TimeRemaining from '../icons/Time-remaining.svg';
import { useIsFullDayEvent } from '../hooks/useIsFullDayEvent.jsx';
import React, { useState } from 'react';
import BookingModal from './BookingModal';

function BookingModalTrigger() {
  const [showModal, setShowModal] = useState(false);
  return (
    <div className="box-detail available">
      <div className="detail-content available">
        <div>( The room is currently available )</div>
        <button className="pin-button" onClick={() => setShowModal(true)}>
          <span className="pin-text">Book Now</span>
        </button>
        {showModal && (
          <BookingModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            roomName={''}
            onSubmit={() => { }}
          />    
        )}
      </div>
    </div>
  );
}

export default function Boxdetail({ isOccupied, event, getTimeRemaining, loading }) {
  const isFullDayEvent = useIsFullDayEvent();
  if (loading) {
    return (
      <div className="box-detail">
        <div className="detail-content loading">loading...</div>
      </div>
    );
  }
  if (isOccupied) {
    return (
      <div className="box-detail occupied">
        <div className="detail-content occupied">
          <div style={{ marginBottom: "10px" }} className="detail-row">
            <span className="detail-label">
              <img src={Organizer} alt="Organizer" />
              Organizer :
            </span>
            <span className="detail-value">
              {event.organizer.emailAddress.name}
            </span>
          </div>
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
          <div className="detail-row">
            <span className="detail-label">
              <img style={{ width: '28px', height: '28px' }} src={TimeRemaining} alt="Time-Remaining" />
              Time-Remaining :
            </span>
            <span className="detail-value">
              {getTimeRemaining(event)}
            </span>
          </div>
        </div>
      </div>
    );
  }
  // Available state with modal trigger
  return <BookingModalTrigger />;
}


