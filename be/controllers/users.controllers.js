require('dotenv').config({ path: './config/.env'});
const { authProvider } = require("../AuthProvider");
const syncAllRooms = require('../services/roomsync.services');
const { compareKey } = require('../services/pin.services');
const getGraphClient = require("../graph");
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

const getuser = async (req, res) => {
    const floor = req.params.floors;
    const room = req.params.rooms;
    const RoomNumber = `${floor}${room}`;
    console.log("RoomNumber:",RoomNumber)

    res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': process.env.FRONTEND_USERS
    });

    console.log("ready")

    const token = req.cookies.user_token;
    if (!token) {
        res.write(`event: error\ndata: ${JSON.stringify({ error: "No token, please ask admin for access" })}\n\n`);
        res.end();
        return;
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        const account = await authProvider.getAccountById(payload.homeAccountId);
        if (!account) {
            throw new Error("Session expired, please ask admin to login again");
        }
        let tokenResponse = await authProvider.acquireTokenSilent(
            account,
            [process.env.SCOPE]
        );

        const intervalId = setInterval(async () => {
            try {
                const now = new Date();
                const tomorrow = new Date(now);
                tomorrow.setDate(now.getDate() + 1);
                console.log("now:", now.toISOString())
                const startDateTime = now.toISOString().slice(0,10); //"2025-05-19"
                const endDateTime = tomorrow.toISOString().slice(0,10);

                const graphResponse = await getGraphClient(tokenResponse.accessToken)
                    .api(`https://graph.microsoft.com/v1.0/users/${RoomNumber}@tcc-technology.com/calendarView?`)
                    .query({
                        startDateTime: `${startDateTime}T00:00:00Z`,
                        endDateTime: `${endDateTime}T00:00:00Z`,
                        "$orderby": "start/dateTime",
                        "$select": "organizer,start,end,locations"
                    })
                    .get();
                if (!graphResponse || !graphResponse.value) {
                    throw new Error(`No value in graphResponse for room ${RoomNumber}: ${JSON.stringify(graphResponse)}`);
                }
                const results = graphResponse.value
                console.log("usersdate => ",results)
                res.write(`data: ${JSON.stringify({ results })}\n\n`);
                
            } catch (error) {
                res.write(`event: error\ndata: ${JSON.stringify({ error: "Failed to fetch data(setinterval)" })}\n\n`);
            }
        }, 3000);

    } catch (err) {
        res.write(`event: error\ndata: ${JSON.stringify({ error: "Token invalid or expired", detail: err.message })}\n\n`);
        res.end();
        return;
    }

    // Sync all rooms every 10 seconds
    syncAllRooms(req);
    const sintervalId = setInterval(() => {
        syncAllRooms(req);
    }, 10000); 
};

// controller function for pin validation
const keyPins = async (req, res) => {
    try {
        const { room, startDate, endDate, pin } = req.body;
        if (!room || !startDate || !endDate || !pin) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const isValid = await compareKey({ room, eventId, pin });

        return res.status(200).json({ pinValid: isValid });
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

// const keyExpired = async (req, res) => {
//     try {
//         const { room, eventId}
//     }
// }
module.exports = { getuser, keyPins };