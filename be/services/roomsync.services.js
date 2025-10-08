const getGraphClient = require("../utils/graph"); 
const bookingkey = require('../models/bookingkey');
const sendMailAsync = require("./sendmail.services");
require('dotenv').config({ path: '../config/.env' });
const tokenCache = require("../utils/tokenCache");
const { getTodaydatetime } = require('../utils/getTodaydatetime');
const { roomobject } = require('../utils/tokenCache');
const getMailContent = require('../templates/mailcontent_pinsend');

function randomPin() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

// utility: กรอง attendees ตามเงื่อนไข
function getAllowedAttendees(event) {
    const allowedDomains = (process.env.ORGANIZER_DOMAINS || "")
        .split(",")
        .map(d => d.trim().toLowerCase());

    const exceptRoomEmails = (process.env.EXCEPT_ROOM_EMAILS || "")
        .split(",")
        .map(e => e.trim().toLowerCase());

    return (event.attendees || [])
        .filter(att => {
            const email = att.emailAddress?.address?.toLowerCase() || "";
            // ไม่ส่งถ้าเป็นเมลห้องที่ระบุไว้
            if (exceptRoomEmails.includes(email)) {
                return false;
            }
            // ✅ ส่งเฉพาะคนที่อยู่ในโดเมนที่อนุญาต
            const isAllowed = allowedDomains.some(domain => email.endsWith(domain));
            // if (!isAllowed) {
            //     console.log(`🚫 Skip external email: ${email}`);
            // }
            return isAllowed;
        })
        .map(att => att.emailAddress.address);
}

// main function
async function syncAllRooms() {
    let rawtoken;
    const { startDateTime, endDateTime } = await getTodaydatetime();

    try {
        rawtoken = tokenCache.getAccessToken();
    } catch (error) {
        console.error("❌ ไม่สามารถรับ token ที่ถูกต้องได้:", error.message);
        return;
    }

    const results = await Promise.all(
        Object.keys(roomobject).map(async (room) => {
            try {
                const graphResponse = await getGraphClient(rawtoken)
                    .api(`https://graph.microsoft.com/v1.0/me/calendars/${roomobject[room]}/calendarView?`)
                    .query({
                        startDateTime: startDateTime,
                        endDateTime: endDateTime,
                        "$orderby": "start/dateTime",
                        "$top": 100,
                        "$select": "id,organizer,start,end,locations,responseStatus,attendees",
                        "$filter": "isCancelled eq false"
                    })
                    .get();

                if (!graphResponse || !graphResponse.value) {
                    throw new Error(`No value in graphResponse for room ${room}`);
                }

                const acceptedEvents = graphResponse.value.filter(event =>
                    event.responseStatus?.response === "accepted"
                );

                return { room, events: acceptedEvents };
            } catch (error) {
                console.error(`Error fetching data for room ${room}:`, error.message);
                return;
            }
        })
    );

    try {
        for (const roomData of results) {
            if (roomData && roomData.events && roomData.events.length > 0) {
                for (const event of roomData.events) {
                    if (event.organizer?.emailAddress?.address !== process.env.CENTERLIZED_MAIL) {
                        //  เอาเฉพาะ attendees ในองค์กรณ์ 
                        const attendeesToNotify = getAllowedAttendees(event);

                        if (attendeesToNotify.length > 0) {
                            let booking = await bookingkey.findOne({
                                room: Number(roomData.room),
                                eventId: event.id
                            });

                            if (!booking) {
                                console.log(`🆕 Creating new key for room ${roomData.room}`);
                                const key = randomPin();

                                booking = await bookingkey.create({
                                    room: Number(roomData.room),
                                    eventId: event.id,
                                    organizerMail: event.organizer?.emailAddress?.address,
                                    organizerName: event.organizer?.emailAddress?.name,
                                    pin: key,
                                    startDateTime: new Date(event.start?.dateTime + "Z"),
                                    endDateTime: new Date(event.end?.dateTime + "Z"),
                                    B_createdAt: new Date(),
                                });

                                const except_rooms = (process.env.EXECPT_ROOMS || "")
                                    .split(",")
                                    .map(num => Number(num.trim()));

                                if (!except_rooms.includes(Number(roomData.room))) {
                                    const RoomStr = roomData.room.toString();
                                    const mailcontent = getMailContent(
                                        RoomStr,
                                        key,
                                        event.organizer?.emailAddress?.name,
                                        event.start?.dateTime,
                                        event.end?.dateTime
                                    );

                                    for (const attendeeEmail of attendeesToNotify) {
                                        const mail = (process.env.DEBUG_MODE || "true") === "true"
                                            ? process.env.CENTERLIZED_MAIL
                                            : attendeeEmail;

                                        const issendedmail = await sendMailAsync(
                                            mailcontent.subject,
                                            mailcontent.body,
                                            mail,
                                            rawtoken
                                        );
                                        console.log(`📧 Email sent to ${mail} for room ${RoomStr}:`, issendedmail);
                                    }
                                }
                            }else {
                                // กรณีมี booking อยู่แล้วให้ เช็คเวลา ถ้าไม่ตรงให้ update 
                                const newStart = new Date(event.start?.dateTime + "Z");
                                const newEnd   = new Date(event.end?.dateTime + "Z");

                                if (
                                    booking.startDateTime.getTime() !== newStart.getTime() ||
                                    booking.endDateTime.getTime() !== newEnd.getTime()
                                ) {
                                    console.log(`✏️ Updating booking time for room ${roomData.room}, event ${event.id}`);

                                    booking.startDateTime = newStart;
                                    booking.endDateTime   = newEnd;
                                    booking.organizerMail = event.organizer?.emailAddress?.address; // เผื่อเปลี่ยน organizer
                                    booking.organizerName = event.organizer?.emailAddress?.name; 
                                    await booking.save();
                                }
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