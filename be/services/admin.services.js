const getGraphClient = require("../utils/graph");
const Token = require('../models/token');
const tokenCache = require('../utils/tokenCache')
const { getTodaydatetime } = require('../utils/getTodaydatetime');
const userModel = require('../models/User');
const sendMailAsync = require('../services/sendmail.services')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { roomobject } = require('../utils/tokenCache');
require('dotenv').config({ path: '../config/.env' });

const RESET_SECRET = process.env.JWT_RESET_SECRET || "jwt-reset-secret";
async function GetScheduleData(actoken, Room, start, end) {
    try {
        // start: 06072025
        // end: 12072025
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
        if (process.env.DEBUG_MODE) console.log("start query scedule(UTC):", startDateTime, endDateTime);
        if (!actoken) {
            throw new Error("No access token in schedule Page.")
        }
        const graphResponse = await getGraphClient(actoken)
            .api(`https://graph.microsoft.com/v1.0/users/${Room}@tcc-technology.com/calendarView?`)
            .query({
                startDateTime: startDateTime,
                endDateTime: endDateTime,
                "$orderby": "start/dateTime",
                "$top": 100, // default = 10 ,Limit max = 100 events, if more than 100 events, you need to use pagination
                "$select": "organizer,subject,start,end,locations",
                "$filter": "isCancelled eq false"
            })
            .get();
        if (!graphResponse || !graphResponse.value) {
            throw new Error(`No value in graphResponse for room ${Room}: ${JSON.stringify(graphResponse)}`);
        }
        const results = graphResponse.value
        if (process.env.DEBUG_MODE) console.log("admin scedule =>", results)
        return results;

    } catch (error) {
        console.error("error:", error);
    }
}

async function sendscheduledata(req, res) {
    try {
        const Room = req.params.Room;
        const startdate = req.params.startdate;
        const enddate = req.params.enddate;
        if (!Room || !startdate || !enddate) {
            throw new Error("Missing parameters: Room, startdate, or enddate");
        }
        const accesstoken = tokenCache.getAccessToken();
        const results = await GetScheduleData(accesstoken, Room, startdate, enddate);
        if (!results) {
            throw new Error("No results found!!");
        }
        res.write(`data: ${JSON.stringify({ results })}\n\n`);
        console.log("admin scedule send data success!!");
    } catch (error) {
        console.error("Error in sendscheduledata:", error.message);
        res.write(`event: error\ndata: ${JSON.stringify({ error: "Failed to fetch data (sendscheduledata)" })}\n\n`);
        res.end();
        return;
    }
}


// ฟังก์ชันสำหรับดึงข้อมูล user profile
async function getUserProfile(accessToken) {
    try {
        const profile = await getGraphClient(accessToken).api('https://graph.microsoft.com/v1.0/me').get();
        if (process.env.DEBUG_MODE) console.log("getUserProfile profile:", profile.mail);
        return profile;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        throw new Error('Failed to fetch user profile');
    }
}

// ฟังก์ชันสำหรับบันทึก token ลงฐานข้อมูล
async function addCacheandDB(tokenObject) {
    try {
        // อัปเดต token ที่มีอยู่
        tokenCache.setToken(tokenObject)
        // console.log(`✅ Token updated in Cache. Access Token: ${tokenObject.accessToken}`);

        const newToken = await Token.create(tokenObject);
        // console.log(`✅ New token created in DB. ID: ${newToken._id}`);
        return newToken;

    } catch (error) {
        console.error('Error saving token to DB:', error);
        throw new Error('Failed to save token to database');
    }
}

async function fetchAllRoom(res, accessToken) {
    try {
        const { startDateTime, endDateTime } = await getTodaydatetime();
        if (!accessToken) {
            throw new Error("No accessToken");
        }
        const results = await Promise.all(
            Object.keys(roomobject).map(async (room) => {
                const graphResponse = await getGraphClient(accessToken)
                    // .api(`https://graph.microsoft.com/v1.0/me/calendars/${roomobject[room]}/calendarView?`)
                    .api(`https://graph.microsoft.com/v1.0/users/${room}@tcc-technology.com/calendarView`) // use this if don't want to use id for something, it faster than using id
                    .query({
                        startDateTime: startDateTime,
                        endDateTime: endDateTime,
                        "$orderby": "start/dateTime",
                        "$top": 100,
                        "$select": "id,organizer,start,end,location",
                        "$filter": "isCancelled eq false"
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
        res.end();
    }
}

/**
 * ส่ง OTP ไปให้ email ที่มีจริงในระบบ
 * 
 * @param {String} email 
 * @returns {Object} { success: Boolean, message: String }
 */
async function sendOTP(email) {
    try {
        const user = await userModel.findOne({ email: email });
        if (!user) {
            return { success: false, message: `User with ${email} not found!` };
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp.code = otpCode;
        user.otp.used = false;
        user.otp.expireAt = new Date(Date.now() + (5 * 60 * 1000));
        await user.save();

        const body = `Hello,
Your One-Time Password (OTP) is: ${otpCode}

This code will expire in 5 minutes. Please do not share it with anyone.

Thank you,
Smart Conforence Display System
        `;

        await sendMailAsync("Your One-Time Password (OTP)", body, user.email, tokenCache.getAccessToken());
        return { success: true, message: `Send OTP to ${user.email}` };
    } catch (err) {
        return { success: false, message: `${err.message}` };
    }
}

/**
 * ตรวจสอบ OTP ว่าถูกต้อง ใช้ไปแล้ว หรือหมดอายุหรือไม่
 * 
 * @param {String} email 
 * @param {String} otpCode 
 * @returns {Object} { success: Boolean, message: String, reset_token: String }
 */
async function verifyOTP(email, otpCode) {
    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return { success: false, message: 'Invalid credentials.' };
        }

        const otp = user.otp;
        if (!otp || !otp.code) {
            return { success: false, message: 'OTP not found for this user.' };
        }

        const now = Date.now();

        if (otp.used) {
            return { success: false, message: 'This OTP has already been used.' };
        }

        if (now > new Date(otp.expireAt).getTime()) {
            return { success: false, message: 'This OTP is expired.' };
        }

        if (otp.code !== otpCode) {
            return { success: false, message: 'Invalid OTP code.' };
        }

        user.otp.used = true;
        await user.save();
        const resetToken = jwt.sign({ email }, RESET_SECRET, { expiresIn: '10m' });

        return { success: true, message: 'OTP verified successfully.', token: resetToken };
    } catch (err) {
        return { success: false, message: err.message };
    }
}

/**
 * 
 * @param {String} resetToken 
 * @param {String} newPassword 
 * @returns {Object} { success: boolean, message: String }
 */
async function resetPassword(resetToken, newPassword) {
    try {
        const payload = jwt.verify(resetToken, RESET_SECRET);
        const user = await userModel.findOne({ email: payload.email });
        if (!user) {
            return { success: false, message: "User not found!" };
        }
        const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS));
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        user.password = hashedPassword;

        await user.save();

        return { success: true, message: "Password has been reset." };
    } catch (err) {
        return { success: false, message: err.message };
    }
}

module.exports = {
    GetScheduleData,
    addCacheandDB,
    sendscheduledata,
    fetchAllRoom,
    sendOTP,
    verifyOTP,
    resetPassword,
    getUserProfile

};