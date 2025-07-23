import { CircleCheckBig, CircleX } from 'lucide-react';

export default function StatusIndicator({ isOccupied }) {
  const Icon = isOccupied ? CircleX : CircleCheckBig; // ใช้ตัวแปร component ไม่ใช่ JSX ทันที
  const text = isOccupied ? 'Occupied' : 'Available';

  return (
    <div className={`status-indicator ${isOccupied ? 'occupied' : 'available'}`}>
      <Icon size={50} color={isOccupied ? '#DF2121' : '#16a34a'} /> {/* สีแดง/เขียว */}
      <h1>{text}</h1>
    </div>
  );
}
