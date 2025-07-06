import { useEffect } from 'react';
import axios from 'axios';

const roomDeviceMap = {
  '1501': { ip: '10.1.66.110', token: import.meta.env.VITE_ROOM_1501_TOKEN },
  '1502': { ip: '10.1.66.111', token: import.meta.env.VITE_ROOM_1502_TOKEN },
  '1505': { ip: '10.1.66.128', token: import.meta.env.VITE_ROOM_1505_TOKEN },
  '1506': { ip: '10.1.66.131', token: import.meta.env.VITE_ROOM_1506_TOKEN },
  '1514': { ip: '10.1.66.126', token: import.meta.env.VITE_ROOM_1514_TOKEN },
  '1515': { ip: '10.1.66.106', token: import.meta.env.VITE_ROOM_1515_TOKEN },
};

export default function LightContainer({ isOccupied, floor, room }) {
  useEffect(() => {
    const roomKey = `${floor}${room.toString().padStart(2, '0')}`;
    console.log("floor:", floor, "room:", room, "roomKey:", roomKey);
    const device = roomDeviceMap[roomKey];
    console.log("data", device);
    if (!device) return;
    const color = isOccupied ? '#FF0000' : '#00FF00';

    // log ก่อนยิง request
    console.log("POST to:", `http://${device.ip}:8080/v2/hardware/light?access_token=${device.token}`, "with color:", color);

    axios.post(`http://${device.ip}:8080/v2/hardware/light?access_token=${device.token}`, {
      name: 'frame',
      brightness: '1',
      color: color
    })
      .then((res) => {
        // log หลังยิง request สำเร็จ
        console.log("POST success:", res.data);
      })
      .catch((err) => {
        // log ถ้า error
        console.error('Failed to set light:', err.message);
      });
  }, [isOccupied, floor, room]);

  return (
    <div className="light-container">
      <div className={`light-indicator ${isOccupied ? 'occupied' : 'available'}`}></div>
    </div>
  );
}