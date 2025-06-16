import checkIcon from '../icons/check.svg'
import crossIcon from '../icons/cross.svg'

export default function StatusIndicator({ isOccupied }) {
  const icon = isOccupied ? crossIcon : checkIcon;
  const text = isOccupied ? 'Occupied' : 'Available';

  return (
    <div className={`status-indicator ${isOccupied ? 'occupied' : 'available'}`}>
      <img style={{width: '50px', height: '50px'}} src={icon} alt={text} />
      <h1>{text}</h1>
    </div>
  );
}