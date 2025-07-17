import { useEffect, useRef } from 'react';
import { useCurrentEvent } from './useCurrentEvent';
import { useRoomData } from './useRoomData';

export function useCloseDoor(events) {
  const { isOccupied } = useCurrentEvent(events);
  const { floor,room } = useRoomData(); 
  const roomId = `${floor}${room}`;
  const prevIsOccupied = useRef(false);
  
  useEffect(() => {
    console.log("Pre:", prevIsOccupied.current, "isoccupied", isOccupied, room);
}, [isOccupied, roomId]); 
  

  useEffect(() => {
    if (!roomId) return;

    // เช็คว่า event สิ้นสุด (เปลี่ยนจาก true -> false)
    if (prevIsOccupied.current === true && isOccupied === false) {
      console.log("Event ended — closing door");
      notifyCloseDoor(roomId);
    }

    prevIsOccupied.current = isOccupied;
  }, [isOccupied, room]);

  const notifyCloseDoor = async (roomId) => {
    try {
      const res = await fetch('/user/closedoor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_number: roomId }),
      });

      const result = await res.json();
      console.log('Close door response:', result);
    } catch (error) {
      console.error('Error closing door:', error);
    }
  };
}


