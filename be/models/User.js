const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Userschema = new mongoose.Schema({
    //login
    email:{ // only admin
        type: String,
        required: false,
        unique: true,
        sparse: true,
    },
    password: { // only admin
        type: String,
        required: false,
        unique: true,
        sparse: true,
    },
    // profile
    name: { // only housekeeper
        type: String,
        unique: true, 
        sparse: true,
    },
    role:{ // both
        type: String,
        required: true,
        enum: ['admin', 'housekeeper'],
    },
    pin:{ // both , display in housekeeper table
        type: String,
        unique: true,
        sparse: true,
    },
    createdBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
    },
    login_status:{ // only admin 
        type: String,
        default: 'no permission',
        enum: ['online', 'offline', 'no permission' ],
        required: true
    },
    otp: {
        code: {
            type: String,
            default: null,
        },
        expireAt: {
            type: Date,
            default: null,
        },
        used: {
            type: Boolean,
            default: false,
        }
    }
}, { timestamps: true })

// Hash password before saving
// Userschema.pre('create', async function(next) {
//     if (!this.isModified('password')) return next(); 
//     if (!this.password) return; 
//     try {
//         const salt = await bcrypt.genSalt(parseInt(process.envBCRYPT_SALT_ROUNDS));
//         this.password = await bcrypt.hash(this.password, salt);
//         next();
//     } catch (err) {
//         next(err);
//     }
// });

module.exports = mongoose.model('User', Userschema, 'Admin');