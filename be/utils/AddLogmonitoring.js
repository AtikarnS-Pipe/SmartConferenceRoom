const Logsmonitoring = require('../models/Logsmonitoring');

// logsmonitoring create
async function AddLogmonitoring( LogsObject ){
    await Logsmonitoring.create({
        user_Id: LogsObject._id, 
        L_status: LogsObject.L_status, 
        role: LogsObject.role, 
        Details: LogsObject.Details, 
        L_createdAt: new Date(),
    })
}

module.exports = { AddLogmonitoring }
