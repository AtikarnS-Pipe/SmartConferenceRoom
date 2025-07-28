const { authProvider } = require("../utils/AuthProvider");
const { compareKey, adminCompareKey } = require('../services/pin.services');
require('dotenv').config({ path: './config/.env'});
const tokenCache = require("../utils/tokenCache");
const { getuserdatabyroom, waitUntil } = require('../services/users.services');
const { roomobject } = require('../utils/tokenCache');
// crud microsoft
const { GeteventId, createMSEvent } = require('../services/users.services');
const getGraphClient = require("../utils/graph");
const pinstats = require('../models/RoomAccessLog');

// create ms room
const bookingkey = require('../models/bookingkey')

//end meeting ms
const { GetTimeAPI } = require('../utils/getTodaydatetime');
// penalty alert email 
const sendMailAsync = require('../services/sendmail.services');

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
    }, 3000);

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
        const { eventId, pin } = req.body;
        if (!eventId || !pin) {
            return res.status(200).json({ error: "Missing required fields!" });
        }

        const isValid = await compareKey({ eventId, pin });

        if (!isValid) {
            console.log(`Invalid pin for event: ${isValid}`);
            return res.status(200).json({ error: "Booking not found" });
        }

        return res.status(200).json({ pinValid: isValid });
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

const keyExpired = async (req, res) => {
    try {
        const { eventId } = req.body;
        if ( !eventId ) {
            return res.status(200).json({ error: "Missing required fields!" });
        }

        // const token = req.cookies.user_token;
        //  if (!token) {
        //     throw new Error("No accessToken");
        // }
        // const payload = jwt.verify(token, JWT_SECRET);
        // const account = await authProvider.getAccountById(payload.homeAccountId);
        // if (!account) {
        //     throw new Error("Session expired, please ask admin to login again");
        // }
        // let tokenResponse = await authProvider.acquireTokenSilent(
        //     account,
        //     [process.env.SCOPE]
        // );

        const isCompleted = await deleteSchedule({ eventId });
        
        if (!isCompleted) {
            return res.status(200).json({ error: "Booking not found" });
        }

        return res.status(200).json({ message: `Event: ${ eventId } has been removed!`});
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error "});
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

        const result = await adminCompareKey( pin, room_number );

        if (!result.success) {
            return res.status(200).json({ success: result.success, message: result.message });
        }

        return res.status(200).json({ success: result.success, message: result.message });
    } catch (err) {
        return res.status(500).json({ message: result.message });
    }
}

// รับ eventId ของการประชุมที่ต้องการลบ
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
        const falselist = await waitUntil(async () => {
            const result = await bookingkey.findOneAndUpdate(
                { eventId },
                { isPinVerified: 'not access' },
                { new: true }
            );

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
                            missedAt: await GetTimeAPI('Asia/Bangkok'),
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
                const mailData = {
                    subject: `Usage Warning - Smart Conference Display System`,
                    body: `Dear User,

We are writing to inform you that our system has recorded five or more instances of unattended room reservations under your account.

This notification serves as a formal reminder to ensure responsible use of the conference room booking system. Unattended reservations without prior cancellation impact the availability of facilities for other users.

Account Information:
- Email: ${organizerEmail}
- Total Missed Bookings: ${countbacklist.pinMissCount}
- Status: Warning Issued

We kindly ask that you review your future bookings and cancel in advance if you are unable to attend. Continued misuse may lead to temporary suspension of your booking privileges.

Thank you for your attention and cooperation.

Sincerely,
Smart Conference Display System Administration Team`,
                    recipient: organizerEmail, // ส่งให้คนที่จองห้อง
                    accessToken: tokenCache.getAccessToken(),
                };
                
                try {
                    await sendMailAsync(mailData.subject, mailData.body, mailData.recipient, mailData.accessToken);
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

const createroom = async (req, res) => { // createroomdata = {RoomNumber, startdatetime, enddatetime, subject}
    const { createroomdata } = req.body; // datetime UTC: 2024-06-09T00:00:00Z 
    if (!createroomdata || !createroomdata.RoomNumber || !createroomdata.startdatetime || !createroomdata.enddatetime) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const AccessToken = tokenCache.getAccessToken();
    if (!AccessToken) {
        console.error("No refresh token found in cache...");
        throw new Error("No refresh token found in caches. Please login again.");
    }
    // const calendarId = await GetIdRoomnumber(AccessToken, RoomNumber);
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
        const booking = await waitUntil(() => bookingkey.findOne({ eventId, room: room_number }), 30000, 1000);
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
        const enddate = await GetTimeAPI('UTC');
        const newenddate = new Date(enddate);
        console.log("Enddate data3333:", newenddate.toISOString());
        
        const AccessToken = tokenCache.getAccessToken();
        let startDateTime;
        if (endmeetingdata.isAllDay) {
        // Parse วันที่จาก startdatetime มาเป็นปี/เดือน/วัน
        const date = new Date(endmeetingdata.startdatetime);
        const year  = date.getUTCFullYear();
        const month = date.getUTCMonth();      // zero‑based
        const day   = date.getUTCDate();

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