import { useState, useEffect, use } from "react";

export function useCurrentEvent(events) {
  const [currentEvent, setCurrentEvent] = useState(null);
  const [isOccupied, setIsOccupied] = useState(false);
  const [nextBooking, setNextBooking] = useState(null);
  const [canEarlyAccess, setCanEarlyAccess] = useState(false);

  useEffect(() => {
    const checkCurrentEvent = () => {
      const now = new Date();
      const utcString = now.toISOString(); //แปลงเป็น UTC string

      if (!events || !Array.isArray(events)) {
        console.log("Events data is not available yet or not an array");
        return;
      }

      // หา event ที่กำลังเกิดขึ้น (ปกติ)
      const ongoing = events.find((event) => {
        const start = event.start.dateTime;
        const end = event.end.dateTime;
        return utcString >= start && utcString <= end;
      });

      // หา next booking (สำหรับ Early Access)
      const upcomingEvents = events
        .filter((event) => {
          const start = event.start.dateTime;
          return utcString < start; // event ที่ยังไม่เริ่ม
        })
        .sort((a, b) => a.start.dateTime.localeCompare(b.start.dateTime));

      const nextEvent = upcomingEvents[0] || null;

      // console.log('=== useCurrentEvent Debug ===');
      // console.log('Current time UTC:', utcString);
      // console.log('All events count:', events.length);
      // console.log('All events:', events.map(e => ({
      //   subject: e.subject,
      //   start: e.start.dateTime,
      //   end: e.end.dateTime
      // })));
      // console.log('Upcoming events count:', upcomingEvents.length);
      console.log("Next event:", nextEvent);

      // ตรวจสอบว่า next event อยู่ในช่วง Early Access (15 นาทีก่อน) หรือไม่
      let canEarlyAccessResult = false;
      if (nextEvent) {
        const eventStart = new Date(nextEvent.start.dateTime + "Z");
        const timeDiff = eventStart.getTime() - now.getTime();
        const totalSeconds = Math.floor(timeDiff / 1000);

        // console.log('Event start time:', eventStart.toISOString());
        // console.log('Total seconds until start:', totalSeconds);

        // ถ้าเหลือเวลาไม่เกิน 15 นาที (900 วินาที) และไม่เกินเวลาแล้ว
        if (totalSeconds <= 900 && totalSeconds >= 0) {
          // ตรวจสอบว่าไม่มีการจองติดกันก่อนหน้า
          if (!events || events.length === 0) {
            canEarlyAccessResult = true;
          } else {
            const previousBooking = events
              .filter((e) => new Date(e.end.dateTime + "Z") <= eventStart)
              .sort(
                (a, b) =>
                  new Date(b.end.dateTime + "Z") -
                  new Date(a.end.dateTime + "Z")
              )[0];

            if (previousBooking) {
              const previousEndTime = new Date(
                previousBooking.end.dateTime + "Z"
              );
              const gapMinutes = Math.floor(
                (eventStart.getTime() - previousEndTime.getTime()) / (1000 * 60)
              );

              // ถ้ามี gap น้อยกว่า 15 นาที แสดงว่ามีการจองติดกัน
              canEarlyAccessResult = gapMinutes >= 15;
            } else {
              canEarlyAccessResult = true;
            }
          }
        }
        console.log("Can early access:", canEarlyAccessResult);
      }

      setCurrentEvent(ongoing || null);
      setNextBooking(nextEvent);
      setIsOccupied(!!ongoing);
      setCanEarlyAccess(canEarlyAccessResult);
    };

    checkCurrentEvent();
    const interval = setInterval(checkCurrentEvent, 1000);

    return () => clearInterval(interval);
  }, [events]);

  return { currentEvent, isOccupied, nextBooking, canEarlyAccess };
}
