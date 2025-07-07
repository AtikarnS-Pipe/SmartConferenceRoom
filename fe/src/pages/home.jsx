import { useState } from 'react'
//content
import DateTimeDisplay from '../components/date&time'
import Lightcontainer from '../components/light-container'
import StatusIndicator from '../components/StatusIndicator'
import Boxdetail from '../components/Box-Detail'
import Roomnumber from '../components/Room-number'
import TimeSchedule from '../components/Time-Schedule'
import ZoomControl from '../components/ZoomControl'
//hooks
import { useCurrentEvent } from '../hooks/useCurrentEvent'; 
import { useRoomData } from '../hooks/useRoomData'  
import { getTimeRemaining } from '../hooks/useTimeRemaining'
import { useCurrentTime } from '../hooks/useCurrentTime';
import { useEvents } from '../hooks/useEvents';
import PinPopupManager from '../hooks/usePinPopupManager';
import StaffPinPopupManager from '../hooks/useStaffPinPopupManager'

function Home() {
  // const token = useSocket();
  const { floor, room, capacity } = useRoomData();
  const { events, loading } = useEvents( floor, room);
  const {currentEvent,isOccupied } = useCurrentEvent(events);
  const currentTime = useCurrentTime()
  const [zoomLevel, setZoomLevel] = useState(1);
  const [closeUserPin, setCloseUserPin] = useState(false);

  const handleCloseUserPin = () => {
    setCloseUserPin(true);
    setTimeout(() => setCloseUserPin(false), 100); // reset trigger
  };

  return (
    <div className="container">
      <div className={`main-container ${isOccupied ? 'occupied' : 'available'}`}>
        <Lightcontainer isOccupied={isOccupied} floor={floor} room={room}/>
        <div className="content-wrapper">
          <div className="header-section">
            <div className="left-section">
              <StatusIndicator isOccupied={isOccupied}/>
              <div className="clock-container">
                <DateTimeDisplay/>
              </div>
            </div>
            
            <div className="right-section">
              <Roomnumber floor={floor} room={room} capacity={capacity}/>
            </div>
          </div>
          
          {/* detail */}
          <div className="main-section">
            <Boxdetail isOccupied={isOccupied} event={currentEvent} getTimeRemaining={getTimeRemaining} loading={loading} />
          </div>
          
          {/* schedule */}
          <div className="schedule-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 className="schedule-heading">Today's Schedule</h1>
            <ZoomControl zoomLevel={zoomLevel} setZoomLevel={setZoomLevel} />
            </div>
            <div className="schedule-container">
              <TimeSchedule currentTime={currentTime} events={events} zoomLevel={zoomLevel} setZoomLevel={setZoomLevel} />
            </div>
            {/* <p className = 'touchscreen'>#Touch‑Supported</p> */}
          </div>
        </div>
      </div>

      {/* popup */}
      <PinPopupManager events={events} closeSignal={closeUserPin} />
      <StaffPinPopupManager showTestButton closeUserPinPopup={handleCloseUserPin} />
    </div>
  )
}

export default Home
