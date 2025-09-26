// Log ว่าขณะนี้ Mqtt floor15/access-control/cmd มีข้อมูลที่ได้เป็นยังไง เเล้วมายืนยันเก็บ logs บน database
const mongoose = require('mongoose');

const CMDLogSchema = new mongoose.Schema({
    Device_room: { type: Number },
    Device_status: { type: String, enum: ["open", "close", "adminopen"], required: true },
},  { timestamps: true });

// TTL index: ลบ document หลัง 90 วัน (90 * 24 * 60 * 60 วินาที)
CMDLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('Log_Door_State', CMDLogSchema, 'Log_Door_State');


 
