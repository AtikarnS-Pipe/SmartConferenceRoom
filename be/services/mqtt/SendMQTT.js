// MQTT server 
const mqtt = require('mqtt');
const { MqttState } = require('../../models/MqttState');
require('dotenv').config({ path: './config/.env' });
// MQTT connect
const mqttOptions = {
  clientId: "webbutton_" + Math.random().toString(16).substr(2, 8),
  clean: true,
  connectTimeout: 4000,
  keepalive: 60,
};

const connectUrl = process.env.MQTT_BROKER_URL; 
// Keywords
const SUB_TOPIC = process.env.MQTT_TOPIC_CMD; 
let client;

// ฟังก์ชันส่งข้อความ หา mqtt ให้ open/close door
function sendMQTTMessage(topic, message) {
  if (process.env.OPEN_MQTT !== "true" || !client) {
    console.log(" [Mock MQTT disabled] Would send:", topic, message);
    return Promise.resolve({
      success: true,
      mock: true,
      topic,
      message,
      timestamp: new Date()
    });
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

async function initMqtt() {
  client = mqtt.connect(connectUrl, mqttOptions);

  client.on('connect', () => {
    console.log('MQTT connected!!!');
    client.subscribe(SUB_TOPIC, { qos: 1 }, (err) => {
      if (err) console.error('Subscribe error:', err);
    });
  });

  client.on('error', (err) => {
    console.error('MQTT error:', err);
  });

  client.on('message', async (topic, payload) => {
    const text = payload.toString();
    // console.log('MQTT Received data:', topic, text);
    
    if (topic === SUB_TOPIC) {
      // match pattern เช่น  "Check the status of room door 15>1-2"
      const match = text.match(/Check the status of room door (\d+)>(\d+)-(\d+)/i);
      if (match) {
        const [_, floor, first, second] = match; // _ is not interest index 0 value, ex:  first=1, second=2
        console.log(`Request status of rooms: ${match}`);

        const room1 = parseInt(floor, 10)*100 + parseInt(first, 10);
        const room2 = parseInt(floor, 10)*100 + parseInt(second, 10);
        const roomdash1 = `${floor}-` + first; // 15-1
        const roomdash2 = `${floor}-` + second; // 15-14

        try {
          // หา state จาก DB
          const DB_room1 = await MqttState.findOne({ Meeting_room: room1 });
          const DB_room2 = await MqttState.findOne({ Meeting_room: room2 });

          // ส่งออก MQTT ตาม state ที่เจอ

          if (DB_room1) {
            let statusMsg = `room ${roomdash1} is ${DB_room1.state}`;
            let isTimeout = false;

            if (DB_room1.state === 'adminopen' && DB_room1.updatedAt) {
              const now = new Date();
              const diffMs = now - DB_room1.updatedAt; // คำนวณ ms ว่าผ่านมากี่เท่าไรเเล้ว ถึง 15m? รอส่งกลับไป mqtt 
              const diffSec = Math.floor(diffMs / 1000);
              const minutes = Math.floor(diffSec / 60);
              const seconds = diffSec % 60; 

              const timeString = `${minutes}m${seconds}s`;
              statusMsg += ` ${timeString}`; // append เวลา
              console.log("ข้อความadminopen : ", statusMsg);
              isTimeout = diffSec >= 15*60;
              if(isTimeout){ // หากมากกว่า 15 min ให้ไปบอก mqtt ปิดประตู
                await sendMQTTMessage(SUB_TOPIC, `close_${floor}>${first}`); // ex. close_1
                const isUpdated = await MqttState.findOneAndUpdate(
                    { Meeting_room: room1 },   // หา record ตามห้อง
                    { $set: { state: "close" } },     // อัพเดต state = open
                    { new: true, upsert: true }      // upsert กันพลาด ถ้าไม่เจอให้สร้าง
                );
                if (!isUpdated) {
                    console.error("Failed to update MQTT state of admin");
                }
              }
            }

            if(!isTimeout) await sendMQTTMessage(SUB_TOPIC, statusMsg);
            await delay(500);
          }
          
          if (DB_room2) {
            let statusMsg = `room ${roomdash2} is ${DB_room2.state}`;
            let isTimeout = false;

            if (DB_room2.state === 'adminopen' && DB_room2.updatedAt) {
              const now = new Date();
              const diffMs = now - DB_room2.updatedAt; // คำนวณ ms ว่าผ่านมากี่เท่าไรเเล้ว ถึง 15m? รอส่งกลับไป mqtt 
              const diffSec = Math.floor(diffMs / 1000);
              const minutes = Math.floor(diffSec / 60);
              const seconds = diffSec % 60; 

              const timeString = `${minutes}m${seconds}s`;
              statusMsg += ` ${timeString}`; // append เวลา
              console.log("ข้อความadminopen : ", statusMsg);
              isTimeout = diffSec >= 15*60;
              if(isTimeout){ // หากมากกว่า 15 min ให้ไปบอก mqtt ปิดประตู
                await sendMQTTMessage(SUB_TOPIC, `close_${floor}>${second}`); // ex. close_2
                const isUpdated = await MqttState.findOneAndUpdate(
                    { Meeting_room: room2 },   // หา record ตามห้อง
                    { $set: { state: "close" } },     // อัพเดต state = open
                    { new: true, upsert: true }      // upsert กันพลาด ถ้าไม่เจอให้สร้าง
                );
                if (!isUpdated) {
                    console.error("Failed to update MQTT state of admin");
                }
              }
            }

            if(!isTimeout) await sendMQTTMessage(SUB_TOPIC, statusMsg);
          }
        } catch (err) {
          console.error('DB query error:', err);
        }
      }

      // match pattern เช่น  "open_15>1 close_15>1 adminopen_15>20"
      const match_dev = text.match(/(open|close|adminopen)_(\d+)>(\d+)/i);
      if (match_dev) {
        const [_, status, floor, room] = match_dev;
        const meeting_floor = parseInt(floor, 10)*100 + parseInt(room, 10);
        const isUpdated = await MqttState.findOneAndUpdate(
            { Meeting_room: meeting_floor },   // หา record ตามห้อง
            { $set: { state: status } },     // อัพเดต state = open
            { new: true, upsert: true }      // upsert กันพลาด ถ้าไม่เจอให้สร้าง
        );
        if (!isUpdated) {
            console.error("Failed to update MQTT state of admin");
        }
      }

      // ---- handle openall / closeall (อัปเดตทุกแถวใน DB) ----
      const match_all = text.match(/^(open_all|close_all)\b/i);
      if (match_all) {
        const action = match_all[1].toLowerCase();
        const target = action === 'open_all' ? 'open' : 'close';

        // อัปเดตทุก document ให้เป็นสถานะเป้าหมาย
        const res = await MqttState.updateMany(
          { state: { $ne: target } },      // (optional) อัปเดตเฉพาะแถวที่ยังไม่เป็น target เพื่อลด write
          { $set: { state: target } }
        );
      }
    }
  });
}

function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function getClient() {
  return client;
}

module.exports = { sendMQTTMessage, initMqtt, getClient };