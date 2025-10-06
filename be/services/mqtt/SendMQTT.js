// mqttHandler.js
const mqtt = require('mqtt');
const { MqttState } = require('../../models/MqttState');
const Log_Door_State = require('../../models/Log_Door_State');
require('dotenv').config({ path: './config/.env' });

const mqttOptions = {
  clientId: "webbutton_" + Math.random().toString(16).substr(2, 8),
  clean: true,
  connectTimeout: 4000,
  keepalive: 60,
};

const connectUrl = process.env.MQTT_BROKER_URL;
const SUB_TOPIC = process.env.MQTT_TOPIC_CMD;
let client;

/** === Helper functions === **/
function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function sendMQTTMessage(topic, message) {
  if (process.env.OPEN_MQTT !== "true" || !client) {
    console.log(" [Mock MQTT disabled] Would send:", topic, message);
    return { success: true, mock: true, topic, message, timestamp: new Date() };
  }

  return new Promise((resolve, reject) => {
    client.publish(topic, message, { qos: 1 }, (err) => {
      if (err) {
        console.error('❌ MQTT Publish error:', err);
        reject({ success: false, error: err });
      } else {
        console.log('📨 MQTT Sent:', topic, message);
        resolve({ success: true, topic, message, timestamp: new Date() });
      }
    });
  });
}

/** === New helper to handle room state logic === **/
async function handleRoomState(floor, roomNum) {
  const roomId = parseInt(floor, 10) * 100 + parseInt(roomNum, 10); // 1501
  const roomKey = `${floor}-${roomNum}`;
  const DB_room = await MqttState.findOne({ Meeting_room: roomId });

  if (!DB_room) return;

  let statusMsg = `room ${roomKey} is ${DB_room.state}`; // room 1501 is open 
  let isTimeout = false;

  if (DB_room.state === 'adminopen' && DB_room.adminOpenAt) {
    const now = new Date();
    const diffSec = Math.floor((now - DB_room.adminOpenAt) / 1000);
    const minutes = Math.floor(diffSec / 60);
    const seconds = diffSec % 60;
    statusMsg += ` ${minutes}m${seconds}s`;
    isTimeout = diffSec >= 15 * 60;
  }

  if (isTimeout) {
    await sendMQTTMessage(SUB_TOPIC, `close_${floor}>${roomNum}`);
  } else {
    await sendMQTTMessage(SUB_TOPIC, statusMsg);
  }
}

/** === Queue per room (กัน race condition) === **/
const roomQueues = new Map(); // "15-1": [promise fn.]

function queueRoomAction(roomId, action) {
  const prev = roomQueues.get(roomId) || Promise.resolve(); // ถ้ามีงานเก่าจะคืน promise งานเก่าของห้องนั้น ถ้าไม่มี ก็จะข้ามเลย
  const next = prev.finally(() => action()); // ถ้า promise prev จบ จะทำ action()
  roomQueues.set(roomId, next); // เก็บ promise งานล่าสุดเอาไว้
  return next; // promise wait for next var.
}

/** === match_dev unified update === **/
async function updateRoomState(status, floor, room) {
  const meetingRoom = floor * 100 + room;
  let filter, update, options = { new: true, upsert: false };

  switch (status) {
    case 'adminopen':
      // filter = { Meeting_room: meetingRoom, state: { $ne: 'open' } };
      filter = { Meeting_room: meetingRoom };
      update = { $set: { state: 'adminopen', adminOpenAt: new Date() } };
      options.upsert = false;
      break;
    case 'open':
      filter = { Meeting_room: meetingRoom };
      update = { $set: { state: 'open', adminOpenAt: null } };
      options.upsert = false;
      break;
    case 'close':
      filter = { Meeting_room: meetingRoom };
      update = { $set: { state: 'close', adminOpenAt: null } };
      break;
  }

  const doc = await MqttState.findOneAndUpdate(filter, update, options);
  if (doc) {
    await Log_Door_State.create({
      Device_room: meetingRoom,
      Device_status: status,
    });
  }
}

/** === Main MQTT Logic === **/
async function initMqtt() {
  client = mqtt.connect(connectUrl, mqttOptions);

  client.on('connect', () => {
    console.log('✅ MQTT connected');
    client.subscribe(SUB_TOPIC, { qos: 1 }, (err) => {
      if (err) console.error('Subscribe error:', err);
    });
  });

  client.on('error', (err) => console.error('MQTT error:', err));

  client.on('message', async (topic, payload) => {
    if (topic !== SUB_TOPIC) return;
    const text = payload.toString();

    /** ========== Handle status check ========== **/
    // match pattern เช่น  "Check the status of room door 15>1-2"
    const checkMatch = text.match(/Check the status of room door (\d+)>(\d+)-(\d+)/i);
    if (checkMatch) {
      const [, floor, first, second] = checkMatch.map(Number);
      console.log(`📡 ESP requested status for rooms ${floor}-${first} and ${floor}-${second}`);

      await Promise.all([
        queueRoomAction(`${floor}-${first}`, () => handleRoomState(floor, first)),
        queueRoomAction(`${floor}-${second}`, () => handleRoomState(floor, second))
      ]);
      return;
    }

    /** ========== Handle open/adminopen/close ========== **/
    const matchDev = text.match(/^(adminopen|open|close)_(\d+)>(\d+)/i);
    if (matchDev) {
      const [_, status, floorStr, roomStr] = matchDev;
      const floor = parseInt(floorStr, 10);
      const room = parseInt(roomStr, 10);
      queueRoomAction(`${floor}-${room}`, () => updateRoomState(status, floor, room));
      
      return;
    }

    /** ========== Handle open_all / close_all ========== **/
    const matchAll = text.match(/^(open_all|close_all)\b/i);
    if (matchAll) {
      const action = matchAll[1].toLowerCase();
      const target = action === 'open_all' ? 'open' : 'close';
      await MqttState.updateMany(
        { state: { $ne: target } },
        { $set: { state: target, adminOpenAt: null } }
      );
      console.log(`🚪 All doors set to ${target}`);
    }
  });
}

/** === Export === **/
function getClient() {
  return client;
}

module.exports = { sendMQTTMessage, initMqtt, getClient };
