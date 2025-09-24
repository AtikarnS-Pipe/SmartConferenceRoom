const getGraphClient = require("../utils/graph");
const bookingkey = require('../models/bookingkey');
const sendMailAsync = require("./sendmail.services")
require('dotenv').config({ path: '../config/.env' });
const tokenCache = require("../utils/tokenCache")
const { getTodaydatetime } = require('../utils/getTodaydatetime');
const { roomobject } = require('../utils/tokenCache')
const getMailContent = require('../templates/mailcontent_pinsend');

function randomPin() {
    return Math.floor(1000 + Math.random() * 9000).toString(); // 0.000-0.999*9000ได้ 0-8999 + 1000 จะได้ Range 1000-9999 
}

// สร้างรหัสผ่านแบบสุ่ม 4 หลัก เเละเก็บค่าใน DB เเละมีการเช็คโดยดึง api มาเช็คตลอด
async function syncAllRooms() {
    let rawtoken;
    const { startDateTime, endDateTime } = await getTodaydatetime();

    // ดึงข้อมูลจาก Microsoft Graph API
    try {
        rawtoken = tokenCache.getAccessToken();
    } catch (error) {
        console.error("❌ ไม่สามารถรับ token ที่ถูกต้องได้:", error.message);
        return;
    }
    // const accesstoken = await tokenCache.getAccessToken();
    const results = await Promise.all(
        Object.keys(roomobject).map(async (room) => {
            try {
                const graphResponse = await getGraphClient(rawtoken)
                    // .api(`https://graph.microsoft.com/v1.0/users/${room}@tcc-technology.com/calendarView?`)
                    .api(`https://graph.microsoft.com/v1.0/me/calendars/${roomobject[room]}/calendarView?`)
                    .query({
                        startDateTime: startDateTime,
                        endDateTime: endDateTime,
                        "$orderby": "start/dateTime",
                        "$top": 100,
                        "$select": "id,organizer,start,end,locations,responseStatus",
                        "$filter": "isCancelled eq false"
                    })
                    .get();
                if (!graphResponse || !graphResponse.value) {
                    throw new Error(`No value in graphResponse for room ${room}: ${JSON.stringify(graphResponse)}`);
                }
                const acceptedEvents = graphResponse.value.filter(event =>
                    event.responseStatus?.response === "accepted"
                );
                return {
                    room,
                    events: acceptedEvents
                };
            } catch (error) {
                console.error(`Error fetching data for room ${room}:`, error.message);
                return;
            }
        })
    );
    // console.log("Fetched data for roomsync:", results);

    try {
        for (const roomData of results) {
            if (roomData && roomData.events && roomData.events.length > 0) {
                for (const event of roomData.events) {
                    if (event.organizer?.emailAddress?.address !== process.env.CENTERLIZED_MAIL) { // ถ้าไม่ใช่ผู้ดูแลระบบ
                        // console.log(`Processing event for room ${roomData.room}:`, event.organizer?.emailAddress?.address);
                        let booking = await bookingkey.findOne({ room: Number(roomData.room), eventId: event.id });
                        if (!booking) { // ถ้ายังไม่มี ให้สร้างใหม่
                            console.log('Creating new key for room(show include room that except):', roomData.room);
                            const key = randomPin();
                            booking = await bookingkey.create({
                                room: Number(roomData.room),
                                eventId: event.id,
                                organizerMail: event.organizer?.emailAddress?.address,
                                pin: key, // save pin for user
                                startDateTime: new Date(event.start?.dateTime + "Z"),
                                endDateTime: new Date(event.end?.dateTime + "Z"),
                                B_createdAt: new Date(),
                            });                            
                            
                            const except_rooms = (process.env.EXECPT_ROOMS || "").split(",").map(num => Number(num.trim()));
                            if(!except_rooms.includes(Number(roomData.room))){
                                const RoomStr = roomData.room.toString();
                                const mailcontent = getMailContent(RoomStr, key, event.start?.dateTime, event.end?.dateTime); // ms ISO datetime format
                                const mail = (process.env.DEBUG_MODE || "true") === "true" ? process.env.CENTERLIZED_MAIL : event.organizer?.emailAddress?.address;
                                const issendedmail = await sendMailAsync(mailcontent.subject, mailcontent.body, mail, rawtoken); //หัวข้ออีเมล, รหัสผ่าน, หมายเลขห้องที่จะส่งไป
                                // console.log(`Email sent to ${mail} for room ${RoomStr}:`, issendedmail);
                            }
                            
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error("Error forloop in syncAllRooms:", error.message);
        return;
    }
}

module.exports = syncAllRooms;

