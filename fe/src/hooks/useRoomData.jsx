import { useLocation } from 'react-router-dom';

const roomCapacities = {
  '01': 4,
  '02': 4,
  '03': 4,
  '04': 4,
  '05': 6,
  '06': 6,
  '14': 10,
  '15': 10,
  '19': 4,
  '20': 4,
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