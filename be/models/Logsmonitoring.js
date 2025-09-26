// Log ว่าผู้ใช้คนไหนทำอะไร(Logged in/logged out, create user, delete user, change pin, access room)
const mongoose = require('mongoose');


const logschema = new mongoose.Schema({ 
    user_Id:{ // foremost
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },

    L_status: { // foremost
        type: String,
        enum: ['Admin Logged in', 'Admin Logged out', 'Housekeeper was created', 'Housekeeper was changed pin', 'Housekeeper was deleted','Access room', `Admin was created`, `Admin was deleted`], // เดะมาเเก้
        required: true
    },
    role:{ // foremost 
        type: String,
        required: true,
        enum: ['Admin', 'Housekeeper', 'Superadmin'],
    },
    Details:{
        type: String,
        required: true,
        default: 'No details provided'
    },
    L_createdAt:{
        type: Date,
        default: Date.now,
        index: { expires: '90d'} // TTL index to auto delete logs
    },
    // createdBy:{
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'User',
    // },
})

module.exports = mongoose.model('Logs', logschema, 'LogsMonitoring');