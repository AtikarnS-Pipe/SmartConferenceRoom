// เก็บ token ของ Microsoft Graph API เเละสถานะของ token ว่าเป็นอย่างไร (สร้างใหม่, รีเฟรช, รีเฟรชไม่สำเร็จ)
const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
    accessToken: String,
    refreshToken: String,
    expiryDate: Date,
    token_status:{ 
        type: String,
        required: true,
        enum: ['createtoken', 'refreshed', 'refreshfailed'],
    },
    T_createdAt:{
        type: Date,
        default: () => new Date(),
        index: { expires: '90d'} // TTL index to auto delete logs
    }
});

module.exports = mongoose.model('Token', tokenSchema, 'Token');