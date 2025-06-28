const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  room_number: {
    type: String,
    required: true,
    unique: true,
  },
  capacity: {
    type: Number,
  }
}, { timestamps: true });

module.exports = mongoose.model('Room', RoomSchema);