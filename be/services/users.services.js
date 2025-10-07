require('dotenv').config({ path: './config/.env'});
const getGraphClient = require("../utils/graph");
const tokenCache = require('../utils/tokenCache');
const {getTodaydatetime} = require('../utils/getTodaydatetime');
const { roomobject } = require('../utils/tokenCache');
const Bookingkey = require('../models/bookingkey');

async function getuserdatabyroom(res, RoomNumber) {
    try {
        if(!(RoomNumber in roomobject)){
            throw new Error(`Invalid room number: ${RoomNumber}`)
        }
        const {startDateTime, endDateTime} = await getTodaydatetime();
        const accesstoken = tokenCache.getAccessToken();
        if(!accesstoken){
            throw new Error("No access token in Users")
        }
        const graphResponse = await getGraphClient(accesstoken)
            // .api(`https://graph.microsoft.com/v1.0/users/${RoomNumber}@tcc-technology.com/calendarView`)
            .api(`https://graph.microsoft.com/v1.0/me/calendars/${roomobject[RoomNumber]}/calendarView?`)
            .query({
                startDateTime: startDateTime,
                endDateTime: endDateTime,
                "$orderby": "start/dateTime",
                "$top": 100,
                "$select": "id,subject,organizer,start,end,locations,isAllDay,responseStatus",
                "$filter": "isCancelled eq false" 
            })
            .get();
        if (!graphResponse || !graphResponse.value) {
            throw new Error(`No value in graphResponse for room ${RoomNumber}: ${JSON.stringify(graphResponse)}`);
        }
        const acceptedEvents = graphResponse.value.filter(event => // กรองเอาอันที่ไม่ถูก decline
            event.responseStatus?.response === "accepted"
        );
        const results = acceptedEvents
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

const GeteventId = async (accessToken, roomnumber, email, startdatetime, enddatetime) => { // ex. startdatetime:2025-07-10T11:00:00Z, enddatetime:2025-07-10T12:00:00Z
    try{
        // console.log("startdatetime = ", startdatetime); // 2025-07-10T13:00:00Z
        const startdate = new Date(startdatetime);
        const enddate = new Date(enddatetime);
        const newStartdate = new Date(startdate.getTime() + 1).toISOString();
        const newEnddate = new Date(enddate.getTime() - 1).toISOString();
        // console.log("New date add 1 seconds:", newStartdate);
        // console.log("New date minus 1 seconds:", newEnddate);

        const events = await getGraphClient(accessToken)
        .api(`/user/${roomnumber}@tcc-technology.com/calendarView?`)
        .query({
            startDateTime: newStartdate, 
            endDateTime: newEnddate,
            $select: "id,organizer", 
        })
        .get();

        if (!events?.value?.length) return null;
        
        console.log("organizer email  => ", email);
        const filteredEvents = events.value.filter(event =>{
            console.log("event.organizer(founded) => ", event.organizer?.emailAddress?.address)
            return event.organizer?.emailAddress?.address === email
        });
        console.log("filteredEvents(ready to use!!) => ", filteredEvents);
        
        return filteredEvents.length ? filteredEvents[0].id : null;
    } catch(error){
        console.error('Error fetching event ID:', error);
        throw new Error('Failed to fetch GeteventID');
    }
}

const createMSEvent = async (AccessToken, createroomdata) => {
  try {
    const newEvent = {
      subject: `${createroomdata.subject}` || `Meeting in Room ${createroomdata.RoomNumber}`,
      start: { dateTime: createroomdata.startdatetime, timeZone: "UTC" },
      end: { dateTime: createroomdata.enddatetime, timeZone: "UTC" },
      attendees: [
        {
          emailAddress: {
            address: `${createroomdata.RoomNumber}@tcc-technology.com`,
          },
          type: "required",
        },
      ],
    };

    let iscreate;
    try {
      iscreate = await getGraphClient(AccessToken)
        .api(`/me/events`)
        .post(newEvent, { fetchOptions: { timeout: 5000 } }); // รอสูงสุด 5 วิ
    } catch (err) {
      console.warn("⚠️ Event creation may have timed out, checking manually...");
    }

    // ✅ ถ้า API ตอบกลับมา → ใช้เลย
    if (iscreate && iscreate.id) return iscreate;

    // 🔎 ถ้า API ไม่ตอบ แต่ event อาจสร้างแล้ว → confirm
    const check = await getGraphClient(AccessToken)
      .api(`/me/events`)
      .filter(`start/dateTime ge '${createroomdata.startdatetime}' and end/dateTime le '${createroomdata.enddatetime}'`)
      .get();

    if (check.value && check.value.length > 0) {
      console.log("✅ Event confirmed by checking calendar");
      return check.value[0]; // คืน event ที่สร้างจริง
    }

    return false;
  } catch (error) {
    console.error("Error creating MS event:", error.message);
    return false;
  }
};


async function waitUntil(conditionFn, timeout = 15000, interval = 1000) {
    const start = Date.now();
    return new Promise(async (resolve, reject) => {
        const check = async () => {
            try {
                const result = await conditionFn();
                if (result) return resolve(result); // resolve ส่งค่าให้กับ promise 
                if (Date.now() - start >= timeout) return reject(new Error("Timeout waiting for condition"));
                setTimeout(check, interval);
            } catch (err) {
                reject(err);
            }
        };
        check();
    });
}

/**
 * บริการจบการประชุม
 * @param {Object} endmeetingdata - { eventId, startdatetime, isAllDay }
 */
async function endMeetingService(endmeetingdata) {
  const AccessToken = tokenCache.getAccessToken();
  if (!AccessToken) throw new Error("Access token not found");

  const now = new Date();
  const newEndDate = new Date(now);
  let startDateTime;

  // Handle All-day case
  if (endmeetingdata.isAllDay) {
    const date = new Date(endmeetingdata.startdatetime);
    const utcMidnight = Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate()
    );
    const dt = new Date(utcMidnight + 1000); // บวก 1 วินาที
    startDateTime = dt.toISOString();
  } else {
    startDateTime = new Date(endmeetingdata.startdatetime).toISOString();
  }

  // อัปเดต event ที่ Graph API
  await getGraphClient(AccessToken)
    .api(`/me/events/${endmeetingdata.eventId}`)
    .update({
      isAllDay: false,
      start: { dateTime: startDateTime, timeZone: "UTC" },
      end: { dateTime: newEndDate.toISOString(), timeZone: "UTC" },
    });

  console.log(`📤 Graph event updated for ${endmeetingdata.eventId}`);

  // อัปเดตสถานะใน DB
  const updated = await Bookingkey.findOneAndUpdate(
    { eventId: endmeetingdata.eventId },
    {
      $set: {
        isended: "true",
        endmeetingAt: now,
      },
    },
    { new: true }
  );

  return { dbUpdated: !!updated };
}

module.exports = {
    getuserdatabyroom, GeteventId, createMSEvent, waitUntil, endMeetingService
};
