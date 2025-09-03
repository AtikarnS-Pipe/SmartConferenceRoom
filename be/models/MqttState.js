const mongoose = require('mongoose');

const MqttStateSchema = new mongoose.Schema({
    Meeting_room: { type: Number, unique: true },
    state: { enum: ['open', 'closed', 'adminopen'], default: 'open' },
},  { timestamps: true });

const MqttState = mongoose.model('MqttState', MqttStateSchema, 'MqttState');

// ฟังก์ชัน seed ค่า default เมื่อยังไม่มี หรือ backend restart will reset state ห้องที่มีจอ
async function seedMqttRooms() {
  const rooms = [1501, 1502, 1505, 1506, 1514, 1515];
  for (let r of rooms) {
    await MqttState.updateOne(
      { Meeting_room: r },
      { $set: { state: 'open', B_createdAt: new Date() } }, // $setOnInsert ถ้าอยากให้เพิ่มเมื่อไม่มีเท่านั้น
      { upsert: true } // ถ้ายังไม่มี -> insert
    );
  }
}

module.exports = { MqttState, seedMqttRooms };