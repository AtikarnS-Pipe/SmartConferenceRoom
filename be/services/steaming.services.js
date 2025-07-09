const User = require('../models/User')

async function GetAdminListFromDB(res){
    try {
        const Admin = await User.find({role: "admin"})
        .select('email name role login_status updatedAt');
        console.log("data:", Admin)
        res.write(`event: adminList\ndata: ${JSON.stringify(Admin)}\n\n`);
        return Admin;
    } catch (error) {
        console.error("Error query admin data from DB:", error);
        throw new Error('Failed to Get admin data');
    }
}

async function GetHousekeeperFromDB(res){
    try {
        const Housekeeper = await User.find({role: "housekeeper"})
        .select('name role');
        console.log("data:", Housekeeper)
        res.write(`event: HousekeeperList\ndata: ${JSON.stringify(Housekeeper)}\n\n`);
        return Housekeeper;
    } catch (error) {
        console.error("Error query Housekeeper data from DB:", error);
        throw new Error('Failed to Get Housekeeper data');
    }
}

module.exports = {
    GetAdminListFromDB,
    GetHousekeeperFromDB,
}