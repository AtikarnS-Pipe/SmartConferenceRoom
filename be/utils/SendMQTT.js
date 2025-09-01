// MQTT server 
const mqtt = require('mqtt');
require('dotenv').config({ path: './config/.env' });
// MQTT connect
const mqttOptions = {
  clientId: "webbutton_" + Math.random().toString(16).substr(2, 8),
  clean: true,
  connectTimeout: 4000,
  keepalive: 60,
};

const connectUrl = process.env.MQTT_BROKER_URL; 

// ฟังก์ชันส่งข้อความ
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


// Keywords
const SUB_TOPIC = 'floor15/access-control/cmd';
const PUB_TOPIC = 'floor15/access-control/res'; // แนะนำให้แยก topic สำหรับ response

export async function initMqtt() {
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
    // อยากให้มี roomset = {"1-2": ["open", "open"], "5-6": ["closed", "closed"], "14-15": ["open", "closed"]};
    // ตัวอย่างเงื่อนไข: “Check the status of room door {roomset}” ให้เปลี่ยนเป็นดังนี้ ไล่เช็คว่า message ส่งมาตามนี้ไหม
    if (topic === SUB_TOPIC && /Check the status of room door 1-2/i.test(text)) {
      // ต้องการตอบ 2 ข้อความ:
      // Message 1: "room 15-1 is open" --> delay ~1 วินาที แล้วส่ง
      // Message 2: "room 15-2 is closed" (ส่งต่อทันทีหลังจาก #1)
      try {
        await publish(client, PUB_TOPIC, 'room 15-1 is open'); เลข 1 คือ เลขตัวเเรกของ roomset ก่อน - นั้น
        await delay(1000); // delay 1 วิ
        await publish(client, PUB_TOPIC, 'room 15-2 is closed'); เลข 2 คือ เลขตัวที่สองของ roomset หลัง - นั้น
      } catch (e) {
        console.error('Publish error:', e);
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
module.exports = { sendMQTTMessage };