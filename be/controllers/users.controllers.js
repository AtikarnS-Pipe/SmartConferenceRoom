// Database
const { MqttState } = require("../models/MqttState");
const bookingkey = require("../models/bookingkey");

const { compareKey, adminCompareKey } = require('../services/pin.services');
require('dotenv').config({ path: './config/.env' });
const tokenCache = require("../utils/tokenCache");
const { sendMQTTMessage } = require("../services/mqtt/SendMQTT");
const { getuserdatabyroom, waitUntil, endMeetingService } = require('../services/users.services');
// crud microsoft
const { GeteventId, createMSEvent } = require('../services/users.services');
const getGraphClient = require("../utils/graph");
const pinstats = require('../models/RoomAccessLog');
const { getInterval, setIntervalMs } = require("../utils/pollingService");


// create ms room

//end meeting ms
// const { GetTimeAPI } = require('../utils/getTodaydatetime');
// penalty alert email 
const sendMailAsync = require('../services/sendmail.services');
const getMailData = require("../templates/mailcontent_warning");

const isDebug = (process.env.DEBUG_MODE || "true") === "true";
const except_rooms = (process.env.EXECPT_ROOMS || "").split(",").map(num => Number(num.trim()));

const getuser = async (req, res) => {
    const floor = req.params.floors;
    const room = req.params.rooms;
    const RoomNumber = `${floor}${room}`;
    if (isDebug) console.log("RoomNumber:", RoomNumber)

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
        // }, 4000);
    }, getInterval());

    // จัดการ cleanup 
    req.on('close', () => {
        clearInterval(intervalId);
        // console.log(`SSE connection closed for room ${RoomNumber}`);
    });

    req.on('error', (err) => {
        clearInterval(intervalId);
        // console.error('SSE request error:', err);
    });

    res.on('finish', () => {
        clearInterval(intervalId);
        // console.log(`Response finished for room ${RoomNumber}`);
    });
};

