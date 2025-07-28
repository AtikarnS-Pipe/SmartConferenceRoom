import React, { useEffect, useState } from 'react';
import PinPopup from '../components/PinPopup'; // ไฟล์นี้คือ component ที่คุณให้มา
import { useCurrentEvent } from './useCurrentEvent'; // hook แยก
import { useRoomData } from './useRoomData';

const PinPopupManager = ({ events, onPinSuccess, closeSignal, bookingInProgress }) => {
  const { currentEvent, isOccupied } = useCurrentEvent(events);
  const [pinVisible, setPinVisible] = useState(false);
  const [pinVerified, setPinVerified] = useState(false);
  const [error, setError] = useState('');
  const [pinTimeout, setPinTimeout] = useState(null);
  const [waiting, setWaiting] = useState(false);
  const [pendingError, setPendingError] = useState('');
  const { floor, room } = useRoomData(); 
  const roomId = `${floor}${room}`;
  
//   useEffect(() => {
//   if (currentEvent) {
//     console.log(
//       'roomId:', roomId,
//       'email:', currentEvent.organizer.emailAddress.address,
//       'start:', currentEvent.start.dateTime,
//       'end:', currentEvent.end.dateTime
//     );
//   }
// }, [currentEvent, roomId]);

  //log evnetId
  // if (currentEvent) {
  //   const eventId = currentEvent.id;
  //   console.log(eventId);
  // }


  //ฟังก์ชัน: ส่ง pin ไป backend (method POST)
  const sendPinToBackend = async ({ eventId, pin, room_number}) => {
    console.log('pin:',pin);
    console.log('eventId:',eventId);
    console.log('room_number:',room_number);
    try {
      const res = await fetch('/user/key', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, pin, room_number }),
      });
      return await res.json();
      // const yang = await res.json();
      // console.log('yang',yang);
      // return yang;
    } catch (e) {
      return { pinCorrect: false, error: 'Network error' };
    }
  };

  // ฟังก์ชัน: ลบ event เมื่อ timeout (method DELETE)
  // const deleteEventOnBackend = async ({ eventId }) => {
  //   try {
  //     const res = await fetch('/user/ms/delete', { 
  //       method: 'DELETE',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ eventId }),
  //     });
  //     console.log('deleteEventOnBackend response:', res);
  //     return await res.json();
  //   } catch (e) {
  //     return { success: false, error: 'Network error' };
  //   }
  // };

  // // 15-min timeout พร้อมกับเรียก fn deleteEventOnBackend
  // useEffect(() => {
  //   if (currentEvent && pinVisible && !pinVerified) {
  //     // คำนวณเวลาที่เหลือจนถึง 15 นาทีหลัง event เริ่ม
  //     const start = new Date(currentEvent.start.dateTime + 'Z');
  //     const now = new Date();
  //     const msSinceStart = now - start;
  //     const msToTimeout = Math.max(0, 15 * 60 * 1000 - msSinceStart);
  //     if (pinTimeout) clearTimeout(pinTimeout);
  //     const timeout = setTimeout(async () => {
  //       // เรียก DELETE ไป backend เมื่อครบ 15 นาที
  //       await deleteEventOnBackend({ //await รอให้deleteEventOnbackend ทำเสร็จก่อน
  //         eventId: currentEvent.id,
  //       });
  //       setPinVisible(false);
  //       setError('');
  //     }, msToTimeout);
  //     setPinTimeout(timeout);
  //     return () => clearTimeout(timeout);
  //   } else if (!pinVisible && pinTimeout) {
  //     clearTimeout(pinTimeout);
  //   }
  // }, [currentEvent, pinVisible, pinVerified]);

  //เปิดปิด pinpopup
useEffect(() => {
  if (isOccupied && !pinVerified && !bookingInProgress) {
      setPinVisible(true);
    } else if (!isOccupied) {
      setPinVisible(false);
      setPinVerified(false); // reset เมื่อตารางหมด
      setError('');
    }
  },[isOccupied, pinVerified, bookingInProgress]);

  // เปิดหน้า pin ค้างไว้เพื่อเทส
  // useEffect(() => {
  //   setPinVisible(true);
  // }, []);

  useEffect(() => {
    if (closeSignal) {
      setPinVisible(false);
    }
  }, [closeSignal]);

  //รับ pin เเละเรียก fn sendPinToBackend
  const handlePinSubmit = async (pin) => {
    if (!currentEvent) return;
    setWaiting(true);
    setError(''); // clear error ทันทีที่เริ่ม checking
    const result = await sendPinToBackend({
      eventId: currentEvent.id,
      pin: pin,
      room_number: roomId,
    });
    setWaiting(false);
    console.log("pinValid",result.pinValid);
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
        <PinPopup 
          onSubmit={handlePinSubmit} 
          error={error} 
          waiting={waiting} 
          onClose={() => setPinVisible(false)}
          disableCountdown={true}
        />
      )}
    </>
  );
};

export default PinPopupManager;
