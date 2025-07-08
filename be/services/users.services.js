require('dotenv').config({ path: './config/.env'});
const getGraphClient = require("../graph");
const tokenCache = require('../utils/tokenCache');
const { decryptToken } = require('../utils/encode');
const getTodaydatetime = require('../utils/getTodaydatetime');

async function getuserdatabyroom(res, RoomNumber) {
    try {
        const {startDateTime, endDateTime} = getTodaydatetime();
        const accesstoken = decryptToken(tokenCache.getAccessToken());
        if(!accesstoken){
            throw new Error("No access token in Users")
        }
        const graphResponse = await getGraphClient(accesstoken)
            .api(`https://graph.microsoft.com/v1.0/users/${RoomNumber}@tcc-technology.com/calendarView`)
            .query({
                startDateTime: startDateTime,
                endDateTime: endDateTime,
                "$orderby": "start/dateTime",
                "$top": 100,
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
        console.log(error.message)
        res.write(`event: error\ndata: ${JSON.stringify({ error: `Failed to fetch data (setinterval) with ${error.message}` })}\n\n`);
        // res.end();
        // return;
    }
} 

async function GetIdRoomnumber(accessToken, RoomNumber) {
    try {
        let calendarIds;
        const calendars = await getGraphClient(accessToken)
        .api('https://graph.microsoft.com/v1.0/me/calendars')
        .get();
        const matchingCalendars = calendars.value.filter(cal =>
            cal.owner?.address?.includes(`${RoomNumber}@tcc-technology.com`)
        );
        if (!matchingCalendars) {
            throw new Error(`No calendar found for room ${RoomNumber}`);
        }
        
        // matchingCalendars.forEach(cal => {
        //     console.log("Calendar Name:", cal.name);
        //     console.log("Owner:", cal.owner?.address);
        //     console.log("Matching calendar ID:", cal.id);
        //     calendarIds = cal.id;
        // });
        calendarIds = matchingCalendars.map(cal => cal.id);
        console.log("matchingCalendars => ", calendarIds[0]);
        return calendarIds[0];
    } catch (error) {
        console.error('Error fetching user ID:', error);
        throw new Error('Failed to fetch user ID');
    }
}

module.exports = {
    getuserdatabyroom, GetIdRoomnumber
};