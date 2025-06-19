const mongoose = require('mongoose');

const bookingKeySchema = new mongoose.Schema({
  room: Number,
  eventId: String,
  key: String,
  startDateTime: Date,
  endDateTime: Date
}, { timestamps: true });

module.exports = mongoose.model('Bookingkey', bookingKeySchema);
