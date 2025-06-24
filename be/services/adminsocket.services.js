const getGraphClient = require("../graph"); 
const Token = require('../models/token')
const tokenCache = require('../utils/tokenCache')


async function GetScheduleData(actoken, Room, start, end){  
    try {
        const graphResponse = await getGraphClient(actoken)
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

async function addCacheandDB(tokenobject){
    tokenCache.setToken(tokenobject)
    console.log("Token encrypted and cached. Expiry:", tokenobject.expiryDate);

    // If ACCOUNT DB has unique same in TOKEN DB, Update that recode
    // If not, Create token in DB. ตอนนี้ซ้ำยาว
    const Tokenstore = await Token.create(tokenobject)
    console.log("Token saved to DB. ID:", Tokenstore._id);
    return;
}

module.exports = { GetScheduleData, addCacheandDB };