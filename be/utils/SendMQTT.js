// MQTT server 
const mqtt = require('mqtt');
// MQTT connect
const mqttOptions = {
  clientId: "webbutton_" + Math.random().toString(16).substr(2, 8),
  clean: true,
  connectTimeout: 4000,
  keepalive: 60,
};

const connectUrl = 'mqtt://10.1.65.30:1883'; // เปลี่ยนให้ตรง
const client = mqtt.connect(connectUrl, mqttOptions);

client.on('connect', () => {
  console.log('✅ Connected to MQTT broker');
});

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

module.exports = { sendMQTTMessage };