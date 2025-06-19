const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
    // account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
    accessToken: String,
    refreshToken: String,
    expiryDate: Date
}, { timestamps: true});

module.exports = mongoose.model('Token', tokenSchema);