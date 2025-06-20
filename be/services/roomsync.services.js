const getGraphClient = require("../graph");
const bookingkey = require('../models/bookingkey');
const sendMailAsync = require("./sendmail.services")
const bcrypt = require('bcryptjs');
require('dotenv').config();
const tokenCache = require("../utils/tokenCache")
const {decryptToken} = require('../utils/encode')

function randomPin() {
  return Math.floor(1000 + Math.random() * 9000).toString(); // 0.000-0.999*9000ได้ 0-8999 + 1000 จะได้ Range 1000-9999 
}

// สร้างรหัสผ่านแบบสุ่ม 4 หลัก เเละเก็บค่าใน DB เเละมีการเช็คโดยดึง api มาเช็คตลอด
async function syncAllRooms() {
    try{
        await tokenCache.isTokenExpired();
        console.log('check expired roomsync success!')

        const roomNumbers = [
        1501, 1502, 1503, 1504, 1505,
        1506, 1514, 1515, 1519, 1520
        ];

        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        const startDateTime = now.toISOString().slice(0,10);
        const endDateTime = tomorrow.toISOString().slice(0,10);

        // ดึงข้อมูลจาก Microsoft Graph API
        const results = await Promise.all(
            roomNumbers.map(async (room) => {
                const graphResponse = await getGraphClient(decryptToken(tokenCache.getAccessToken()))
                    .api(`https://graph.microsoft.com/v1.0/users/${room}@tcc-technology.com/calendarView`)
                    .query({
                        startDateTime: `${startDateTime}T00:00:00Z`,
                        endDateTime: `${endDateTime}T00:00:00Z`,
                        "$orderby": "start/dateTime",
                        "$select": "id,organizer,start,end,locations"
                    })
                    .get();

                if (!graphResponse || !graphResponse.value) {
                    throw new Error(`No value in graphResponse for room ${room}: ${JSON.stringify(graphResponse)}`);
                }

                return {
                    room,
                    events: graphResponse.value
                };
            })
        );

        for (const roomData of results) {
            if (roomData.events && roomData.events.length > 0) {
                for (const event of roomData.events) {
                    let booking = await bookingkey.findOne({ room: roomData.room, eventId: event.id });
                    if (!booking) { // ถ้ายังไม่มี ให้สร้างใหม่
                        console.log('Creating new key for room:', roomData.room, 'event id:', event.id);
                        const key = randomPin();
                        const salt = await bcrypt.genSalt( parseInt(process.env.SALT_ROUNDS));
                        const hashedPassword = await bcrypt.hash(key, salt);
                        booking = await bookingkey.create({
                            room: roomData.room,
                            eventId: event.id,
                            key: hashedPassword,
                            startDateTime: new Date(event.start?.dateTime + "Z"),
                            endDateTime: new Date(event.end?.dateTime + "Z")
                        });
                        console.log('mail send:', key);
                        const mailContent = `รหัสผ่านสำหรับห้อง ${roomData.room} คือ ${key}`;
                        const mail = "Chitsanuchat.A@tcc-technology.com" //Atikarn.S
                        await sendMailAsync(event.organizer?.emailAddress?.address, mailContent, mail, decryptToken(tokenCache.getAccessToken())); //หัวข้ออีเมล, รหัสผ่าน, หมายเลขห้องที่จะส่งไป
                    }
                }
            }
        }
    } catch (error) {
        console.error("Error in syncAllRooms:", error.message);
        return;
    }
}

module.exports = syncAllRooms;
                   
