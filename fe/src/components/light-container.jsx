import { useEffect } from 'react';
import axios from 'axios';

const roomDeviceMap = {
  '1501': { ip: '10.1.66.110', token: '364FF54C6CAB5B19F6BC6C7AE8FB86' },
  '1502': { ip: '10.1.66.111', token: 'DFFEB5C16017AFB6734FE82DFDC8A976' },
  '1505': { ip: '10.1.66.128', token: 'FBF3BC17359E5C11C189238A6062' },
  '1506': { ip: '10.1.66.131', token: 'C8D43F776633A31D837A48D1BE029D' },
  '1514': { ip: '10.1.66.126', token: 'ED187F5396693A6C27C5B21CA0D456' },
  '1515': { ip: '10.1.66.106', token: '5469B347B961196E0763B1FF3F2B8B3' },
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