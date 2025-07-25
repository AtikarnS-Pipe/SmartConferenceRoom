const { authProvider } = require("../utils/AuthProvider");
const { compareKey, adminCompareKey } = require('../services/pin.services');
require('dotenv').config({ path: './config/.env'});
const tokenCache = require("../utils/tokenCache");
const { getuserdatabyroom, waitUntil } = require('../services/users.services');
const { roomobject } = require('../utils/tokenCache');
const { GetDateTimeTH, GetDateTimeUTC } = require('../utils/getTodaydatetime');
// crud microsoft
const { GeteventId, createMSEvent } = require('../services/users.services');
const getGraphClient = require("../utils/graph");

// create ms room
const bookingkey = require('../models/bookingkey')
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

// รับ Roomnumber เเละ eventId ของการประชุมที่ต้องการลบ
const deleteroom = async (req, res) => {
    const { deleteRoomData } = req.body; // RoomNumber, email, startdatetime, enddatetime
    const AccessToken = tokenCache.getAccessToken();
    if (!AccessToken) {
        console.error("No refresh token found in cache...");
        throw new Error("No refresh token found in caches. Please login again.");
    }
    const calendarId = await GetIdRoomnumber(AccessToken, deleteRoomData.RoomNumber);
    const eventId = await GeteventId(AccessToken, calendarId, deleteRoomData.email, deleteRoomData.startdatetime, deleteRoomData.enddatetime); //datetime UTC: 2024-06-09T00:00:00Z

    console.log("Delete event request:", { calendarId, eventId });
    try {
        await getGraphClient(AccessToken)
        .api(`/me/calendars/${calendarId}/events/${eventId}`)
        .delete();

        console.log("Delete event success");
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
        const enddate = await GetDateTimeUTC();
        const newenddate = new Date(enddate);
        
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