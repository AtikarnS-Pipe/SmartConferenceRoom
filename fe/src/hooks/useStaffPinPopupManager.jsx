import React, { useState, useEffect } from 'react';
import PinPopup from '../components/PinPopup';
import { useTouchDetection } from '../hooks/useTouchDetection';

const StaffPinPopupManager = ({ showTestButton, closeUserPinPopup }) => {
  const [visible, setVisible] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState('');
  const [pendingError, setPendingError] = useState('');

  useTouchDetection({
    onTripleTouch: () => {
      setVisible(true);
      setError('');
      if (typeof closeUserPinPopup === 'function') closeUserPinPopup();
    },
    holdDuration: 1000
  });

  const handlePinSubmit = async (pin) => {
    setWaiting(true);
    setError('');
    // try {
    //   const res = await fetch('http://localhost:4000/staff/unlock', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ pin }),
    //   });
    //   const result = await res.json();
    //   setWaiting(false);

    //   if (result?.role === 'admin' || result?.role === 'staff') {
    //     setPendingError(`Welcome ${result.role}`);
    //     setTimeout(() => {
    //       setVisible(false);
    //       setError('');
    //     }, 1500);
    //   } else {
    //     setPendingError('Incorrect PIN');
    //   }
    // } catch (e) {
    //   setWaiting(false);
    //   setPendingError('Network error');
    
    // MOCK: ตรวจสอบ pin แบบ mock
    await new Promise(res => setTimeout(res, 800));
    let result = {};
    if (pin === '9999') {
      result = { role: 'admin' };
    } else if (pin === '8888') {
      result = { role: 'staff' };
    } else {
      result = {};
    }
    setWaiting(false);
    if (result?.role === 'admin' || result?.role === 'staff') {
      setPendingError(`Welcome ${result.role}${result.role === 'admin' ? ' 👑' : ''}`);
      setTimeout(() => {
        setVisible(false);
        setError('');
      }, 1500);
    } else {
      setPendingError('Incorrect PIN');
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
      {showTestButton && (
        <button style={{position:'fixed',bottom:20,right:20,zIndex:99999,padding:'1rem',fontSize:'1.2rem'}} onClick={()=>{
          setVisible(true);
          if (typeof closeUserPinPopup === 'function') closeUserPinPopup();
        }}>
          TEST STAFF PIN
        </button>
      )}
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
