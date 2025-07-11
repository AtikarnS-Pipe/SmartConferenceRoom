import React, { useState, useEffect } from 'react';
import PinPopup from '../components/PinPopup';
import { useTouchDetection } from '../hooks/useTouchDetection';
import { useRoomData } from './useRoomData'; // hook แยกเพื่อดึงข้อมูลห้อง
import axios from 'axios';

const StaffPinPopupManager = ({ showTestButton, closeUserPinPopup }) => {
  const [visible, setVisible] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState('');
  const [pendingError, setPendingError] = useState('');
  const { floor, room } = useRoomData(); 
  const roomId = `${floor}${room}`; // สร้าง roomId จาก floor และ room
  // console.log(roomId)

  // Track triple touch toggle
  useTouchDetection({
    onTripleTouch: () => {
      setVisible((prev) => {
        if (prev) {
          // If already open, close staff popup and reopen user popup
          if (typeof closeUserPinPopup === 'function') closeUserPinPopup(false); // false = open user popup
          setError('');
          return false;
        } else {
          // If closed, open staff popup and close user popup
          if (typeof closeUserPinPopup === 'function') closeUserPinPopup(true); // true = close user popup
          setError('');
          return true;
        }
      });
    },
    holdDuration: 1000
  });

  const handlePinSubmit = async (pin) => {
  // console.log(pin, roomId);
  setWaiting(true);
  setError('');
  setPendingError('');

  try {
    const res = await axios.post('/user/admin-key', {
      pin: pin,
      room_number: roomId,
    });

    const result = res.data;
    console.log('Pin submit result:', result);
    setWaiting(false);
    console.log('success',result.success)

   if (result.success) {
    setPendingError(''); // เคลียร์ข้อความก่อน
    setPendingError('Correct password');
    setTimeout(() => {
    setVisible(false); // ✅ ปิด popup หลัง 1200ms
    setPendingError(''); // เคลียร์ข้อความหลังปิด
    }, 1200);
  } else {
    setPendingError(result.message || 'Incorrect PIN');
  }

  } catch (e) {
    setWaiting(false);
    if (e.response?.data?.message) {
      setPendingError(e.response.data.message);
    } else {
      setPendingError('Network error');
    }
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
      {/* ปุ่มทดสอบสำหรับ staff pin */}
      {/* {showTestButton && (
        <button style={{position:'fixed',bottom:20,right:20,zIndex:99999,padding:'1rem',fontSize:'1.2rem'}} onClick={()=>{
          setVisible(true);
          if (typeof closeUserPinPopup === 'function') closeUserPinPopup(true); // true = close user popup
        }}>
          TEST STAFF PIN
        </button>
      )} */}
      {visible && (
        <PinPopup
          onSubmit={handlePinSubmit}
          error={error}
          waiting={waiting}
          title="Enter Staff PIN"
          showIcon={false}
        />
      )}
    </>
  );
};

export default StaffPinPopupManager;
