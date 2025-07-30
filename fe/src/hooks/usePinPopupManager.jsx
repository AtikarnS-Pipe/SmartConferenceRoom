import React, { useEffect, useState } from 'react';
import PinPopup from '../components/PinPopup';
import { useCurrentEvent } from './useCurrentEvent';
import { useRoomData } from './useRoomData';

const PinPopupManager = ({ events, onPinSuccess, closeSignal, bookingInProgress }) => {
  const { currentEvent, isOccupied } = useCurrentEvent(events);
  const { floor, room } = useRoomData();
  const roomId = `${floor}${room}`;

  const [pinVisible, setPinVisible] = useState(false);
  const [pinVerified, setPinVerified] = useState(false);
  const [error, setError] = useState('');
  const [waiting, setWaiting] = useState(false);
  const [pendingError, setPendingError] = useState('');
  const [isTemporarilyHidden, setIsTemporarilyHidden] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);

  // ฟังก์ชัน POST เช็ก PIN
  const sendPinToBackend = async ({ eventId, pin, room_number }) => {
    try {
      const res = await fetch('/user/key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, pin, room_number }),
      });
      return await res.json();
    } catch (e) {
      return { pinValid: false, error: 'Network error' };
    }
  };

  // ฟังก์ชัน DELETE ลบ event !!!!!!!ปิดก่อนเพราะยังไม่ใช้
  // const deleteEventOnBackend = async ({ eventId }) => {
  //   try {
  //     const res = await fetch('/user/ms/delete', {
  //       method: 'DELETE',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ eventId }),
  //     });
  //     return await res.json();
  //   } catch (e) {
  //     return { success: false, error: 'Network error' };
  //   }
  // };

  // รีเซ็ตสถานะทั้งหมด
  const resetAllStates = () => {
    setPinVisible(false);
    setPinVerified(false);
    setError('');
    setIsTemporarilyHidden(false);
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
  };

  // จัดการ timeout 15 นาทีของ event
  useEffect(() => {
    if (!currentEvent || pinVerified) return;

    const start = new Date(currentEvent.start.dateTime + 'Z');
    const now = new Date();
    const msSinceStart = now - start;
    const deadline = 15 * 60 * 1000;

    // ถ้าเลยเวลาแล้ว ลบทันที
    if (msSinceStart >= deadline) {
      deleteEventOnBackend({ eventId: currentEvent.id });
      resetAllStates();
      return;
    }

    // ยังไม่ครบ 15 นาที: ตั้ง timeout
    const id = setTimeout(() => {
      deleteEventOnBackend({ eventId: currentEvent.id });
      resetAllStates();
    }, deadline - msSinceStart);

    setTimeoutId(id);
    return () => clearTimeout(id);
  }, [currentEvent, pinVerified]);

  // จัดการ closeSignal และการกลับมาแสดง popup
  useEffect(() => {
    if (closeSignal) {
      setPinVisible(false);
      setIsTemporarilyHidden(true);
    }

    if (!closeSignal && isTemporarilyHidden && currentEvent && !pinVerified) {
      const start = new Date(currentEvent.start.dateTime + 'Z');
      const now = new Date();
      const deadline = 15 * 60 * 1000;

      if (now - start < deadline) {
        setPinVisible(true);
        setIsTemporarilyHidden(false);
      } else {
        deleteEventOnBackend({ eventId: currentEvent.id });
        resetAllStates();
      }
    }
  }, [closeSignal, isTemporarilyHidden, currentEvent, pinVerified]);

  // ควบคุมการแสดง popup ตามสถานะห้อง
  useEffect(() => {
    if (isOccupied && !pinVerified && !bookingInProgress && !isTemporarilyHidden) {
      setPinVisible(true);
    } else if (!isOccupied) {
      resetAllStates();
    }
  }, [isOccupied, pinVerified, bookingInProgress, isTemporarilyHidden]);

  // ฟังก์ชันการ submit PIN
  const handlePinSubmit = async (pin) => {
    if (!currentEvent) return;
    setWaiting(true);
    setError('');

    const result = await sendPinToBackend({
      eventId: currentEvent.id,
      pin,
      room_number: roomId,
    });

    setWaiting(false);

    if (result.pinValid) {
      setPinVerified(true);
      setPendingError('Correct password');
      setTimeout(() => {
        setPinVisible(false);
        setError('');
        setPendingError('');
      }, 1200);
      onPinSuccess?.(pin);
    } else {
      setPendingError('Incorrect password');
    }
  };

  // แสดง error หลังรอผล
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
