const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
    Device_room: { type: Number },
    Device_status: { type: String,enum: ["online", "offline"], required: true },
    Device_date: { type: Date, default: Date.now }
},  { timestamps: true });

// TTL index: ลบ document หลัง 90 วัน (90 * 24 * 60 * 60 วินาที)
DeviceSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

<<<<<<< HEAD
module.exports = mongoose.model('Log_Device_Status', DeviceSchema, 'Log_Device_Status');


 
=======
module.exports = mongoose.model('Log_Device_Status', DeviceSchema, 'Log_Device_Status');
>>>>>>> 88dca10007980b12cfd998a87ccf45b03a398772
