import React, { useEffect, useState } from 'react';
import PinPopup from '../components/PinPopup'; // ไฟล์นี้คือ component ที่คุณให้มา
import { useCurrentEvent } from './useCurrentEvent'; // hook แยก

const PinPopupManager = ({ events, onPinSuccess }) => {
  const { currentEvent, isOccupied } = useCurrentEvent(events);
  const [pinVisible, setPinVisible] = useState(false);
  const [pinVerified, setPinVerified] = useState(false);
  const [error, setError] = useState('');
  const [pinTimeout, setPinTimeout] = useState(null);
  const [waiting, setWaiting] = useState(false);
  const [pendingError, setPendingError] = useState('');
  // const roomId = `${floor}${room}`;
 
  //log evnetId
  // if (currentEvent) {
  //   const eventId = currentEvent.id;
  //   console.log(eventId);
  // }


  //ส่ง pin ไปให้ backend เเละรอ json กลับมา
  const sendPinToBackend = async ({ eventId , pin }) => {
    console.log('pin:',pin);
    console.log('eventId:',eventId);
    try {
      const res = await fetch('http://localhost:4000/user/key', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, pin }),
      });
      return await res.json();
      // const yang = await res.json();
      // console.log(yang);
      // return yang;
    } catch (e) {
      return { pinCorrect: false, error: 'Network error' };
    }
  };


  // MOCK: delay 2 วินาที เพื่อให้เห็นสถานะ checking
  //   await new Promise(res => setTimeout(res, 2000));
  //   // MOCK: ตอบกลับเหมือน backend จริง
  //   // if (expired) return { pinCorrect: false, expired: true };
  //   if (pin === '1234') return { pinCorrect: true };
  //   return { pinCorrect: false };
  // };


  // ฟังก์ชัน: ลบ event เมื่อ timeout (method DELETE)
  const deleteEventOnBackend = async ({ eventId }) => {
    try {
      const res = await fetch('http://localhost:4000/user/key', { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: 'Network error' };
    }
  };

  // 15-min timeout พร้อมกับเรียก fn deleteEventOnBackend
  useEffect(() => {
    if (currentEvent && pinVisible && !pinVerified) {
      // คำนวณเวลาที่เหลือจนถึง 15 นาทีหลัง event เริ่ม
      const start = new Date(currentEvent.start.dateTime + 'Z');
      const now = new Date();
      const msSinceStart = now - start;
      const msToTimeout = Math.max(0, 360 * 60 * 1000 - msSinceStart);
      if (pinTimeout) clearTimeout(pinTimeout);
      const timeout = setTimeout(async () => {
        // เรียก DELETE ไป backend เมื่อครบ 15 นาที
        await deleteEventOnBackend({ //await รอให้deleteEventOnbackend ทำเสร็จก่อน
          eventId: currentEvent.roomId
        });
        setPinVisible(false);
        setError('');
      }, msToTimeout);
      setPinTimeout(timeout);
      return () => clearTimeout(timeout);
    } else if (!pinVisible && pinTimeout) {
      clearTimeout(pinTimeout);
    }
  }, [currentEvent, pinVisible, pinVerified]);

  //เปิดปิด pinpopup
  useEffect(() => {
    if (isOccupied && !pinVerified) {
      setPinVisible(true);
    } else if (!isOccupied) {
      setPinVisible(false);
      setPinVerified(false); // reset เมื่อตารางหมด
      setError('');
    }
  }, [isOccupied, pinVerified]);

  //รับ pin เเละเรียก fn sendPinToBackend
  const handlePinSubmit = async (pin) => {
    if (!currentEvent) return;
    setWaiting(true);
    setError(''); // clear error ทันทีที่เริ่ม checking
    const result = await sendPinToBackend({
      eventId: currentEvent.id,
      pin: pin,
    });
    setWaiting(false);
    // เก็บ pending error ไว้ก่อน
    if (result.pinValid) {
      setPinVerified(true);
      setPendingError('Correct password');
      setTimeout(() => {
        setPinVisible(false);
        setError('');
        setPendingError('');
      }, 1200);
      onPinSuccess?.(pin); // optional callback
    } else {
      setPendingError('Incorrect password');
    }
  };

  useEffect(() => {
    if (!waiting && pendingError) {
      setError(pendingError);
      setPendingError('');
    }
  }, [waiting, pendingError]);

  return (
    <>
      {pinVisible && (
        <PinPopup onSubmit={handlePinSubmit} error={error} waiting={waiting} />
      )}
    </>
  );
};

export default PinPopupManager;
