const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Userschema = new mongoose.Schema({
    email:{
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true, 
    },
})

// Hash password before saving
Userschema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

module.exports = mongoose.model('User', Userschema, 'Admin');