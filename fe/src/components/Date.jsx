import React, { useState, useEffect } from 'react';

function Clock() {
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setDate(new Date());
    }, 1000); // อัปเดตทุก 1 วินาที

    return () => clearInterval(timer); // clear interval ตอน component ถูกลบ
  }, []);

  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const day = dayNames[date.getDay()];
  const dayNum = date.getDate();
  const month = monthNames[date.getMonth()];

  return (
    <div className="date-container">
      <div className="date-text">{day}</div>
      <div className="date-number">{dayNum}</div>
      <div className="date-text">{month}</div>
    </div>
  );
}

export default Clock;
