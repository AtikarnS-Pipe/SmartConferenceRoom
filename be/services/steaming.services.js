const User = require('../models/User')
const Logsmonitoring = require('../models/Logsmonitoring');

async function GetAdminListFromDB(res){
    try {
        const Admin = await User.find({role: "Admin"})
        .select('email name role login_status updatedAt');
        // console.log("data:", Admin)
        res.write(`event: adminList\ndata: ${JSON.stringify(Admin)}\n\n`);
        return Admin;
    } catch (error) {
        console.error("Error query admin data from DB:", error);
        throw new Error('Failed to Get admin data');
    }
}

async function GetHousekeeperFromDB(res){
    try {
        const Housekeeper = await User.find({role: "Housekeeper"})
        .select('name role');
        // console.log("data:", Housekeeper)
        res.write(`event: HousekeeperList\ndata: ${JSON.stringify(Housekeeper)}\n\n`);
        return Housekeeper;
    } catch (error) {
        console.error("Error query Housekeeper data from DB:", error);
        throw new Error('Failed to Get Housekeeper data');
    }
}

async function LogsFromDB(res){
    try {
        const logs = await Logsmonitoring.find({ $or: [{ role: "Admin" }, { role: "Housekeeper" }] })
        // console.log("data:", logs)
        res.write(`event: Logsmonitoring\ndata: ${JSON.stringify(logs)}\n\n`);
        return logs;
    } catch (error) {
        console.error("Error query Logs data from DB:", error);
        throw new Error('Failed to Get Logs data');
    }
}

module.exports = {
    GetAdminListFromDB,
    GetHousekeeperFromDB,
    LogsFromDB
}