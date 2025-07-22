const { authProvider } = require("../utils/AuthProvider");
const { compareKey, adminCompareKey } = require('../services/pin.services');
require('dotenv').config({ path: './config/.env'});
const tokenCache = require("../utils/tokenCache");
const { getuserdatabyroom, waitUntil } = require('../services/users.services');
const { roomobject } = require('../utils/tokenCache');
// crud microsoft
const {  GeteventId, createMSEvent } = require('../services/users.services');
const getGraphClient = require("../utils/graph");

// create ms room
const bcrypt = require('bcryptjs')
const bookingkey = require('../models/bookingkey')
// penalty alert email 
const sendMailAsync = require('../services/sendmail.services');

const { sendMQTTMessage } = require('../utils/SendMQTT')

function randomPin() {
  return Math.floor(1000 + Math.random() * 9000).toString(); // 0.000-0.999*9000ได้ 0-8999 + 1000 จะได้ Range 1000-9999 
}
const getuser = async (req, res) => {
    const floor = req.params.floors;
    const room = req.params.rooms;
    const RoomNumber = `${floor}${room}`;
    if(process.env.DEBUG_MODE) console.log("RoomNumber:",RoomNumber)

    res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': process.env.FRONTEND_USERS
    });
    
    getuserdatabyroom(res, RoomNumber);
    const intervalId = setInterval(async () => {
        getuserdatabyroom(res, RoomNumber);
    }, 5000);

    // จัดการ cleanup 
    req.on('close', () => {
        clearInterval(intervalId);
        console.log(`SSE connection closed for room ${RoomNumber}`);
    });

    req.on('error', (err) => {
        clearInterval(intervalId);
        console.error('SSE request error:', err);
    });

    res.on('finish', () => {
        clearInterval(intervalId);
        console.log(`Response finished for room ${RoomNumber}`);
    });
};

