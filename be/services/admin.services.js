const getGraphClient = require("../utils/graph");
const Token = require('../models/token');
const tokenCache = require('../utils/tokenCache')
const { getTodaydatetime } = require('../utils/getTodaydatetime');
const userModel = require('../models/User');
const bookingKey = require('../models/bookingkey');
const sendMailAsync = require('../services/sendmail.services')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { roomobject } = require('../utils/tokenCache');
require('dotenv').config({ path: '../config/.env' });

const RESET_SECRET = process.env.JWT_RESET_SECRET || "jwt-reset-secret";

async function GetScheduleData(actoken, Room, start, end) {
  try {
    const tzOffset = 7 * 60; // Thailand UTC+7 (minutes)
    const startYear = parseInt(start.slice(4, 8), 10);
    const startMonth = parseInt(start.slice(2, 4), 10) - 1;
    const startDay = parseInt(start.slice(0, 2), 10);
    const endYear = parseInt(end.slice(4, 8), 10);
    const endMonth = parseInt(end.slice(2, 4), 10) - 1;
    const endDay = parseInt(end.slice(0, 2), 10);

    const startTH = new Date(Date.UTC(startYear, startMonth, startDay, 0, 0, 0, 1) - tzOffset * 60 * 1000);
    const endTH = new Date(Date.UTC(endYear, endMonth, endDay, 23, 59, 59, 999) - tzOffset * 60 * 1000);

    const startDateTime = startTH.toISOString();
    const endDateTime = endTH.toISOString();

    if (process.env.DEBUG_MODE)
      console.log("start query schedule(UTC):", startDateTime, endDateTime);

    if (!actoken) throw new Error("No access token in schedule Page.");

    // 1. Query จาก Microsoft Graph API
    const graphResponse = await getGraphClient(actoken)
      .api(`https://graph.microsoft.com/v1.0/users/${Room}@tcc-technology.com/calendarView?`)
      .query({
        startDateTime: startDateTime,
        endDateTime: endDateTime,
        "$orderby": "start/dateTime",
        "$top": 100,
        "$select": "id,organizer,subject,start,end,locations",
        "$filter": "isCancelled eq false"
      })
      .get();

    if (!graphResponse || !graphResponse.value) {
      throw new Error(`No value in graphResponse for room ${Room}: ${JSON.stringify(graphResponse)}`);
    }

    const graphEvents = graphResponse.value;

    // 2. แก้ไข Query DB - ใช้เงื่อนไขที่ถูกต้อง
    const bookingPins = await bookingKey.find({
        room: Room,
        startDateTime: { $lte: endDateTime }, // event เริ่มก่อนที่ช่วงจะจบ กำหนด over lap เพราะด้านบนกำหนดเสี้ยววิไว้
        endDateTime: { $gte: startDateTime }  // และ event จบหลังที่ช่วงเริ่ม
    }).select("eventId room organizerMail pin isPinVerified startDateTime endDateTime");
    
    console.log("📋 DB Query Result:", bookingPins.length, "records found");
    console.log("admin booking pins =>", bookingPins);

    // 3. normalize fn. ปรับรูปเเบบเวลาก่อนเปรียบเทียบ
    const normalize = (dateStr) => {
      if (typeof dateStr === 'string') {
        // ตัด nanoseconds ออก แล้วแปลงเป็น Date
        let cleanDateStr = dateStr.replace(/\.\d{7}/, '.000');
        // เพิ่ม Z ถ้าไม่มี
        if (!cleanDateStr.endsWith('Z')) {
          cleanDateStr += 'Z';
        }
        return new Date(cleanDateStr).getTime();
      }
      return new Date(dateStr).getTime();
    };

    // 4. ปรับปรุงการ match - เพิ่มการเปรียบเทียบ eventId
    const mergedResults = graphEvents.map(ev => {
        const tolerance = 1000; // 1 วินาที = 1000 ms

        const matched = bookingPins.find(p => {
        const dbStart = normalize(p.startDateTime);
        const dbEnd   = normalize(p.endDateTime);
        const evStart = normalize(ev.start.dateTime + 'Z');
        const evEnd   = normalize(ev.end.dateTime + 'Z');

        // ✅ ตรงกันถ้าเวลาต่างกันไม่เกิน 1 วินาที
        const startMatch = Math.abs(dbStart - evStart) <= tolerance;
        const endMatch   = Math.abs(dbEnd - evEnd) <= tolerance;

        return startMatch && endMatch;
        });

        return {
            eventId: matched ? matched.eventId : "" ,
            organizer: ev.organizer?.emailAddress?.address,
            subject: ev.organizer?.emailAddress?.name,
            start: ev.start.dateTime,
            end: ev.end.dateTime,
            room: Room,
            pin: matched && matched.pin ? matched.pin : "",
            isPinVerified: matched ? matched.isPinVerified : "",
        };
    });

    console.log("admin schedule merged =>", mergedResults);
    return mergedResults;

  } catch (error) {
    console.error("error in GetScheduleData:", error);
    return [];
  }
}

async function sendscheduledata(req, res) {
    try {
        const Room = Number(req.params.Room);
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
        
        // สร้าง JWT token สำหรับ authorized user
        const jwtPayload = {
            role: 'admin',
            email: 'authorized', // ใส่ข้อมูล user ที่เหมาะสม
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // expire ใน 24 ชั่วโมง
        };
        
        const jwtToken = jwt.sign(jwtPayload, process.env.JWT_SECRET || 'fallback-secret');
        // console.log("🔑 Created JWT token for authorized user");
        
        res.write(`data: ${JSON.stringify({ 
            results, 
            token: jwtToken,
            role: 'admin'
        })}\n\n`);
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
        const user = await userModel.findOne({ email: payload.email, role: { $ne: 'Deactivate' } });
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