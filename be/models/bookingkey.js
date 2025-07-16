const mongoose = require('mongoose');

const bookingKeySchema = new mongoose.Schema({
    room: Number,
    eventId: String,
    organizerMail: String,
    key: String,
    pin: String,
    startDateTime: Date,
    endDateTime: Date,
    isPinVerified:{
        type: Boolean,
        default: false,
    },
    pinMissCount: {
        type: Number,
        default: 0, 
        index: true // for faster queries
    },
    B_createdAt:{
        type: Date,
        default: () => new Date(),
        index: { expires: '90d'} // TTL index to auto delete logs
    }
});

module.exports = mongoose.model('Bookingkey', bookingKeySchema, 'Event');
