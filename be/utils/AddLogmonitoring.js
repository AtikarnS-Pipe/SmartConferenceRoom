const Logsmonitoring = require('../models/Logsmonitoring');

// logsmonitoring create
async function AddLogmonitoring( LogsObject ){
    try {
        const log = await Logsmonitoring.create({
            user_Id: LogsObject.user_Id, 
            L_status: LogsObject.L_status, 
            role: LogsObject.role, 
            Details: LogsObject.Details, 
            L_createdAt: new Date(),
        });
        return { success: true, log };
    } catch (error) {
        console.error("Error in AddLogmonitoring:", error);
        return { success: false, error: error.message };
    }
}

module.exports = { AddLogmonitoring }
