const { authProvider } = require("../AuthProvider");
const { compareKey, deleteSchedule } = require('../services/pin.services');
require('dotenv').config({ path: './config/.env'});
const getGraphClient = require("../graph");
const tokenCache = require("../utils/tokenCache")
const {decryptToken} = require('../utils/encode')


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

    
    const intervalId = setInterval(async () => {
        try {
            await tokenCache.isTokenExpired();
            console.log('check expired success!')
            const tzOffset = 7 * 60; // Thailand UTC+7 (minutes)
            // Get current date in Thailand
            const now = new Date();
            const thYear = now.getFullYear();
            const thMonth = now.getMonth();
            const thDate = now.getDate();

            // Start of today in Thailand (00:00)
            const startTH = new Date(Date.UTC(thYear, thMonth, thDate, 0, 0) - tzOffset * 60 * 1000);
            // End of today in Thailand (23:59)
            const endTH = new Date(Date.UTC(thYear, thMonth, thDate, 23, 59) - tzOffset * 60 * 1000);

            const startDateTime = startTH.toISOString();
            const endDateTime = endTH.toISOString();

            console.log("Users_startDateTime (UTC):", startDateTime);
            console.log("Users_endDateTime (UTC):", endDateTime);
            
            const startTHLocal = new Date(startDateTime);
            const endTHLocal = new Date(endDateTime);   
            startTHLocal.setHours(startTHLocal.getHours() + 7);
            endTHLocal.setHours(endTHLocal.getHours() + 7);

            if(!decryptToken(tokenCache.getAccessToken())){
                throw new Error("No access token in Users")
            }
            const graphResponse = await getGraphClient(decryptToken(tokenCache.getAccessToken()))
                .api(`https://graph.microsoft.com/v1.0/users/${RoomNumber}@tcc-technology.com/calendarView`)
                .query({
                    startDateTime: startDateTime,
                    endDateTime: endDateTime,
                    "$orderby": "start/dateTime",
                    "$select": "id,organizer,start,end,locations"
                })
                .get();
            if (!graphResponse || !graphResponse.value) {
                throw new Error(`No value in graphResponse for room ${RoomNumber}: ${JSON.stringify(graphResponse)}`);
            }
            const results = graphResponse.value
            console.log("usersdate => ",results)
            res.write(`data: ${JSON.stringify({ results })}\n\n`);
            
        } catch (error) {
            console.log(error)
            res.write(`event: error\ndata: ${JSON.stringify({ error: "Failed to fetch data(setinterval)" })}\n\n`);
            res.end();
            return;
        }
    }, 5000);

};

// controller function for pin validation
const keyPins = async (req, res) => {
    try {
        const { eventId, pin } = req.body;
        if (!eventId || !pin) {
            return res.status(400).json({ error: "Missing required fields!" });
        }

        const isValid = await compareKey({ eventId, pin });

        if (!isValid) {
            return res.status(404).json({ error: "Booking not found" });
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
            return res.status(400).json({ error: "Missing required fields!" });
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
            return res.status(404).json({ error: "Booking not found" });
        }

        return res.status(200).json({ message: `Event: ${ eventId } has been removed!`});
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error "});
    }
};

module.exports = { getuser, keyPins, keyExpired };