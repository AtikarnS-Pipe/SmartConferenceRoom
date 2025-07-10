const mongoose = require('mongoose');

const logschema = new mongoose.Schema({
    user_Id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    name: { // only housekeeper
        type: String,
        unique: true, 
        sparse: true,
    },
    // role:{ // both
    //     type: String,
    //     required: true,
    //     enum: ['admin', 'housekeeper'],
    // },
    // pin:{ // both , display in housekeeper table
    //     type: String,
    //     unique: true,
    //     sparse: true,
    // },
    // createdBy:{
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'User', // Reference to the User model
    // },
    // login_status:{ // only admin 
    //     type: String,
    //     default: 'no permission',
    //     enum: ['online', 'offline', 'no permission' ],
    //     required: true
    // },
    // otp: {
    //     code: {
    //         type: String,
    //         default: null,
    //     },
    //     expireAt: {
    //         type: Date,
    //         default: null,
    //     },
    //     used: {
    //         type: Boolean,
    //         default: false,
    //     }
    // }
}, { timestamps: true })

module.exports = mongoose.model('Logs', logschema, 'LogsMonitoring');