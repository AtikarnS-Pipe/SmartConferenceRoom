// เก็บข้อมูลการจองห้องประชุมจาก Microsoft Graph API ที่มีรหัส, สถานะการยืนยันรหัส เพิ่มเติมเพื่อยืนยัน
const mongoose = require('mongoose');

const bookingKeySchema = new mongoose.Schema({
    room: {type: Number, ref: "MqttState"},
    eventId: String,
    organizerMail: String,
    organizerName: String,
    pin: String,
    startDateTime: Date,
    endDateTime: Date,
    isPinVerified:{
        type: String,
        default: "false",
        enum: ['false', 'true', 'not access'],
    },
    isended:{
        type: Boolean,
        default: false
    },
    endmeetingAt: {
        type: Date,
        required: false,
        default: null
    },
    B_createdAt:{
        type: Date,
        default: Date.now,  
        index: { expires: '90d'} // TTL index to auto delete logs
    }
}, { timestamps: { createdAt: false, updatedAt: true }  });

// bookingKeySchema.index({ room: 1, eventId: 1 });   // ใช้กับ findOne({ room, eventId })
bookingKeySchema.index({ eventId: 1 });            // ใช้กับ findOneAndUpdate({ eventId })


module.exports = mongoose.model('Bookingkey', bookingKeySchema, 'Event');
