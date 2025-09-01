const mongoose = require('mongoose');

const MqttState = new mongoose.Schema({
    room: Number,
    state: String,
    B_createdAt:{
        type: Date,
        index: { expires: '90d'} // TTL index to auto delete logs
    }
});

module.exports = mongoose.model('Bookingkey', MqttState, 'Event');
