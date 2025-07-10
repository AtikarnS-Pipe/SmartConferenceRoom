const {GetAdminListFromDB, GetHousekeeperFromDB, LogsFromDB} = require('../../services/steaming.services');
const urladmin = process.env.FRONTEND_ADMIN;
const AdminListSchedule = async (req, res) => {
    let intervalId;
    res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': urladmin
    });

    try{
        await GetAdminListFromDB(res);
        intervalId = setInterval(async () => {
            await GetAdminListFromDB(res);
        }, 5000);

        // จัดการเมื่อ connection ปิด
        req.on('close', () => {
            clearInterval(intervalId);
            console.log(`SSE connection closed by Steaming Admin List`);
        });

        req.on('error', (err) => {
            clearInterval(intervalId);
            console.error('SSE request error:', err);
        });

        res.on('finish', () => {
            clearInterval(intervalId);
            console.log(`Response finished for admin`);
        });
        
    } catch(error){
        console.error("Error steaming admin lists:", error)
        if (!res.writableEnded) {
            res.write(`data: ${JSON.stringify({ 
            error: `AdminListSchedule is error.`})}\n\n`); //****** */
        }        
        return;
    }
}

const HousekeeperListSchedule = async (req, res) => {
    let intervalId;
    res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': urladmin
    });

    try{
        await GetHousekeeperFromDB(res);
        intervalId = setInterval(async () => {
            await GetHousekeeperFromDB(res);
        }, 5000);

        // จัดการเมื่อ connection ปิด
        req.on('close', () => {
            clearInterval(intervalId);
            console.log(`SSE connection closed by Steaming Admin List`);
        });

        req.on('error', (err) => {
            clearInterval(intervalId);
            console.error('SSE request error:', err);
        });

        res.on('finish', () => {
            clearInterval(intervalId);
            console.log(`Response finished for admin`);
        });
        
    } catch(error){
        console.error("Error steaming Housekeeper lists:", error)
        if (!res.writableEnded) {
            res.write(`data: ${JSON.stringify({ 
            error: `HousekeeperListSchedule is error.`})}\n\n`); //****** */
        }    
        return;
    }
}

const LogsListSchedule = async (req, res) => {
    let intervalId;
    res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': urladmin
    });

    try{
        await LogsFromDB(res);
        intervalId = setInterval(async () => {
            await LogsFromDB(res);
        }, 10000);

        // จัดการเมื่อ connection ปิด
        req.on('close', () => {
            clearInterval(intervalId);
            console.log(`SSE connection closed by Logs List`);
        });

        req.on('error', (err) => {
            clearInterval(intervalId);
            console.error('SSE request error:', err);
        });

        res.on('finish', () => {
            clearInterval(intervalId);
            console.log(`Response finished for admin`);
        });
        
    } catch(error){
        console.error("Error steaming Logs lists:", error)
        if (!res.writableEnded) {
            res.write(`data: ${JSON.stringify({ 
            error: `LogsListSchedule is error.`})}\n\n`); //****** */
        }    
        return;
    }
}

module.exports = {
    AdminListSchedule,
    HousekeeperListSchedule,
    LogsListSchedule
}