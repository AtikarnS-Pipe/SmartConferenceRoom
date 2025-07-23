import { User, Clock, NotepadText, Check, X} from 'lucide-react';
import { useIsFullDayEvent } from '../hooks/useIsFullDayEvent.jsx';
import BookingModal from './BookingModal';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRoomData } from '../hooks/useRoomData';

export default function Boxdetail({ isOccupied, event, getTimeRemaining, loading, onSetBookingInProgress}) {
  const isFullDayEvent = useIsFullDayEvent();
  const [showModal, setShowModal] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [showEndConfirmModal, setShowEndConfirmModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const { floor, room } = useRoomData(); 
  const roomId = `${floor}${room}`;

// ปิด EndConfirmModal อัตโนมัติใน 30 วิ
useEffect(() => {
  if (!showEndConfirmModal) return;
  const timeoutId = setTimeout(() => {
    setShowEndConfirmModal(false);
  }, 30000); // 30 วินาที

  return () => clearTimeout(timeoutId);
}, [showEndConfirmModal]);

// ปิด ResultModal อัตโนมัติใน 30 วิ
useEffect(() => {
if (!showResultModal) return;
const timeoutId = setTimeout(() => {
  setShowResultModal(false);
}, 30000);

return () => clearTimeout(timeoutId);
}, [showResultModal]);

  const handleEndMeeting = async () => {
    setIsEnding(true);
    try {
      const endmeetingdata = {
        eventId : event.id,
        startdatetime: event.start.dateTime + 'Z',
        room_number: roomId,
        isAllDay : event.isAllDay,
      };
      console.log('Sending endmeeting data:', endmeetingdata);

      const response = await axios.patch('/user/endmeeting', { endmeetingdata });
      
      if (response.status === 200) {
        setIsSuccess(true);
        setResultMessage('Meeting ended successfully!');
        setShowEndConfirmModal(false);
        setShowResultModal(true);
      }
    } catch (error) {
      console.error('Error ending meeting:', error);
      setIsSuccess(false);
      setResultMessage(`Failed to end meeting.`);
      console.log(`Failed to end meeting: ${error.response?.data?.error || error.message}`);
      setShowEndConfirmModal(false);
      setShowResultModal(true);
    } finally {
      setIsEnding(false);
    }
  };

  // Function เพื่อเปิด confirmation modal
  const handleEndButtonClick = () => {
    setShowEndConfirmModal(true);
  };

  // End Confirmation Modal Component ***************
  const EndConfirmModal = () => (
   <div className="modal-overlay" style={{ zIndex: 3 }}>
    <div className="modal-container" style={{
      maxWidth: '400px',
      borderRadius: '1rem',
      backgroundColor: 'white',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
    }}>
      <div className="modal-header" style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: '#fecaca',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem auto',
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#DC2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '24px',
            fontWeight: 'bold'
          }}>
            !
          </div>
        </div>

        <h2 style={{
          color: '#ffffffff',
          fontSize: '2rem',
          fontWeight: 'bold',
          margin: '0 0 0.5rem 0'
        }}>
          End Meeting?
        </h2>
      </div>

      <div className="modal-body" style={{ textAlign: 'center' }}>
        <p style={{
          marginBottom: '0.5rem',
          color: '#6B7280',
          fontSize: '1.125rem',
          lineHeight: '1.5'
        }}>
          Are you sure you want to end this meeting?
        </p>
        <p style={{
          marginBottom: '1.5rem',
          color: '#9CA3AF',
          fontSize: '1rem'
        }}>
          This action cannot be undone.
        </p>

        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setShowEndConfirmModal(false)}
            style={{
              padding: '0.75rem 2rem',
              backgroundColor: '#E5E7EB',
              color: '#374151',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1.125rem',
              fontWeight: '500',
              fontFamily: 'kanit',
              cursor: 'pointer',
              minWidth: '120px'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#D1D5DB';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#E5E7EB';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            Keep Meeting
          </button>
          <button
            onClick={handleEndMeeting}
            disabled={isEnding}
            style={{
              padding: '0.75rem 2rem',
              backgroundColor: isEnding ? '#FCA5A5' : '#EF4444',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1.125rem',
              fontWeight: '500',
              fontFamily: 'kanit',
              cursor: isEnding ? 'not-allowed' : 'pointer',
              minWidth: '120px',
              opacity: isEnding ? 0.6 : 1
            }}
            onMouseOver={(e) => {
              if (!isEnding) {
                e.target.style.backgroundColor = '#DC2626';
                e.target.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseOut={(e) => {
              if (!isEnding) {
                e.target.style.backgroundColor = '#EF4444';
                e.target.style.transform = 'translateY(0)';
              }
            }}
          >
            {isEnding ? (
              <span>
                Ending
                <span
                  style={{
                    display: 'inline-block',
                    animation: 'dots 1.4s infinite',
                    fontSize: 'inherit'
                  }}
                >
                  ...
                </span>
              </span>
            ) : (
              'Yes, End'
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes dots {
          0%, 20% {
            color: transparent;
            text-shadow: 
              0.25em 0 0 transparent,
              0.5em 0 0 transparent;
          }
          40% {
            color: currentColor;
            text-shadow: 
              0.25em 0 0 transparent,
              0.5em 0 0 transparent;
          }
          60% {
            text-shadow: 
              0.25em 0 0 currentColor,
              0.5em 0 0 transparent;
          }
          80%, 100% {
            text-shadow: 
              0.25em 0 0 currentColor,
              0.5em 0 0 currentColor;
          }
        }
      `}</style>
    </div>
  </div>
);

  // Result Modal Component ***************
  const ResultModal = () => (
    <div className="modal-overlay" style={{ zIndex: 3 }}>
      <div className="modal-container" style={{
        maxWidth: '400px',
        borderRadius: '1rem',
        backgroundColor: 'white',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        <div className="modal-header" style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: isSuccess ? '#dcfce7' : '#fecaca',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem auto',
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: isSuccess ? '#16a34a' : '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '24px',
              fontWeight: 'bold'
            }}>
              {isSuccess ? <Check/> : <X />}
            </div>
          </div>

          <h2 style={{
            color: '#ffffffff',
            fontSize: '2rem',
            fontWeight: 'bold',
            margin: '0 0 0.5rem 0'
          }}>
            {isSuccess ? 'Success!' : 'Error!'}
          </h2>
        </div>

        <div className="modal-body" style={{ textAlign: 'center' }}>
          <p style={{
            marginBottom: '2rem',
            color: '#6B7280',
            fontSize: '1.25rem',
            lineHeight: '1.5'
          }}>
            {resultMessage}
          </p>

          <button
            onClick={() => setShowResultModal(false)}
            style={{
              padding: '0.75rem 2rem',
              backgroundColor: isSuccess ? '#16a34a' : '#EF4444',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1.125rem',
              fontWeight: '500',
              fontFamily: 'kanit',
              cursor: 'pointer',
              minWidth: '120px'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = isSuccess ? '#15803d' : '#DC2626';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = isSuccess ? '#16a34a' : '#EF4444';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );

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
            <div style={{ marginBottom: "10px" }} className="detail-row flex-row-between">
              <div className="detail-row-left">
                <span className="detail-label">
                  <User size={30} /> Organizer :
                </span>
                <span className="detail-value">
                  {event.organizer.emailAddress.name}
                </span>
              </div>
            </div>

            {/* ✅ Time */}
            <div style={{ marginBottom: "10px" }} className="detail-row flex-row-between">
              <div className="detail-row-left">
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
          </div>
          <div className="box-detail-action-buttons">
            <button 
              className="end-button" 
              onClick={handleEndButtonClick}
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

      {showEndConfirmModal && <EndConfirmModal />}
      {showResultModal && <ResultModal />}
    </>
  );
}
