const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
    accessToken: String,
    refreshToken: String,
    expiryDate: Date,
    token_status:{ 
        type: String,
        required: true,
        enum: ['Admin logged in', 'refreshed', 'refreshfailed'],
    },
}, { timestamps: true});

module.exports = mongoose.model('Token', tokenSchema, 'Token');