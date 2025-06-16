export default function LightContainer({ isOccupied }) {
  return (
    <div className="light-container">
      <div className={`light-indicator ${isOccupied ? 'occupied' : 'available'}`}></div>
    </div>
  );
}