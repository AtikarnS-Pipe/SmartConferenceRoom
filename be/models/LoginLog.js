const mongoose = require('mongoose');

const LoginLogSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'housekeeper'],
  },
  login_time: {
    type: Date,
    required: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('LoginLog', LoginLogSchema, 'Login_logs');