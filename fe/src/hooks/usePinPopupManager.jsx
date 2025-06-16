// import React, { useEffect, useState } from 'react';
// import PinPopup from '../components/PinPopup'; // ไฟล์นี้คือ component ที่คุณให้มา
// import { useCurrentEvent } from './useCurrentEvent'; // hook แยก

// const PinPopupManager = ({ events, onPinSuccess }) => {
//   const { isOccupied } = useCurrentEvent(events);
//   const [pinVisible, setPinVisible] = useState(false);
//   const [pinVerified, setPinVerified] = useState(false);
//   const [error, setError] = useState('');

//   useEffect(() => {
//     if (isOccupied && !pinVerified) {
//       setPinVisible(true);
//     } else if (!isOccupied) {
//       setPinVisible(false);
//       setPinVerified(false); // reset เมื่อตารางหมด
//       setError('');
//     }
//   }, [isOccupied, pinVerified]);

//   const handlePinSubmit = (pin) => {
//     const correctPin = '1234'; // แก้ให้เหมาะสมกับระบบจริง
//     if (pin === correctPin) {
//       setPinVerified(true);
//       setError('Correct');
//       setTimeout(() => {
//         setPinVisible(false);
//         setError('');
//       }, 1200);
//       onPinSuccess?.(pin); // optional callback
//     } else {
//       setError('');
//       setTimeout(() => setError('Incorrect password'), 0);
//     }
//   };

//   return (
//     <>
//       {pinVisible && ( //ถ้าเป็น true จะแสดงผล
//         <PinPopup onSubmit={handlePinSubmit} error={error} />
//       )}
//     </>
//   );
// };

// export default PinPopupManager;
