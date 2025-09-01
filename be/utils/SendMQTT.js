// MQTT server 
const mqtt = require('mqtt');
const { MqttState } = require('../models/MqttState');
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
const SUB_TOPIC = process.env.MQTT_TOPIC; 
let client;

// ฟังก์ชันส่งข้อความ หา mqtt ให้ open/close door
function sendMQTTMessage(topic, message) {
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
  const client = mqtt.connect(connectUrl, mqttOptions);

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
    console.log('MQTT Received data:', topic, text);

    if (topic === SUB_TOPIC) {
      // match pattern เช่น  "Check the status of room door 1-2"
      const match = text.match(/Check the status of room door (\d+)-(\d+)/i);
      if (match) {
        const [_, first, second] = match; // _ is not interest index 0 value, ex:  first=1, second=2

        const room1 = 1500 + parseInt(first, 10);
        const room2 = 1500 + parseInt(second, 10);
        const roomdash1 = "15-" + parseInt(room1.toString().slice(2), 10); // 15-1
        const roomdash2 = "15-" + parseInt(room2.toString().slice(2), 10); // 15-14

        try {
          // หา state จาก DB
          const DB_room1 = await MqttState.findOne({ Meeting_room: room1 });
          const DB_room2 = await MqttState.findOne({ Meeting_room: room2 });

          // ส่งออก MQTT ตาม state ที่เจอ

          if (DB_room1) {
            let statusMsg = `room ${roomdash1} is ${DB_room1.state}`;

            if (DB_room1.state === 'adminopen' && DB_room1.updatedAt) {
              const now = new Date();
              const diffMs = now - DB_room1.updatedAt; // คำนวณ ms ว่าผ่านมากี่เท่าไรเเล้ว ถึง 15m? รอส่งกลับไป mqtt 
              const diffSec = Math.floor(diffMs / 1000);
              const minutes = Math.floor(diffSec / 60);
              const seconds = diffSec % 60; 

              const timeString = `${minutes}m${seconds}s`;
              statusMsg += ` (${timeString})`; // append เวลา
              console.log("ข้อความadminopen : ", )
            }

            await publish(client, SUB_TOPIC, statusMsg);
            await delay(1000);
          }
          
          if (DB_room2) {
            let statusMsg = `room ${roomdash2} is ${DB_room2.state}`;

            if (DB_room2.state === 'adminopen' && DB_room2.updatedAt) {
              const now = new Date();
              const diffMs = now - DB_room2.updatedAt; // คำนวณ ms ว่าผ่านมากี่เท่าไรเเล้ว ถึง 15m? รอส่งกลับไป mqtt 
              const diffSec = Math.floor(diffMs / 1000);
              const minutes = Math.floor(diffSec / 60);
              const seconds = diffSec % 60; 

              const timeString = `${minutes}m${seconds}s`;
              statusMsg += ` (${timeString})`; // append เวลา
              console.log("ข้อความadminopen : ", )
            }

            await publish(client, SUB_TOPIC, statusMsg);
          }
        } catch (err) {
          console.error('DB query error:', err);
        }
      }
    }
  });
}

function publish(client, topic, msg, qos = 1, retain = false) {
  return new Promise((resolve, reject) => {
    client.publish(topic, msg, { qos, retain }, (err) => {
      if (err) return reject(err);
      console.log(`MQTT -> ${topic}: ${msg}`);
      resolve();
    });
  });
}

function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}
module.exports = { sendMQTTMessage, initMqtt };