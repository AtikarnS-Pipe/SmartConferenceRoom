// models/RoomAccessLog.js
const mongoose = require('mongoose');

const pinStatsSchema = new mongoose.Schema({
    organizerMail: {
        type: String,
        required: true,
        unique: true
    },
    pinMissCount: { 
        type: Number,
        default: 0 
        },
    lastMissedAt: { type: Date },
    EventId: { type: String },
    isBanned: { 
        type: Boolean, 
        default: false 
    },
});

module.exports = mongoose.model('PinStats', pinStatsSchema, 'RoomAccessLog');