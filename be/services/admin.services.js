const getGraphClient = require("../graph"); 
const Token = require('../models/token');
const tokenCache = require('../utils/tokenCache')
const {decryptToken} = require('../utils/encode');
const getTodaydatetime  = require('../utils/getTodaydatetime');
const userModel = require('../models/User');
const sendMailAsync = require('../services/sendmail.services')


async function GetScheduleData(actoken, Room, start, end){  
    try {
        // start: 04072025
        // end: 05072025
        // ถ้า 1 วันต้องเเก้ เเต่ถ้า 1 อาทิตย์ไม่ต้องเเก้
        console.log("GetScheduleData3333333333333:", Room, start, end);
        const tzOffset = 7 * 60; // Thailand UTC+7 (minutes)
        const startYear = parseInt(start.slice(4, 8), 10);
        const startMonth = parseInt(start.slice(2, 4), 10) - 1; // subtract 1 for zero-based month
        const startDay = parseInt(start.slice(0, 2), 10);
        const endYear = parseInt(end.slice(4, 8), 10);
        const endMonth = parseInt(end.slice(2, 4), 10) - 1;
        const endDay = parseInt(end.slice(0, 2), 10);

        // lost time for 1 ms
        // Start of today in Thailand (00:00)
        const startTH = new Date(Date.UTC(startYear, startMonth, startDay, 0, 0, 0, 1) - tzOffset * 60 * 1000);
        // End of today in Thailand (23:59)
        const endTH = new Date(Date.UTC(endYear, endMonth, endDay, 23, 59, 59, 999) - tzOffset * 60 * 1000);

        const startDateTime = startTH.toISOString();
        const endDateTime = endTH.toISOString();
        if(process.env.DEBUG_MODE) console.log("start query scedule(UTC):", startDateTime, endDateTime);
        if(!actoken){
            throw new Error("No access token in schedule Page.")
        }
        const graphResponse = await getGraphClient(actoken)
            .api(`https://graph.microsoft.com/v1.0/users/${Room}@tcc-technology.com/calendarView?`)
            .query({
                startDateTime: startDateTime,
                endDateTime: endDateTime,
                "$orderby": "start/dateTime",
                "$select": "organizer,start,end,locations"
            })
            .get();
        if (!graphResponse || !graphResponse.value) {
            throw new Error(`No value in graphResponse for room ${Room}: ${JSON.stringify(graphResponse)}`);
        }
        const results = graphResponse.value
        if(process.env.DEBUG_MODE) console.log("admin scedule =>", results)
        return results;
        
    } catch (error) {
        console.log("error:", error);
        res.write(`event: error\ndata: ${JSON.stringify({ error: "Failed to fetch data(setinterval)" })}\n\n`);
        res.end();
    }
}

async function sendscheduledata(req, res){
    try{
        const Room = req.params.Room;
        const startdate = req.params.startdate;
        const enddate = req.params.enddate;
        if(!Room || !startdate || !enddate){
            throw new Error("Missing parameters: Room, startdate, or enddate");
        }
        await tokenCache.isTokenExpired();
        const results = await GetScheduleData(decryptToken(tokenCache.getAccessToken()), Room, startdate, enddate);
        if(!results){
            throw new Error("No results found!!");
        }
        res.write(`data: ${JSON.stringify({ results })}\n\n`);
        console.log("admin scedule send data success!!");
    } catch (error) {
        console.error("Error in sendscheduledata:", error.message);
        res.write(`event: error\ndata: ${JSON.stringify({ error: "Failed to fetch data (sendscheduledata)" })}\n\n`);
        return;
    }
}

// Logs token create
async function addCacheandDB(tokenobject, adminId){
    let existingUser;
    tokenCache.setToken(tokenobject)
    console.log("Token encrypted and cached. Expiry:", tokenobject.expiryDate);

    // If ACCOUNT DB has unique same in TOKEN DB, Update that recode
    existingUser = await Token.findOne({ account:adminId})
    if(existingUser){
        existingUser.refreshToken = tokenobject.refreshToken;
        existingUser.accessToken = tokenobject.accessToken;
        existingUser.expiryDate = tokenobject.expiryDate;
        await existingUser.save();
    } else{
        // If not, Create token in DB. ตอนนี้ซ้ำยาว
        existingUser = await Token.create(tokenobject)
    }
    console.log("Token saved to DB. ID:", existingUser._id);

    return existingUser; // logs token create and update ส่งไปให้ sse เพื่อทำให้ fe เเสดง logs
}

async function fetchAllRoom(res, accessToken) {
    try {
        const {startDateTime, endDateTime} = getTodaydatetime();
        
        const roomNumbers = [
            1501, 1502, 1503, 1504, 1505,
            1506, 1514, 1515, 1519, 1520
        ];

        if (!accessToken) {
            throw new Error("No accessToken");
        }

        const results = await Promise.all(
            roomNumbers.map(async (room) => {
                const graphResponse = await getGraphClient(accessToken)
                    .api(`https://graph.microsoft.com/v1.0/users/${room}@tcc-technology.com/calendarView`)
                    .query({
                        startDateTime: startDateTime,
                        endDateTime: endDateTime,
                        "$orderby": "start/dateTime",
                        "$select": "id,organizer,start,end,locations"
                    })
                    .get();

                if (!graphResponse || !graphResponse.value) {
                    throw new Error(`No value in graphResponse for room ${room}: ${JSON.stringify(graphResponse)}`);
                }

                return {
                    room,
                    events: graphResponse.value
                };
            })
        );

        console.log("admin GET API success!!");
        res.write(`data: ${JSON.stringify({ results })}\n\n`);
    } catch (error) {
        console.error(error);
        res.write(`event: error\ndata: ${JSON.stringify({ error: "Failed to fetch data (fetchRoomEventsAndSend)" })}\n\n`);
    }
}

/**
 * 
 * @param {String} email 
 * @returns 
 */
async function sendOTP(email) {
    try {
        const user = await userModel.findOne({ email: email });
        if (!user) {
            return { success: false, message: `User with ${email} not found!` };
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp.code = otpCode;
        user.otp.expireAt = new Date(Date.now() + (5 * 60 * 1000));
        await user.save();
        
        const body = `Hello,
Your One-Time Password (OTP) is: ${otpCode}

This code will expire in 5 minutes. Please do not share it with anyone.

Thank you,
Smart Conforence Display System
        `;

        await sendMailAsync("Your One-Time Password (OTP)", body, user.email, decryptToken(tokenCache.getAccessToken()));
        return { success: true, message: `Send OTP to ${user.email}` };
    } catch (err) {
        return { success: false, message: `${err.message}`};
    }
}

module.exports = { 
    GetScheduleData, 
    addCacheandDB, 
    sendscheduledata, 
    fetchAllRoom,
    sendOTP 
};