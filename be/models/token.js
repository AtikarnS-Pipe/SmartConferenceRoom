const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
    accessToken: String,
    refreshToken: String,
    expiryDate: Date
}, { timestamps: true});

module.exports = mongoose.model('Token', tokenSchema, 'Token');