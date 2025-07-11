const { authProvider } = require("../AuthProvider");
const { compareKey, deleteSchedule, adminCompareKey } = require('../services/pin.services');
require('dotenv').config({ path: './config/.env'});
const tokenCache = require("../utils/tokenCache");
const { getuserdatabyroom } = require('../services/users.services');
// crud microsoft
const { GetIdRoomnumber, GeteventId, createMSEvent } = require('../services/users.services');
const getGraphClient = require("../graph");

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

        return res.status(200).json({ success: result.success, message: result.message });x
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
        const iscreated = await createMSEvent(AccessToken, createroomdata)
        if (!iscreated) {
            throw new Error("Failed to create event");
        }
        console.log("Create event success");
        res.status(200).json({ message: "Event Create successfully"});

    } catch (error) {
        console.error("Error create event:", error);
        res.status(500).json({ error: error.message || "Failed to create event" });
    }
}

const endmeeting = async (req, res) => {
    try{
        const { endmeetingdata } = req.body; // endmeetingdata = {RoomNumber, email, startdatetime, enddatetime}
        
        const AccessToken = tokenCache.getAccessToken();
        const calendarId = await GetIdRoomnumber(AccessToken, endmeetingdata.RoomNumber)
        const eventId = await GeteventId(AccessToken, calendarId, endmeetingdata.email, endmeetingdata.startdatetime, endmeetingdata.enddatetime); // datetime UTC: 2024-06-09T00:00:00Z
        if(!eventId){
            console.error("No event found for the given details:", endmeetingdata);
            return res.status(404).json({ error: "No event found for end meeting" });
        }
        

        await getGraphClient(AccessToken)
        .api(`/me/calendars/${calendarId}/events/${eventId}`)
        .update({
            subject: `Meeting in Room ${endmeetingdata.RoomNumber} has end`,
            start: {
                dateTime: new Date(endmeetingdata.startdatetime).toISOString(),
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

module.exports = { getuser
    , keyPins, keyExpired, adminKeyPin
    , deleteroom, createroom ,endmeeting
};