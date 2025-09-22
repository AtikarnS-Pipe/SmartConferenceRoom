const mongoose = require('mongoose');

const bookingKeySchema = new mongoose.Schema({
    room: {type: Number, ref: "MqttState"},
    eventId: String,
    organizerMail: String,
    pin: String,
    startDateTime: Date,
    endDateTime: Date,
    isPinVerified:{
        type: String,
        default: "false",
        enum: ['false', 'true', 'not access'],
    },
    B_createdAt:{
        type: Date,
        default: Date.now,  
        index: { expires: '90d'} // TTL index to auto delete logs
    }
});

module.exports = mongoose.model('Bookingkey', bookingKeySchema, 'Event');
