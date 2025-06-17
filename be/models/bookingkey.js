const mongoose = require('mongoose');

const bookingKeySchema = new mongoose.Schema({
  room: Number,
  id: String,
  key: String,
  startDateTime: Date,
  endDateTime: Date
}, { timestamps: true });

module.exports = mongoose.model('bookingkey', bookingKeySchema);