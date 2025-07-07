import { useState, useEffect } from 'react';

export function useCurrentEvent(events) {
  const [currentEvent, setCurrentEvent] = useState(null);
  const [isOccupied, setIsOccupied] = useState(false);

  useEffect(() => {
    const checkCurrentEvent = () => {
      const now = new Date();
      const utcString = now.toISOString(); //เเปลงเป็น UTC string

      if (!events || !Array.isArray(events)) {
        console.log("Events data is not available yet or not an array");
        return;
      }

      const ongoing = events.find((event) => {
        const start = event.start.dateTime;
        const end = event.end.dateTime;
        return utcString >= start && utcString <= end;
      });

      setCurrentEvent(ongoing || null);
      setIsOccupied(!!ongoing);
      // setIsOccupied(!!ongoing); 
    };

    checkCurrentEvent();
    const interval = setInterval(checkCurrentEvent, 1000);

    return () => clearInterval(interval);
  }, [events]);

  return { currentEvent, isOccupied };
}