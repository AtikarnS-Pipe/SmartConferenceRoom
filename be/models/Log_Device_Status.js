const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
    Device_room: { type: Number, ref: "MqttState" },
    Device_status: { type: String },
    Device_date: { type: Date, default: Date.now }
},  { timestamps: true });

const DeviceState = mongoose.model('Log_Device_Status', DeviceSchema, 'Log_Device_Status');


module.exports = { DeviceState };