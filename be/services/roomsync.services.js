const getGraphClient = require("../utils/graph");
const bookingkey = require('../models/bookingkey');
const sendMailAsync = require("./sendmail.services")
require('dotenv').config({ path: '../config/.env' });
const tokenCache = require("../utils/tokenCache")
const {getTodaydatetime} = require('../utils/getTodaydatetime');
const { roomobject } = require('../utils/tokenCache')


function randomPin() {
  return Math.floor(1000 + Math.random() * 9000).toString(); // 0.000-0.999*9000ได้ 0-8999 + 1000 จะได้ Range 1000-9999 
}

// สร้างรหัสผ่านแบบสุ่ม 4 หลัก เเละเก็บค่าใน DB เเละมีการเช็คโดยดึง api มาเช็คตลอด
async function syncAllRooms() {
    
    const {startDateTime, endDateTime} = await getTodaydatetime();
      
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
                const graphResponse = await getGraphClient(accesstoken)
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

    try{
        for (const roomData of results) {
            if (roomData && roomData.events && roomData.events.length > 0) {
                for (const event of roomData.events) {
                    if(event.organizer?.emailAddress?.address !== process.env.CENTERLIZED_MAIL) { // ถ้าไม่ใช่ผู้ดูแลระบบ
                        // console.log(`Processing event for room ${roomData.room}:`, event.organizer?.emailAddress?.address);
                        let booking = await bookingkey.findOne({ room: roomData.room, eventId: event.id });
                        if (!booking) { // ถ้ายังไม่มี ให้สร้างใหม่
                            console.log('Creating new key for room:', roomData.room, 'event id:', event.id);
                            const key = randomPin();
                            booking = await bookingkey.create({
                                room: roomData.room,
                                eventId: event.id,
                                organizerMail: event.organizer?.emailAddress?.address,
                                pin: key, // save pin for user
                                startDateTime: new Date(event.start?.dateTime + "Z"),
                                endDateTime: new Date(event.end?.dateTime + "Z")
                            });
                            // console.log('mail send:', key);
                            RoomStr = roomData.room.toString();
                            const mailContent = `
                                <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Conference Room Booking PIN</title>
    <!--[if mso]>
    <style type="text/css">
        table { border-collapse: collapse; }
        .fallback-text { font-family: Arial, sans-serif !important; }
    </style>
    <![endif]-->
</head>
<body>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <tr>
            <td align="center">
                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 800px; min-width: 320px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); overflow: hidden; margin: 0 auto;">

                    <!-- Header -->
                    <tr>
                        <td style="background: #375f9e; padding: 25px 20px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                                Conference Room Access PIN
                            </h1>
                            <p style="color: #e2e8f0; margin: 10px 0 0; font-size: 14px;">
                                Smart Conference Display System
                            </p>
                        </td>
                    </tr>

                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 30px 20px;">
                            
                            <!-- Greeting -->
                            <div style="margin-bottom: 25px;">
                                <h2 style="color: #2c3e50; margin: 0 0 15px; font-size: 20px; font-weight: 600; line-height: 1.3;">
                                    Dear User,
                                </h2>
                                <p style="color: #4a5568; margin: 0; font-size: 15px; line-height: 1.6;">
                                    Your conference room has been successfully booked. Please use the PIN below to access your reserved room.
                                </p>
                            </div>

                            <!-- PIN Section -->
                            <div style="background: #4CAF50; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
                                <h3 style="color: #ffffff; margin: 0 0 15px; font-size: 18px; font-weight: 600;">
                                    Room \\${RoomStr.slice(0, 2)}>${RoomStr.slice(2, 4)} Access PIN
                                </h3>
                                <div style="background-color: rgba(255, 255, 255, 0.2); border-radius:12px; padding: 15px; margin: 15px 0;">
                                    <span style="color: #ffffff; font-size: 32px; font-weight: bold; letter-spacing: 4px; font-family: 'Courier New', monospace;">
                                        ${key}
                                    </span>
                                </div>
                                <p style="color: #e8f5e8; margin: 0; font-size: 13px;">
                                    Enter this PIN on the room display to confirm your attendance
                                </p>
                            </div>

                            <!-- Room Information -->
                            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px 15px; margin: 25px 0;">
                                <h3 style="color: #2d3748; margin: 0 0 15px; font-size: 17px; font-weight: 600; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
                                    Booking Details
                                </h3>
                                <div style="margin: 10px 0;">
                                    <div style="display: block; padding: 5px 0;">
                                        <strong style="color: #4a5568; font-size: 14px; display: inline-block;">Room Number:</strong>
                                        <span style="color: #4a5568; font-size: 14px; margin-left: 10px;">
                                            \\${RoomStr.slice(0, 2)}>${RoomStr.slice(2, 4)}
                                        </span>
                                    </div>
                                    <div style="display: block; padding: 5px 0;">
                                        <strong style="color: #4a5568; font-size: 14px; display: inline-block;">Access PIN:</strong>
                                        <span style="color: #4a5568; font-size: 14px; margin-left: 10px; font-family: 'Courier New', monospace; font-weight: bold;">
                                            ${key}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <!-- Instructions -->
                            <div style="background-color: #fffbf0; border-left: 4px solid #f6ad55; padding: 15px; margin: 25px 0; border-radius: 6px;">
                                <h4 style="color: #2d3748; margin: 0 0 10px; font-size: 16px; font-weight: 600;">
                                    How to Use Your PIN
                                </h4>
                                <ol style="color: #4a5568; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">
                                    <li>Arrive at Room \\${RoomStr.slice(0, 2)}>${RoomStr.slice(2, 4)} at your scheduled time</li>
                                    <li>Find the room display panel outside the room</li>
                                    <li>Enter your 4-digit PIN: <strong>${key}</strong></li>
                                    <li>Confirm your attendance to activate the booking</li>
                                </ol>
                                <p style="color: #4a5568; margin: 10px 0 0; font-size: 13px; font-style: italic;">
                                    Please enter your PIN within 15 minutes of your scheduled start time to avoid automatic cancellation.
                                </p>
                            </div>

                            <!-- Closing -->
                            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                                <p style="color: #4a5568; margin: 0 0 15px; font-size: 15px; line-height: 1.6;">
                                    Thank you for your attention and cooperation.
                                </p>
                                <div style="color: #2d3748; margin: 0; font-size: 15px; font-weight: 600;">
                                    Best regards,<br>
                                    <span style="color: #4299e1;">Smart Conference Display System Team</span><br>
                                    <div style="margin-top: 10px;">
                                        <img src="cid:thumbnail_Outlook-tnktrguf.png" alt="Company Logo" style="max-width: 150px; height: auto; display: block; margin-left: 5px;">
                                    </div>
                                </div>
                            </div>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #375f9e; padding: 20px 15px; text-align: center;">
                            <p style="color: #a0aec0; margin: 0; font-size: 13px; line-height: 1.4;">
                                This is an automated message from the Smart Conference Display System.<br>
                                Please do not reply to this email.
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
        
    </table>

    <!-- Responsive CSS -->
    <style type="text/css">
        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
                max-width: 100% !important;
            }
            
            .content-padding {
                padding: 20px 15px !important;
            }
            
            .mobile-center {
                text-align: center !important;
            }
            
            .mobile-stack {
                display: block !important;
                width: 100% !important;
            }
            
            h1 {
                font-size: 20px !important;
            }
            
            h2 {
                font-size: 18px !important;
                line-height: 1.2 !important;
            }
            
            h3 {
                font-size: 16px !important;
            }
            
            h4 {
                font-size: 15px !important;
            }
            
            p, span, div, li {
                font-size: 14px !important;
                line-height: 1.5 !important;
            }
            
            .pin-display {
                font-size: 28px !important;
                letter-spacing: 2px !important;
            }
            
            .info-box {
                padding: 15px 10px !important;
                margin: 15px 0 !important;
            }
            
            .footer-padding {
                padding: 15px 10px !important;
            }
        }

        @media only screen and (max-width: 480px) {
            .outer-table {
                padding: 10px 0 !important;
            }
            
            h1 {
                font-size: 18px !important;
            }
            
            h2 {
                font-size: 16px !important;
            }
            
            .pin-display {
                font-size: 24px !important;
                letter-spacing: 1px !important;
            }
            
            .logo-img {
                max-width: 120px !important;
            }
        }
    </style>
    
</body>
</html>`;
                            subject = "Pin for room booking";
                            const mail =  process.env.CENTERLIZED_MAIL   //event.organizer?.emailAddress?.address *********************************
                            if(process.env.DEBUG_MODE) console.log('mail content:',mailContent);
                            await sendMailAsync(subject, mailContent, mail, tokenCache.getAccessToken()); //หัวข้ออีเมล, รหัสผ่าน, หมายเลขห้องที่จะส่งไป
                            // await sendMailAsync(subject, mailContent, mail, tokenCache.getAccessToken()); //หัวข้ออีเมล, รหัสผ่าน, หมายเลขห้องที่จะส่งไป
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
                   
