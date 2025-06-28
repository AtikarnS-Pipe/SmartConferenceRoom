const mongoose = require('mongoose');

const RoomAccessLogSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  room_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
  },

}, {
  timestamps: { createdAt: 'access_time', updatedAt: false }
});

module.exports = mongoose.model('RoomAccessLog', RoomAccessLogSchema);
