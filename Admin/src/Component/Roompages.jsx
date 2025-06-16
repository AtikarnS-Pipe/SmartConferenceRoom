import React from 'react';
import { useParams } from 'react-router-dom';
import Room1501  from './Room/Room1501'; // สมมุติคุณแยก layout ออกมาหรือโค้ดหลักไว้ที่นี่

const RoomPage = () => {
  const { Room, startdate, enddate } = useParams();

  const roomDisplayName = {
    '1501': 'Room 15/01',
    '1502': 'Room 15/02',
    '1503': 'Room 15/03',
    '1504': 'Room 15/04',
    '1505': 'Room 15/05',
    '1506': 'Room 15/06',
    '1514': 'Room 15/14',
    '1515': 'Room 15/15',
    '1519': 'Room 15/19',
    '1520': 'Room 15/20',
    
  };

  return (
    <Room1501
      room={Room}
      roomName={roomDisplayName[Room] || `Room ${Room}`}
      startdate={startdate}
      enddate={enddate}
    />
  );
};

export default RoomPage;
