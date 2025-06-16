import Title from '../icons/Title.svg'
import Organizer from '../icons/Organizer.svg'
import Time from '../icons/Time.svg'
import TimeRemaining from '../icons/Time-remaining.svg' 

export default function Boxdetail ({ isOccupied, event, getTimeRemaining, loading }){
  
    return (
        <div className={`box-detail ${isOccupied ? 'occupied' : 'available'}`}>
          {loading ? (
            <div className="detail-content loading">
              loading...
            </div>
          ) : isOccupied ? (
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
                <span  className="detail-label">
                  <img src={Time} alt="Time" />
                  Time :
                </span>
                <span  className="time-value">
                {new Date(event.start.dateTime + 'Z').toLocaleTimeString('en-US', {
                  timeZone: 'Asia/Bangkok',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })}
                {' - '}
                {new Date(event.end.dateTime + 'Z').toLocaleTimeString('en-US', {
                  timeZone: 'Asia/Bangkok',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">
                  <img style={{width: '28px', height: '28px'}} src={TimeRemaining} alt="Time-Remaining" />
                  Time-Remaining :
                </span>
                <span className="detail-value">
                  {getTimeRemaining(event)}
                </span>
              </div>
            </div>
          ) : (
            <div className="detail-content available">
              ( The room is currently available )
            </div>
          )}
        </div>
      );
    }