// controller function for pin validation
const keyPins = async (req, res) => {
    try {
        const { eventId, pin, room_number } = req.body;
        if (!eventId || !pin || !room_number) {
            return res.status(200).json({ error: "Missing required fields!" });
        }
        const room = room_number.slice(2,4);
        const isValid = await compareKey({ eventId, pin });

        if (!isValid) {
            console.log(`Invalid pin for event: ${isValid}`);
            return res.status(200).json({ error: "Booking not found" });
        }
        // const isOpen = await sendMQTTMessage(`floor15/access-control/${room}`, 'open'); 
        // console.log(`MQTT message sent: ${isOpen}`);
        // if (!isOpen.success) {
        //     console.error(`Failed to send MQTT message: ${isOpen.error}`);
        //     return res.status(500).json({ error: "Failed to send MQTT message" });
        // }
        return res.status(200).json({ pinValid: isValid });
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

// admin pin insertion
const adminKeyPin = async (req, res) => {
    try {
        console.log(`${req.method} ${req.originalUrl}`);
        // console.log("Request body:", req.body);
        const { pin, room_number } = req.body;
        console.log("Pin:", pin, "Room Number:", room_number);
        if ( !pin || !room_number ) {
            return res.status(200).json({ message: "Missing required fields! "});
        }
        const room = room_number.slice(2,4);
        const result = await adminCompareKey( pin, room_number );

        if (!result.success) {
            return res.status(200).json({ success: result.success, message: result.message });
        }
        // const isOpen = await sendMQTTMessage(`floor15/access-control/${room}`, 'open'); 
        // console.log(`MQTT message sent: ${isOpen}`);
        // if (!isOpen.success) {
        //     console.error(`Failed to send MQTT message: ${isOpen.error}`);
        //     return res.status(500).json({ error: "Failed to send MQTT message" });
        // }

        return res.status(200).json({ success: result.success, message: result.message });x
    } catch (err) {
        return res.status(500).json({ message: result.message });
    }
}

// รับ Roomnumber เเละ eventId ของการประชุมที่ต้องการลบ
const deleteroom = async (req, res) => {
    const { eventId } = req.body; // , eventId
    const AccessToken = tokenCache.getAccessToken();
    if (!AccessToken) {
        console.error("No refresh token found in cache...");
        throw new Error("No refresh token found in caches. Please login again.");
    }
    try {
        await getGraphClient(AccessToken)
        .api(`/me/events/${eventId}`)
        .delete();

        console.log("Delete event success");
        const countbacklist = await bookingkey.findOneAndUpdate(
            { eventId }, // หา booking key ที่ตรงกับ eventId
            { $inc: { pinMissCount: +1 }, isPinVerified: false }, // count by 1
            { new: true } 
        );
        if (!countbacklist) return res.status(404).json({ error: "Booking key not found for the given eventId" });
        console.log("Booking key count updated:", countbacklist);
        // send mail alert
        if (countbacklist.pinMissCount >= 5){
            const mailData = {
                subject: `Warning: การจองห้องเเล้วมาไม่มาใช้งานตามที่กำหนด`,
                body: `คุณใช้งานระบบ Smart Conference Display System ได้ทำการจองห้องประชุม เเละไม่ได้มาใช้งานตามที่กำหนดเกิน 5 ครั้ง กรุณาติดต่อผู้ดูเเลระบบหากมีข้อสงสัย \n\nThack you\nSmart Conforence Display System`,
                recipient: process.env.CENTERLIZED_MAIL, // คนรับใคร เดี๋ยวค่อยเเก้ไข // countbacklist.organizerMail *********************************************
                accessToken: tokenCache.getAccessToken(),
            };
            await sendMailAsync(mailData.subject, mailData.body, mailData.recipient, mailData.accessToken);
            console.log(`Pin verified and email sent for event: ${eventId}`);
            console.log(`📧 Email alert sent to ${mailData.recipient}`);
        }
        res.status(200).json({ message: "Event deleted successfully" });
    } catch (error) {
        console.error("Error deleting event:", error);
        res.status(500).json({ error: "Failed to delete event" });
    }
}

const createroom = async (req, res) => { // createroomdata = {RoomNumber, startdatetime, enddatetime}
    const { createroomdata } = req.body; // datetime UTC: 2024-06-09T00:00:00Z 
    if (!createroomdata || !createroomdata.RoomNumber || !createroomdata.startdatetime || !createroomdata.enddatetime) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    console.log("Create room data:", createroomdata);
    const { RoomNumber, startdatetime, enddatetime } = createroomdata;
    const AccessToken = tokenCache.getAccessToken();
    if (!AccessToken) {
        console.error("No refresh token found in cache...");
        return res.status(401).json({ error: "Access token expired. Please login again." });
    }
    try {
        const iscreated = await createMSEvent(AccessToken, createroomdata);
        if (!iscreated) {
            throw new Error("Failed to create event");
        }
        console.log(`Booking ${createroomdata.RoomNumber} with Meetingroom`);
        res.status(200).json({ success: true });

    } catch (error) {
        console.error("Error create event:", error);
        res.status(500).json({ error: error.message || "Failed to create event" });
    }
}

const searchpinByeventId = async (req, res) => {
    const { eventId, room_number } = req.body;
    if (!eventId) return res.status(400).json({ error: "Event ID is required" });

    try {
        const booking = await waitUntil(() => bookingkey.findOne({ eventId, room: room_number }), 15000, 1000);
        // const booking = await bookingkey.findOne({ eventId, room: room_number });
        if (!booking) return res.status(404).json({ error: "Not found eventId" });
        res.status(200).json({ success: true, pin: booking.pin });
    } catch (error) {
        console.error("Error searching pin by event ID:", error);
        res.status(500).json({ success: false, error: "Failed to search pin by event ID" });
    }
}

const endmeeting = async (req, res) => {
    try{
        const { endmeetingdata } = req.body; // endmeetingdata = {eventId, startdatetime, isAllDay}
        
        const AccessToken = tokenCache.getAccessToken();
        let startDateTime;
        if (endmeetingdata.isAllDay) {
            const now = new Date();
            // สร้างวันที่ใหม่ของวันนี้ตอน 00:00 ตามเขตเวลา -7
            const midnightLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // 00:00 ตาม local
            // ปรับ -7 ชั่วโมง (เปลี่ยนเป็น UTC)
            startDateTime = new Date(midnightLocal.getTime() + 8 * 60 * 60 * 1000).toISOString(); // = 17:00 วันก่อนหน้า UTC
        } else {
            startDateTime = new Date(endmeetingdata.startdatetime).toISOString();
        }
        await getGraphClient(AccessToken)
        .api(`/me/events/${endmeetingdata.eventId}`)
        .update({
            // subject: `Meeting in Room ${endmeetingdata.RoomNumber} has end`,
            isAllDay: false,
            start: {
                dateTime: startDateTime,
                timeZone: "UTC"
            },
            end: {
                dateTime: new Date().toISOString(), // ใช้เวลาปัจจุบันเป็นเวลาสิ้นสุด ex.test == "2025-07-10T12:45:00Z"
                timeZone: "UTC"
            },
        })
        console.log("Update event success");
        res.status(200).json({ message: "Update event successfully" });
    } catch(error){
        console.error("Error in endtask:", error);
        res.status(500).json({ error: "Failed to end task" });
    }
}  

const closedoor = async (req, res) => {
    const { room_number } = req.body;
    if (!room_number) return res.status(400).json({ error: "RoomNumber is Missing" }); 
    const room = room_number.slice(2,4);

    try{
        // const isClosed = await sendMQTTMessage(`floor15/access-control/${room}`, 'close');
        // console.log(`MQTT message sent: ${isClosed}`);
        // if(!isClosed.success) throw new Error(isClosed.error);
        return res.status(200).json({ success: true, message: `Door for room ${room_number} closed successfully` });
    } catch (error){
        console.error(`Error closing door for room ${room_number}:`, error)
        res.status(500).json({ error: "Failed to close door", detail: error.message });
    }
}

module.exports = { 
    getuser
    , keyPins, searchpinByeventId
    , adminKeyPin, closedoor
    , deleteroom, createroom ,endmeeting
};