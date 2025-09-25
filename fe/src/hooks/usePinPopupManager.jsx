import React, { useEffect, useState, useRef } from "react";
import PinPopup from "../components/PinPopup";
import { useCurrentEvent } from "./useCurrentEvent";
import { useRoomData } from "./useRoomData";

const PinPopupManager = ({
  events,
  onPinSuccess,
  closeSignal,
  bookingInProgress,
}) => {
  const { currentEvent, isOccupied, nextBooking } = useCurrentEvent(events);
  const { floor, room } = useRoomData();
  const roomId = `${floor}${room}`;

  const [pinVisible, setPinVisible] = useState(false);
  const [pinVerified, setPinVerified] = useState(false);
  const [error, setError] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [pendingError, setPendingError] = useState("");
  const [isTemporarilyHidden, setIsTemporarilyHidden] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  // ✅ ใช้ useRef เพื่อเก็บ timeout reference
  const timeoutRef = useRef(null);
  const verifiedEventRef = useRef(null); // เก็บ event ID ที่ verify แล้ว

  // ฟังก์ชัน POST เช็ก PIN
  const sendPinToBackend = async ({ eventId, pin, room_number }) => {
    try {
      const res = await fetch("/api2/user/key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, pin, room_number }),
      });
      return await res.json();
    } catch (e) {
      return { pinValid: false, error: "Network error" };
    }
  };

  // ฟังก์ชัน DELETE ลบ event - ✅ เพิ่มการตรวจสอบ verified event
  const deleteEventOnBackend = async ({ eventId, room_number }) => {
    // ✅ ตรวจสอบว่า event นี้ verify แล้วหรือยัง
    if (verifiedEventRef.current === eventId) {
      console.log(`Event ${eventId} already verified, skipping delete`);
      return { success: false, reason: "already_verified" };
    }

    try {
      const res = await fetch("/api2/user/ms/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, room_number }),
      });
      console.log(`Delete event room ${room_number}`);
      return await res.json();
    } catch (e) {
      return { success: false, error: "Network error" };
    }
  };

  // ✅ ปรับปรุงฟังก์ชัน clear timeout
  const clearCurrentTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // รีเซ็ตสถานะทั้งหมด
  const resetAllStates = () => {
    setPinVisible(false);
    setPinVerified(false);
    setError("");
    setIsTemporarilyHidden(false);
    setIsExpired(true);
    clearCurrentTimeout();
  };

  
  useEffect(() => {
    // Clear timeout เดิมก่อนเสมอ
    clearCurrentTimeout();

    if (!currentEvent || pinVerified) {
      if (!currentEvent) {
        setIsExpired(false);
        verifiedEventRef.current = null; // รีเซ็ต verified event ref
      }
      return;
    }

    const start = new Date(currentEvent.start.dateTime + "Z");
    const now = new Date();
    const msSinceStart = now - start;
    const deadline = 15 * 60 * 1000;

    // ถ้าเลยเวลาแล้ว ลบทันที
    if (msSinceStart >= deadline) {
      deleteEventOnBackend({ eventId: currentEvent.id, room_number: roomId });
      resetAllStates();
      return;
    }

    // รีเซ็ตสถานะ expired ถ้ายังไม่เลยเวลา
    setIsExpired(false);

    // ✅ ตั้ง timeout ใหม่และเก็บ reference
    timeoutRef.current = setTimeout(() => {
      // ✅ ตรวจสอบอีกครั้งก่อนลบ
      if (!pinVerified && verifiedEventRef.current !== currentEvent.id) {
        deleteEventOnBackend({ eventId: currentEvent.id, room_number: roomId });
        resetAllStates();
      }
    }, deadline - msSinceStart);

    // ✅ Cleanup function
    return () => clearCurrentTimeout();
  }, [currentEvent, pinVerified, roomId]);

  // closeSignal
  useEffect(() => {
    if (closeSignal) {
      setPinVisible(false);
      setIsTemporarilyHidden(true);
    }

    if (
      !closeSignal &&
      isTemporarilyHidden &&
      currentEvent &&
      !pinVerified &&
      !isExpired
    ) {
      const start = new Date(currentEvent.start.dateTime + "Z");
      const now = new Date();
      const deadline = 15 * 60 * 1000;

      if (now - start < deadline) {
        setPinVisible(true);
        setIsTemporarilyHidden(false);
      } else {
        // ตรวจสอบก่อนลบ
        if (verifiedEventRef.current !== currentEvent.id) {
          deleteEventOnBackend({
            eventId: currentEvent.id,
            room_number: roomId,
          });
          resetAllStates();
        }
      }
    }
  }, [
    closeSignal,
    isTemporarilyHidden,
    currentEvent,
    pinVerified,
    isExpired,
    roomId,
  ]);

  // ควบคุมการแสดง popup ตามสถานะห้อง
  useEffect(() => {
    if (
      isOccupied &&
      !pinVerified &&
      !bookingInProgress &&
      !isTemporarilyHidden &&
      !isExpired
    ) {
      if (currentEvent) {
        const start = new Date(currentEvent.start.dateTime + "Z");
        const now = new Date();
        const msSinceStart = now - start;
        const deadline = 15 * 60 * 1000;

        if (msSinceStart < deadline) {
          setPinVisible(true);
        } else {
          resetAllStates();
        }
      }
    } else if (!isOccupied) {
      resetAllStates();
    }
  }, [
    isOccupied,
    pinVerified,
    bookingInProgress,
    isTemporarilyHidden,
    isExpired,
    currentEvent,
  ]);

  // ✅ ปรับปรุงฟังก์ชันการ submit PIN
  const handlePinSubmit = async (pin) => {
    if (!currentEvent) return;
    setWaiting(true);
    setError("");

    const result = await sendPinToBackend({
      eventId: currentEvent.id,
      pin,
      room_number: roomId,
    });

    setWaiting(false);

    if (result.pinValid) {
      // ✅ บันทึก event ID ที่ verify สำเร็จ
      verifiedEventRef.current = currentEvent.id;

      // ✅ Clear timeout ทันทีเมื่อ verify สำเร็จ
      clearCurrentTimeout();

      setPinVerified(true);
      setPendingError("Correct password");
      setTimeout(() => {
        setPinVisible(false);
        setError("");
        setPendingError("");
      }, 1200);
      onPinSuccess?.(pin);
    } else {
      setPendingError("Incorrect password");
    }
  };

  // แสดง error หลังรอผล
  useEffect(() => {
    if (!waiting && pendingError) {
      setError(pendingError);
      setPendingError("");
    }
  }, [waiting, pendingError]);

  // ✅ Cleanup เมื่อ component unmount
  useEffect(() => {
    return () => clearCurrentTimeout();
  }, []);

  return (
    <>
      {pinVisible && !isExpired && (
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
