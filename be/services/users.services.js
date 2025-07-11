require('dotenv').config({ path: './config/.env'});
const getGraphClient = require("../graph");
const tokenCache = require('../utils/tokenCache');
const getTodaydatetime = require('../utils/getTodaydatetime');
 let roomobject = {
            "1501": '', "1502": '', "1503": '', "1504": '',"1505": '',
            "1506": '', "1514": '', "1515": '', "1519": '', "1520": '',
        }

async function getuserdatabyroom(res, RoomNumber) {
    try {
        if(!(RoomNumber in roomobject)){
            throw new Error(`Invalid room number: ${RoomNumber}`)
        }
        const {startDateTime, endDateTime} = getTodaydatetime();
        const accesstoken = tokenCache.getAccessToken();
        if(!accesstoken){
            throw new Error("No access token in Users")
        }
        if(roomobject[RoomNumber] === ''){
            roomobject[RoomNumber] = await GetIdRoomnumber(accesstoken, RoomNumber);
        }
        const graphResponse = await getGraphClient(accesstoken)
            .api(`https://graph.microsoft.com/v1.0/users/${RoomNumber}@tcc-technology.com/calendarView`)
            // .api(`https://graph.microsoft.com/v1.0/me/calendars/${roomobject[RoomNumber]}/calendarView`)
            .query({
                startDateTime: startDateTime,
                endDateTime: endDateTime,
                "$orderby": "start/dateTime",
                "$top": 100,
                "$select": "id,subject,organizer,start,end,locations",
                "$filter": "isCancelled eq false" 
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
        if (!res.writableEnded) {
            res.write(`event: error\ndata: ${JSON.stringify({ error: `Failed to fetch data (setinterval) with ${error.message}` })}\n\n`);
            // res.end();
            // return;
        }    
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

const createMSEvent = async (AccessToken, createroomdata) => {
    try{
        const newEvent = {
            subject: createroomdata.subject || `Meeting in Room ${createroomdata.RoomNumber}`,
            start: {
                dateTime: createroomdata.startdatetime,
                timeZone: "UTC"
            },
            end: {
                dateTime: createroomdata.enddatetime,
                timeZone: "UTC"
            },
            // location: {
            //     displayName: `${RoomNumber}@tcc-technology.com`
            // },
            attendees: [
                {
                emailAddress: {
                    address: `${createroomdata.RoomNumber}@tcc-technology.com`,
                    // name: `${RoomNumber} Meetingroom`
                },
                type: "required"
                }
            ],
            organizer: {
                emailAddress: {
                    // name: "TCCtech Meetingroom222",
                    address: "meetingroom@tcc-technology.com"
                }
            }
        };
        const iscreate = await getGraphClient(AccessToken)
        .api(`/me/events`)  // for calendar you have access to
        .post(newEvent);
        if (!iscreate) {
            return false;
        }
        return true;
    } catch(error){
        console.error('Error creating MS event:', error.message);
        return false;
    }
}

module.exports = {
    getuserdatabyroom, GetIdRoomnumber, GeteventId, createMSEvent
};
