const mongoose = require('mongoose');

const bookingKeySchema = new mongoose.Schema({
  room: Number,
  id: String,
  key: String
}, { timestamps: true });

module.exports = mongoose.model('bookingkey', bookingKeySchema);