require('dotenv').config({ path: './config/.env'});
const getGraphClient = require("../graph");
const tokenCache = require('../utils/tokenCache');
const { decryptToken } = require('../utils/encode');
const getTodaydatetime = require('../utils/getTodaydatetime');

async function getuserdatabyroom(res, RoomNumber) {
    try {
        await tokenCache.isTokenExpired();

        const {startDateTime, endDateTime} = getTodaydatetime();
        
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
        if(process.env.DEBUG_MODE) console.log("usersdate => ",results)
        res.write(`data: ${JSON.stringify({ results })}\n\n`);
        
    } catch (error) {
        console.log(error)
        res.write(`event: error\ndata: ${JSON.stringify({ error: "Failed to fetch data (setinterval)" })}\n\n`);
        res.end();
        return;
    }
} 

module.exports = {
    getuserdatabyroom
};