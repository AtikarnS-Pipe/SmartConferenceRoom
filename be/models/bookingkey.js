const mongoose = require('mongoose');

const bookingKeySchema = new mongoose.Schema({
    room: Number,
    eventId: String,
    key: String,
    startDateTime: Date,
    endDateTime: Date,
    B_createdAt:{
        type: Date,
        default: () => new Date(),
        index: { expires: '90d'} // TTL index to auto delete logs
    }
});

module.exports = mongoose.model('Bookingkey', bookingKeySchema, 'Event');
