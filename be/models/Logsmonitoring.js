const mongoose = require('mongoose');

const logschema = new mongoose.Schema({ 
    user_Id:{ // foremost
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    // name: { // foremost, Unique nam!!
    //     type: String,
    //     unique: true, 
    //     sparse: true // null ซ้ำกันได้
    // },
    L_status: { // foremost
        type: String,
        enum: ['Admin Logged in', 'Admin Logged out', 'Housekeeper was created', 'Housekeeper was changed pin', 'Housekeeper was deleted' ], // เดะมาเเก้
        required: true
    },
    role:{ // foremost 
        type: String,
        required: true,
        enum: ['admin', 'housekeeper'],
    },
    Details:{
        type: String,
        required: true,
        default: 'No details provided'
    },
    L_createdAt:{
        type: Date,
        default: () => new Date(),
        index: { expires: '5m'} // TTL index to auto delete logs
    },
    // createdBy:{
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'User',
    // },
})

module.exports = mongoose.model('Logs', logschema, 'LogsMonitoring');