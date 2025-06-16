const mongoose = require('mongoose');

const bookingKeySchema = new mongoose.Schema({
  room: Number,
  id: String,
  key: String,
  start: Date,
  end: Date,
}, { timestamps: true });

module.exports = mongoose.model('bookingkey', bookingKeySchema);