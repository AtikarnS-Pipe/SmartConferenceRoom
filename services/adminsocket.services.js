const getGraphClient = require("../graph"); 

async function GetScheduleData(tokenResponse, Room, start, end){  
    try {
        const graphResponse = await getGraphClient(tokenResponse.accessToken)
            .api(`https://graph.microsoft.com/v1.0/users/${Room}@tcc-technology.com/calendarView?`)
            .query({
                startDateTime: `${start}T00:00:00Z`,
                endDateTime: `${end}T00:00:00Z`,
                "$orderby": "start/dateTime",
                "$select": "organizer,start,end,locations"
            })
            .get();
        if (!graphResponse || !graphResponse.value) {
            throw new Error(`No value in graphResponse for room ${Room}: ${JSON.stringify(graphResponse)}`);
        }
        const results = graphResponse.value
        console.log("admin scedule",results)
        return results;
        
    } catch (error) {
      console.log("error:", error);
    }
}

module.exports = { GetScheduleData };