const getGraphClient = require("../graph");
const bookingkey = require('../models/bookingkey');
const sendMailAsync = require("./sendmail.services")
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../config/.env' });
const tokenCache = require("../utils/tokenCache")
const getTodaydatetime = require('../utils/getTodaydatetime');
const { GetIdRoomnumber } = require('./users.services');

let roomobject = {
    "1501": '', "1502": '', "1503": '', "1504": '',"1505": '',
    "1506": '', "1514": '', "1515": '', "1519": '', "1520": '',
}

function randomPin() {
  return Math.floor(1000 + Math.random() * 9000).toString(); // 0.000-0.999*9000ได้ 0-8999 + 1000 จะได้ Range 1000-9999 
}

// สร้างรหัสผ่านแบบสุ่ม 4 หลัก เเละเก็บค่าใน DB เเละมีการเช็คโดยดึง api มาเช็คตลอด
async function syncAllRooms() {
    
    const {startDateTime, endDateTime} = getTodaydatetime();
      
    // ดึงข้อมูลจาก Microsoft Graph API
    const rawtoken = tokenCache.getAccessToken();
    if (!rawtoken) { // รอ loop ถัดไป token มาไม่ทัน
        console.warn("🔁 Waiting for token to be available in cache...");
        return; 
    }
    const accesstoken = await tokenCache.getAccessToken();
    const results = await Promise.all(
        Object.keys(roomobject).map(async (room) => {
            try{
                if(roomobject[room] === ''){
                    roomobject[room] = await GetIdRoomnumber(accesstoken, room);
                }  
                const graphResponse = await getGraphClient(accesstoken)
                .api(`https://graph.microsoft.com/v1.0/me/calendars/${roomobject[room]}/calendarView?`)
                .query({
                    startDateTime: startDateTime,
                    endDateTime: endDateTime,
                    "$orderby": "start/dateTime",
                    "$top": 100,
                    "$select": "id,organizer,start,end,locations",
                    "$filter": "isCancelled eq false" 
                })
                .get();
                if (!graphResponse || !graphResponse.value) {
                    throw new Error(`No value in graphResponse for room ${room}: ${JSON.stringify(graphResponse)}`);
                }

                return {
                    room,
                    events: graphResponse.value
                };
            } catch (error) {
                console.error(`Error fetching data for room ${room}:`, error.message);
                return; 
            }
        })
    );
    console.log("Fetched data for room:", results);

    try{
        for (const roomData of results) {
            if (roomData.events && roomData.events.length > 0) {
                for (const event of roomData.events) {
                    if(event.organizer?.emailAddress?.address !== process.env.CENTERLIZED_MAIL) { // ถ้าไม่ใช่ผู้ดูแลระบบ
                        let booking = await bookingkey.findOne({ room: roomData.room, eventId: event.id });
                        if (!booking) { // ถ้ายังไม่มี ให้สร้างใหม่
                            console.log('Creating new key for room:', roomData.room, 'event id:', event.id);
                            const key = randomPin();
                            const salt = await bcrypt.genSalt( parseInt(process.env.BCRYPT_SALT_ROUNDS));
                            const hashedPassword = await bcrypt.hash(key, salt);
                            booking = await bookingkey.create({
                                room: roomData.room,
                                eventId: event.id,
                                key: hashedPassword,
                                startDateTime: new Date(event.start?.dateTime + "Z"),
                                endDateTime: new Date(event.end?.dateTime + "Z")
                            });
                            console.log('mail send:', key);
                            RoomStr = roomData.room.toString();
                            const mailContent = `รหัสผ่านสำหรับ L: /${RoomStr.slice(0,2)}>${RoomStr.slice(2,4)} คือ ${key}`;
                            const mail = "Nareupol.A@tcc-technology.com" //event.organizer?.emailAddress?.address  //Atikarn.S
                            if(process.env.DEBUG_MODE) console.log('mail content:',mailContent);
                            // await sendMailAsync(event.organizer?.emailAddress?.address, mailContent, mail, tokenCache.getAccessToken()); //หัวข้ออีเมล, รหัสผ่าน, หมายเลขห้องที่จะส่งไป
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
                   
