// models/RoomAccessLog.js
const mongoose = require('mongoose');

const pinStatsSchema = new mongoose.Schema({
    organizerMail: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    pinMissCount: { 
        type: Number,
        default: 0 
    },
    EventId: [{ 
        eventId: {
            type: String,
            required: false
        },
        missedAt: {
            type: Date,
            required: false
        },
        RoomNumber: {
            type: Number,
            required: false
        }
    }],
    isBanned: { 
        type: Boolean, 
        default: false 
    },
}, { timestamps: true });

module.exports = mongoose.model('pinstats', pinStatsSchema, 'RoomAccessLog');