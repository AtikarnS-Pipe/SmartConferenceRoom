const { authProvider } = require("../utils/AuthProvider");
const { compareKey, adminCompareKey } = require('../services/pin.services');
require('dotenv').config({ path: './config/.env' });
const tokenCache = require("../utils/tokenCache");
const { sendMQTTMessage } = require("../utils/SendMQTT");
const { getuserdatabyroom, waitUntil } = require('../services/users.services');
// crud microsoft
const { GeteventId, createMSEvent } = require('../services/users.services');
const getGraphClient = require("../utils/graph");
const pinstats = require('../models/RoomAccessLog');

// create ms room
const bookingkey = require('../models/bookingkey')

//end meeting ms
// const { GetTimeAPI } = require('../utils/getTodaydatetime');
// penalty alert email 
const sendMailAsync = require('../services/sendmail.services');
const getMailData = require("../templates/mailcontent_warning");

const getuser = async (req, res) => {
    const floor = req.params.floors;
    const room = req.params.rooms;
    const RoomNumber = `${floor}${room}`;
    if (process.env.DEBUG_MODE) console.log("RoomNumber:", RoomNumber)

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
    }, 6000);

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

        const room = parseInt(room_number.slice(2, 4), 10);
        const isValid = await compareKey({ eventId, pin });

        if (!isValid) {
            console.log(`Invalid pin for event: ${isValid}`);
            return res.status(200).json({ error: "Booking not found" });
        }

        const isOpen = await sendMQTTMessage(`floor15/access-control/cmd`, `open_${room}`);
        console.log(`MQTT message sent: ${isOpen}`);
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
        // console.log("Request body:", req.body);
        const { pin, room_number } = req.body;
        console.log("Pin:", pin, "Room Number:", room_number);
        if (!pin || !room_number) {
            return res.status(200).json({ message: "Missing required fields! " });
        }

        const room = parseInt(room_number.slice(2, 4), 10);
        const result = await adminCompareKey(pin, room_number);

        if (!result.success) {
            return res.status(200).json({ success: result.success, message: result.message });
        }
        console.log("Admin pin valid, sending MQTT command to open door");
        const isOpen = await sendMQTTMessage(`floor15/access-control/cmd`, `adminopen_${room}`); 
        console.log(`MQTT message sent: ${isOpen}`);
        if (!isOpen.success) {
            console.error(`Failed to send MQTT message: ${isOpen.error}`);
            return res.status(500).json({ error: "Failed to send MQTT message" });
        }

        return res.status(200).json({ success: result.success, message: result.message });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

// รับ eventId ของการประชุมที่ต้องการลบ
const deleteroom = async (req, res) => {
    if (process.env.DEBUG_MODE === "false") {
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
            const falselist = await waitUntil(async () => {
                const result = await bookingkey.findOneAndUpdate(
                    { eventId },
                    { isPinVerified: 'not access' },
                    { new: true }
                );
                console.log("[WaitUntil] result:", result);
                // ถ้ามี organizerMail แล้วถึงจะ return
                if (result?.organizerMail) return result;
                return null;
            }, 30000, 3000);
            const organizerEmail = falselist.organizerMail;

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
                                RoomNumber: Number(falselist.room)
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
    }
}

const createroom = async (req, res) => {
    const { createroomdata } = req.body;

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
    if (!pindata || !pindata.eventId || !pindata.room_number || !pindata.organizerMail || !pindata.pin || !pindata.startDateTime || !pindata.endDateTime) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const booking = await bookingkey.create({
            room: pindata.room_number,
            eventId: pindata.eventId,
            organizerMail: pindata.organizerMail,
            pin: pindata.pin,
            startDateTime: new Date(pindata.startDateTime),
            endDateTime: new Date(pindata.endDateTime),
            B_createdAt: new Date()
        });
        // const booking = await bookingkey.findOne({ eventId, room: room_number });
        if (!booking) return res.status(400).json({ error: "Not found eventId" });
        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error searching pin by event ID:", error);
        res.status(500).json({ success: false, error: "Failed to search pin by event ID" });
    }
}

const endmeeting = async (req, res) => {
    try {
        const { endmeetingdata } = req.body; // endmeetingdata = {eventId, startdatetime, isAllDay}
        const enddate = new Date(); // await GetTimeAPI('UTC');
        const newenddate = new Date(enddate);

        const AccessToken = tokenCache.getAccessToken();
        let startDateTime;
        if (endmeetingdata.isAllDay) {
            // Parse วันที่จาก startdatetime มาเป็นปี/เดือน/วัน
            const date = new Date(endmeetingdata.startdatetime);
            const year = date.getUTCFullYear();
            const month = date.getUTCMonth();      // zero‑based
            const day = date.getUTCDate();

            // สร้าง timestamp ของ 00:00 UTC
            const utcMidnight = Date.UTC(year, month, day);
            // บวก 1 ชั่วโมง (1 * 60 * 60 * 1000 ms)
            const oneHourMs = 1 * 60 * 60 * 1000;
            const dt = new Date(utcMidnight + oneHourMs);

            // toISOString() จะคืนแบบ "...Z" เราเลย .replace เพื่อได้ ".0000000"``
            startDateTime = dt.toISOString()           // e.g. "2025-07-21T18:00:00.000Z"
        } else {
            startDateTime = new Date(endmeetingdata.startdatetime).toISOString()
        }
        await getGraphClient(AccessToken)
            .api(`/me/events/${endmeetingdata.eventId}`)
            .update({
                // subject: Meeting in Room ${endmeetingdata.RoomNumber} has end,
                isAllDay: false,
                start: {
                    dateTime: startDateTime,
                    timeZone: "UTC"
                },
                end: {
                    dateTime: newenddate.toISOString(),
                    timeZone: "UTC"
                },
            })
        console.log("Update event success");
        const room = parseInt(endmeetingdata.room_number.slice(2, 4), 10);
        console.log("Room for close door:", room);
        const isClosed = await sendMQTTMessage(`floor15/access-control/cmd`, `close_${room}`);
        console.log(`MQTT message sent: ${isClosed}`);
        if(!isClosed.success) throw new Error(isClosed.error);

        res.status(200).json({ message: "Update event successfully" });
    } catch (error) {
        console.error("Error in endtask:", error);
        res.status(500).json({ error: "Failed to end task" });
    }
}

const closedoor = async (req, res) => {
    const { room_number } = req.body;
    if (!room_number) return res.status(400).json({ error: "RoomNumber is Missing" });
    const room = parseInt(room_number.slice(2, 4), 10);
    console.log("Room for close door:", room);
    try {
        const isClosed = await sendMQTTMessage(`floor15/access-control/cmd`, `close_${room}`);
        console.log(`MQTT message sent: ${isClosed}`);
        if(!isClosed.success) throw new Error(isClosed.error);
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
