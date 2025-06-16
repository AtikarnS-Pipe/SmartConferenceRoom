// src/hooks/useRoomData.jsx
import { useLocation } from 'react-router-dom';

const roomCapacities = {
  '01': 4,
  '02': 4,
  '03': 2,
  '04': 2,
  '05': 4,
  '06': 4,
  '14': 6,
  '15': 6,
  '19': 2,
  '20': 2,
};

function getRoomCapacity(roomNumber) {
  return roomCapacities[roomNumber] ?? null;
}

export function useRoomData() {
  const location = useLocation();
  const parts = location.pathname.split('/');
  const floor = parts[3];
  const room = parts[4];
  const capacity = getRoomCapacity(room);

  return { floor, room, capacity };
}