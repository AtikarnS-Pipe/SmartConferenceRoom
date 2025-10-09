import { useEffect, useRef } from "react";
import { useCurrentEvent } from "./useCurrentEvent";
import { useRoomData } from "./useRoomData";

export function useCloseDoor(events) {
  const { isOccupied } = useCurrentEvent(events);
  const { floor, room } = useRoomData();
  const roomId = `${floor}${room}`;
  const prevIsOccupied = useRef(false);
  const currentEventId = useRef(null);

  useEffect(() => {
    if (!roomId || !events?.length) return;

    // หา event ปัจจุบัน
    const now = new Date();
    const utcString = now.toISOString();
    const activeEvent = events.find((event) => {
      const start = event.start.dateTime;
      const end = event.end.dateTime;
      return utcString >= start && utcString <= end;
    });

    const newEventId = activeEvent?.id;

    // กรณี 1: Event สิ้นสุดและไม่มี event ถัดไป (ปิดประตู)
    if (prevIsOccupied.current === true && isOccupied === false) {
      console.log("Event ended, no next event — closing door");
      notifyCloseDoor(roomId);
    }

    // กรณี 2: Event เปลี่ยน (แม้จะติดกัน) - ล็อคประตูระหว่างเปลี่ยน
    else if (currentEventId.current && newEventId &&currentEventId.current !== newEventId) {
      console.log("Event changed — locking door between events");
      notifyCloseDoor(roomId);
    }

    prevIsOccupied.current = isOccupied;
    currentEventId.current = newEventId;
  }, [isOccupied, roomId, events]);

  const notifyCloseDoor = async (roomId) => {
    try {
      const res = await fetch("/api2/user/closedoor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room_number: roomId }),
      });

      const result = await res.json();
      console.log("Close door response:", result);
    } catch (error) {
      console.error("Error closing door:", error);
    }
  };
}