// controller function for pin validation
const keyPins = async (req, res) => {
    try {
        const { eventId, pin, room_number } = req.body;
        if (!eventId || !pin || !room_number) {
            return res.status(200).json({ error: "Missing required fields!" });
        }

        const floor = parseInt(room_number.slice(0, 2), 10);
        const room = parseInt(room_number.slice(2, 4), 10);
        const isValid = await compareKey({ eventId, pin });

        if (!isValid) {
            console.log(`Invalid pin for event: ${isValid}`);
            return res.status(200).json({ error: "Booking not found" });
        }

        const isOpen = await sendMQTTMessage(process.env.MQTT_TOPIC_CMD, `open_${floor}>${room}`);
        if (!isOpen.success) {
            console.error(`Failed to send MQTT message: ${isOpen.error}`);
            return res.status(500).json({ error: "Failed to send MQTT message" });
        }
        return res.status(200).json({ pinValid: isValid });
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

// admin pin insertion
const adminKeyPin = async (req, res) => {
    try {
        console.log(`${req.method} ${req.originalUrl}`);

        const { pin, room_number } = req.body;
        console.log("Pin:", pin, "Room Number:", room_number);
        if (!pin || !room_number) {
            return res.status(200).json({ message: "Missing required fields! " });
        }

        const floor = parseInt(room_number.slice(0, 2), 10);
        const room = parseInt(room_number.slice(2, 4), 10);
        const result = await adminCompareKey(pin, room_number);

        if (!result.success) {
            return res.status(200).json({ success: result.success, message: result.message });
        }

        // check current state now in database
        const currentState = await MqttState.findOne({ Meeting_room: room_number });

        if (currentState && currentState.state === "open") {
            console.log(`Room ${room_number} is already open. Skipping MQTT send.`);
            return res.status(200).json({
                success: true,
                message: `Room ${room_number} is already open`
            });
        }
        console.log("Admin pin valid, sending MQTT command to open door");

        const isOpen = await sendMQTTMessage(process.env.MQTT_TOPIC_CMD, `adminopen_${floor}>${room}`);
        if (!isOpen.success) {
            console.error(`Failed to send MQTT message: ${isOpen.error}`);
            return res.status(500).json({ error: "Failed to send MQTT message" });
        }

        return res.status(200).json({ success: result.success, message: result.message });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

// รับ eventId, room_number ของการประชุมที่ต้องการลบ
const deleteroom = async (req, res) => {
    if (isDebug) {
        return res.status(200).json({ message: "Debug mode - skip delete" });
    }

    const { eventId, room_number } = req.body; // eventId, room_number
    if (except_rooms.includes(Number(room_number))) {
        return res.status(200).json({ message: `Room ${room_number} is in the exception list, skip delete.` });
    }
    const AccessToken = tokenCache.getAccessToken();
    if (!AccessToken) {
        return res.status(401).json({ error: "No refresh token found. Please login again." });
    }
    try {
        const eventRecord = await waitUntil(async () => {
            const try_eventRecord = await bookingkey.findOne(
                { eventId, room: room_number },
                { isPinVerified: 1, organizerMail: 1, room: 1 }
            );
            // ถ้าหาข้อมูลเจอ แล้วถึงจะ return ไม่งั้นก็วนรอไปก่อน safety timeout
            if (try_eventRecord) return try_eventRecord;
            return null;
        }, 10000, 2000);

        if (!eventRecord) {
            return res.status(404).json({ message: "Event not found in DB" });
        }

        // ถ้า verify แล้ว หรือลบเเล้ว → ไม่ต้องลบ
        if (eventRecord.isPinVerified === true || eventRecord.isPinVerified === "true" || eventRecord.isPinVerified === "not access") {
            return res.status(200).json({
                message: `Event ${eventId} already verified by PIN or was deleted. Skip delete.`,
            });
        }

        await getGraphClient(AccessToken)
            .api(`/me/events/${eventId}`)
            .delete();

        eventRecord.isPinVerified = "not access";
        await eventRecord.save();
        const organizerEmail = eventRecord.organizerMail;

        if (organizerEmail && organizerEmail !== process.env.CENTERLIZED_MAIL) {
            // ใช้ upsert เพื่อสร้างใหม่หากไม่มี หรือ update หากมีอยู่แล้ว
            const countbacklist = await pinstats.findOneAndUpdate(
                { organizerMail: organizerEmail }, // หาด้วย organizerMail
                {
                    $inc: { pinMissCount: +1 }, // เพิ่มจำนวนครั้งที่ miss
                    $push: {
                        EventId: {
                            eventId,
                            missedAt: new Date(), //await GetTimeAPI('Asia/Bangkok'),
                            RoomNumber: Number(eventRecord.room)
                        }
                    }
                },
                {
                    new: true, // return document หลัง update
                    upsert: true, // สร้างใหม่ถ้าไม่มี
                    setDefaultsOnInsert: true // set default values เมื่อสร้างใหม่
                }
            );

            console.log(`Miss count for ${organizerEmail}: ${countbacklist.pinMissCount}`);

            if (countbacklist.pinMissCount % 5 === 0) { // ส่งเมลเตือนถ้าครบ 5 ครั้ง
                await pinstats.findOneAndUpdate(
                    { organizerMail: organizerEmail },
                    { isBanned: true },
                    { new: true }
                );

                try {
                    const mailData = getMailData(organizerEmail, countbacklist);
                    await sendMailAsync(mailData.subject, mailData.body, organizerEmail, AccessToken);
                    console.log(`📧 Warning email sent to ${organizerEmail} (${countbacklist.pinMissCount} misses)`);
                } catch (emailError) {
                    console.error("Error sending warning email:", emailError);
                }
            }
        }
        res.status(200).json({ message: "Event deleted successfully" });
    } catch (error) {
        console.error("Error deleting event:", error);
        res.status(500).json({ error: "Failed to delete event" });
    }
};

const createroom = async (req, res) => {
    const { createroomdata } = req.body; // createroomdata = {RoomNumber, startdatetime, enddatetime, subject}

    if (!createroomdata ||
        !createroomdata.RoomNumber ||
        !createroomdata.startdatetime ||
        !createroomdata.enddatetime) {
        return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const AccessToken = tokenCache.getAccessToken();
    if (!AccessToken) {
        console.error("No access token found in cache.");
        return res.status(400).json({ success: false, error: "Please login again." });
    }

    try {
        setIntervalMs(3000, 15000); // ปรับเป็น 3000 วินาที และรีเซ็ตหลัง 20 วินาที
        const isCreated = await createMSEvent(AccessToken, createroomdata);
        if (!isCreated) return res.status(400).json({ success: false, error: "Event creation failed." });

        console.log(`Booking created for room ${createroomdata.RoomNumber}`);
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error during createMSEvent:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
};


const createsearchpin = async (req, res) => {
    const { pindata } = req.body;
    console.log("start create date now:", new Date().toISOString());

    if (!pindata || !pindata.eventId || !pindata.room_number || !pindata.organizerMail || !pindata.pin || !pindata.startDateTime || !pindata.endDateTime) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const booking = await bookingkey.create({
            room: pindata.room_number,
            eventId: pindata.eventId,
            organizerMail: pindata.organizerMail,
            pin: pindata.pin,
            startDateTime: new Date(pindata.startDateTime + "Z"),
            endDateTime: new Date(pindata.endDateTime + "Z"),
            B_createdAt: new Date()
        });
        // const booking = await bookingkey.findOne({ eventId, room: room_number });
        if (!booking) return res.status(400).json({ error: "Not found eventId" });
        console.log("end create date now:", new Date().toISOString());

        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error searching pin by event ID:", error);
        res.status(500).json({ success: false, error: "Failed to search pin by event ID" });
    }
}

const endmeeting = async (req, res) => {
    try {
      const { endmeetingdata } = req.body;
  
      const result = await endMeetingService(endmeetingdata);
  
      if (!result.dbUpdated) {
        console.warn(`Event ID ${endmeetingdata.eventId} not found in bookingkey`);
      }
  
      console.log(`End meeting success for ${endmeetingdata.eventId}`);
      res.status(200).json({ message: "Update event successfully" });
  
    } catch (error) {
      console.error("Error in endmeeting:", error);
      res.status(500).json({ error: "Failed to end meeting" });
    }
};

const closedoor = async (req, res) => {
    const { room_number } = req.body;
    if (!room_number) return res.status(400).json({ error: "RoomNumber is Missing" });
    const floor = parseInt(room_number.slice(0, 2), 10);
    const room = parseInt(room_number.slice(2, 4), 10);
    console.log("Room for close door:", room);
    try {
        const isClosed = await sendMQTTMessage(process.env.MQTT_TOPIC_CMD, `close_${floor}>${room}`);
        if (!isClosed.success) throw new Error(isClosed.error);
        return res.status(200).json({ success: true, message: `Door for room ${room_number} closed successfully` });
    } catch (error) {
        console.error(`Error closing door for room ${room_number}:`, error)
        res.status(500).json({ error: "Failed to close door", detail: error.message });
    }
}

module.exports = {
    getuser
    , keyPins, createsearchpin
    , adminKeyPin, closedoor
    , deleteroom, createroom, endmeeting
};
