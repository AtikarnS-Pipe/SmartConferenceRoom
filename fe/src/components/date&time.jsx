import React, { useState, useEffect } from 'react';

export default function DateTimeDisplay() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // ตั้ง interval อัปเดตเวลาทุก 1 วินาที
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // ตัวเลือกการฟอร์แมต
  const optionsDate = {
    weekday: 'long',    // Friday
    // year: 'numeric',    // 2025
    month: 'long',      // May
    day: 'numeric'      // 19
  };

  const optionsTime = {
    hour: '2-digit',       // 04
    minute: '2-digit',     // 46
     
    hour12: true           // PM
  };

  const dateStr = now.toLocaleDateString('en-US', optionsDate);
  const timeStr = now.toLocaleTimeString('en-US', optionsTime);

  return (
    <div style={{fontSize: '26px', fontWeight: 400 }}>
      {dateStr}, {timeStr}
    </div>
  );
}
