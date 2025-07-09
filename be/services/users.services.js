require('dotenv').config({ path: './config/.env'});
const getGraphClient = require("../graph");
const tokenCache = require('../utils/tokenCache');
const getTodaydatetime = require('../utils/getTodaydatetime');

async function getuserdatabyroom(res, RoomNumber) {
    try {
        const {startDateTime, endDateTime} = getTodaydatetime();
        const accesstoken = tokenCache.getAccessToken();
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
                "$select": "id,subject,organizer,start,end,locations",
                "filter": "isCancelled eq false" 
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

        console.log("RoomNumber received:", RoomNumber);
        console.log("Available calendars:", calendars.value.map(cal => ({
            name: cal.name,
            id: cal.id,
            owner: cal.owner?.address
        })));

        const matchingCalendars = calendars.value.filter(cal =>
            cal.owner?.address?.includes(`${RoomNumber}@tcc-technology.com`)
        );
        if (matchingCalendars.length === 0) {
            throw new Error(`No calendar found for room: ${RoomNumber}`);
        }
        
        calendarIds = matchingCalendars[0].id;
        console.log("matchingCalendars => ", calendarIds);
        return calendarIds;
    } catch (error) {
        console.error('Error fetching user ID:', error);
        throw new Error('Failed to fetch user ID');
    }
}


const GeteventId = async (accessToken, calendarId, email, startdatetime, enddatetime) => { // ex. startdatetime:2025-07-10T11:00:00Z, enddatetime:2025-07-10T12:00:00Z
    try{
        // console.log("startdatetime = ", startdatetime); // 2025-07-10T13:00:00Z
        const startdate = new Date(startdatetime);
        const enddate = new Date(enddatetime);
        const newStartdate = new Date(startdate.getTime() + 1).toISOString();
        const newEnddate = new Date(enddate.getTime() - 1).toISOString();
        // console.log("New date add 1 seconds:", newStartdate);
        // console.log("New date minus 1 seconds:", newEnddate);

        const events = await getGraphClient(accessToken)
        .api(`/me/calendars/${calendarId}/calendarView`)
        .query({
                startDateTime: newStartdate, 
                endDateTime: newEnddate,
                $select: "id,organizer", 
            })
            .get();
        console.log("events => ", events);
        if (!events || !events.value || events.value.length === 0) {
            throw new Error(`CalendarID, No events found for calendar ${calendarId} and email ${email}`);
        }
        console.log("organizer email  => ", email);
        const filteredEvents = events.value.filter(event =>{
            console.log("event.organizer(founded) => ", event.organizer?.emailAddress?.address)
            return event.organizer?.emailAddress?.address === email
        });
        console.log("filteredEvents(ready to use!!) => ", filteredEvents);
        if (filteredEvents.length === 0) {
            throw new Error(`No events found for calendar ${calendarId} and email ${email}`);
        }
        return filteredEvents[0].id;
    } catch(error){
        console.error('Error fetching event ID:', error);
        throw new Error('Failed to fetch GeteventID');
    }
}

module.exports = {
    getuserdatabyroom, GetIdRoomnumber, GeteventId
};
