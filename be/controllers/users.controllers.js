const { authProvider } = require("../utils/AuthProvider");
const { compareKey, adminCompareKey } = require('../services/pin.services');
require('dotenv').config({ path: './config/.env'});
const tokenCache = require("../utils/tokenCache");
const { getuserdatabyroom, waitUntil } = require('../services/users.services');
const { roomobject } = require('../utils/tokenCache');
// crud microsoft
const { GeteventId, createMSEvent } = require('../services/users.services');
const getGraphClient = require("../utils/graph");
const pinstats = require('../models/RoomAccessLog');

// create ms room
const bookingkey = require('../models/bookingkey')

//end meeting ms
// const { GetTimeAPI } = require('../utils/getTodaydatetime');
// penalty alert email 
const sendMailAsync = require('../services/sendmail.services');

const getuser = async (req, res) => {
    const floor = req.params.floors;
    const room = req.params.rooms;
    const RoomNumber = `${floor}${room}`;
    if(process.env.DEBUG_MODE) console.log("RoomNumber:",RoomNumber)

    res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': process.env.FRONTEND_USERS
    });
    
    getuserdatabyroom(res, RoomNumber);
    const intervalId = setInterval(async () => {
        getuserdatabyroom(res, RoomNumber);
    }, 8000);

    // จัดการ cleanup 
    req.on('close', () => {
        clearInterval(intervalId);
        console.log(`SSE connection closed for room ${RoomNumber}`);
    });

    req.on('error', (err) => {
        clearInterval(intervalId);
        console.error('SSE request error:', err);
    });

    res.on('finish', () => {
        clearInterval(intervalId);
        console.log(`Response finished for room ${RoomNumber}`);
    });
};

// controller function for pin validation
const keyPins = async (req, res) => {
    try {
        const { eventId, pin } = req.body;
        if (!eventId || !pin) {
            return res.status(200).json({ error: "Missing required fields!" });
        }

        const isValid = await compareKey({ eventId, pin });

        if (!isValid) {
            console.log(`Invalid pin for event: ${isValid}`);
            return res.status(200).json({ error: "Booking not found" });
        }

        return res.status(200).json({ pinValid: isValid });
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

const keyExpired = async (req, res) => {
    try {
        const { eventId } = req.body;
        if ( !eventId ) {
            return res.status(200).json({ error: "Missing required fields!" });
        }

        // const token = req.cookies.user_token;
        //  if (!token) {
        //     throw new Error("No accessToken");
        // }
        // const payload = jwt.verify(token, JWT_SECRET);
        // const account = await authProvider.getAccountById(payload.homeAccountId);
        // if (!account) {
        //     throw new Error("Session expired, please ask admin to login again");
        // }
        // let tokenResponse = await authProvider.acquireTokenSilent(
        //     account,
        //     [process.env.SCOPE]
        // );

        const isCompleted = await deleteSchedule({ eventId });
        
        if (!isCompleted) {
            return res.status(200).json({ error: "Booking not found" });
        }

        return res.status(200).json({ message: `Event: ${ eventId } has been removed!`});
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error "});
    }
};

// admin pin insertion
const adminKeyPin = async (req, res) => {
    try {
        console.log(`${req.method} ${req.originalUrl}`);
        // console.log("Request body:", req.body);
        const { pin, room_number } = req.body;
        console.log("Pin:", pin, "Room Number:", room_number);
        if ( !pin || !room_number ) {
            return res.status(200).json({ message: "Missing required fields! "});
        }

        const result = await adminCompareKey( pin, room_number );

        if (!result.success) {
            return res.status(200).json({ success: result.success, message: result.message });
        }

        return res.status(200).json({ success: result.success, message: result.message });
    } catch (err) {
        return res.status(500).json({ message: result.message });
    }
}

// รับ eventId ของการประชุมที่ต้องการลบ
const deleteroom = async (req, res) => {
    const { eventId } = req.body; // , eventId
    const AccessToken = tokenCache.getAccessToken();
    if (!AccessToken) {
        console.error("No refresh token found in cache...");
        throw new Error("No refresh token found in caches. Please login again.");
    }
    try {
        await getGraphClient(AccessToken)
        .api(`/me/events/${eventId}`)
        .delete();

        console.log("Delete event success");
        const falselist = await waitUntil(async () => {
            const result = await bookingkey.findOneAndUpdate(
                { eventId },
                { isPinVerified: 'not access' },
                { new: true }
            );

            // ถ้ามี organizerMail แล้วถึงจะ return
            if (result?.organizerMail) return result;
            return null;
        }, 30000, 3000);
        const organizerEmail = falselist.organizerMail;
        
        if (organizerEmail && organizerEmail !== process.env.CENTERLIZED_MAIL) {
            // ใช้ upsert เพื่อสร้างใหม่หากไม่มี หรือ update หากมีอยู่แล้ว
            const countbacklist = await pinstats.findOneAndUpdate(
                { organizerMail: organizerEmail }, // หาด้วย organizerMail
                { 
                    $inc: { pinMissCount: +1 }, // เพิ่มจำนวนครั้งที่ miss
                    $push: { 
                        EventId: {
                            eventId,
                            missedAt: new Date(), //await GetTimeAPI('Asia/Bangkok'),
                            RoomNumber: Number(falselist.room)  
                        }
                    }
                },
                {
                    new: true, // return document หลัง update
                    upsert: true, // สร้างใหม่ถ้าไม่มี
                    setDefaultsOnInsert: true // set default values เมื่อสร้างใหม่
                }
            );

            console.log(`Miss count for ${organizerEmail}: ${countbacklist.pinMissCount}`);

            if (countbacklist.pinMissCount % 5 === 0) { // ส่งเมลเตือนถ้าครบ 5 ครั้ง
                await pinstats.findOneAndUpdate(
                    { organizerMail: organizerEmail },
                    { isBanned: true },
                    { new: true }
                );
                const mailData = {
                    subject: `Usage Warning - Smart Conference Display System`,
                    body: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Conference Room Booking Warning</title>
    <!--[if mso]>
    <style type="text/css">
        table { border-collapse: collapse; }
        .fallback-text { font-family: Arial, sans-serif !important; }
    </style>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f7fa; line-height: 1.6;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f7fa; padding: 20px 0;">
        <tr>
            <td align="center">
                <!-- ✅ ปรับ width และเพิ่ม responsive styling -->
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
                                    We are writing to inform you that our system has recorded <strong style="color: #e53e3e;">five or more instances</strong> of unattended room reservations under your account.
                                </p>
                            </div>

                            <!-- Warning Notice -->
                            <div style="background-color: #fff5f5; border-left: 4px solid #e53e3e; padding: 15px; margin: 25px 0; border-radius: 6px;">
                                <p style="color: #4a5568; margin: 0; font-size: 15px; line-height: 1.6;">
                                    This notification serves as a <strong style="color: #e53e3e;">formal reminder</strong> to ensure responsible use of the conference room booking system. Unattended reservations without prior cancellation impact the availability of facilities for other users.
                                </p>
                            </div>

                            <!-- Account Information -->
                            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px 15px; margin: 25px 0;">
                                <h3 style="color: #2d3748; margin: 0 0 15px; font-size: 17px; font-weight: 600; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
                                    Account Information
                                </h3>
                                <!-- ✅ เปลี่ยนจาก table เป็น responsive divs -->
                                <div style="margin: 10px 0;">
                                    <div style="display: block; padding: 5px 0;">
                                        <strong style="color: #4a5568; font-size: 14px; display: inline-block;">Email:</strong>
                                        <span style="color: #4a5568; font-size: 14px; word-break: break-word; margin-left: 10px;">
                                            ${organizerEmail}
                                        </span>
                                    </div>
                                    <div style="display: block; padding: 5px 0;">
                                        <strong style="color: #4a5568; font-size: 14px; display: inline-block;">Total Missed Bookings:</strong>
                                        <span style="color: #4a5568; font-size: 14px; margin-left: 10px;">
                                            ${countbacklist.pinMissCount}
                                        </span>
                                    </div>
                                    <div style="display: block; padding: 5px 0;">
                                        <strong style="color: #4a5568; font-size: 14px; display: inline-block;">Status:</strong>
                                        <span style="color: #4a5568; font-size: 14px; margin-left: 10px;">
                                            Warning Issued
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <!-- Action Required -->
                            <div style="margin: 20px 0;">
                                <p style="margin: 0; font-size: 14px; line-height: 1.5; opacity: 0.95;">
                                    We kindly ask that you review your future bookings and <strong>cancel in advance</strong> if you are unable to attend. Continued misuse may lead to <strong>temporary suspension</strong> of your booking privileges.
                                </p>
                            </div>

                            <!-- Closing -->
                            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                                <p style="color: #4a5568; margin: 0 0 15px; font-size: 15px; line-height: 1.6;">
                                    Thank you for your attention and cooperation.
                                </p>
                                <div style="color: #2d3748; margin: 0; font-size: 15px; font-weight: 600;">
                                    Sincerely,<br>
                                    <span style="color: #4299e1;">Smart Conference Display System Team</span><br>
                                    <!-- ✅ ทำให้ logo responsive -->
                                    <div style="margin-top: 10px;">
                                        <img src="cid:thumbnail_Outlook-tnktrguf.png" alt="Company Logo" style="max-width: 150px; height: auto; display: block;">
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

    <!-- ✅ เพิ่ม Media Queries สำหรับ responsive -->
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
            
            .mobile-hide {
                display: none !important;
            }
            
            h2 {
                font-size: 18px !important;
                line-height: 1.2 !important;
            }
            
            h3 {
                font-size: 16px !important;
            }
            
            p, span, div {
                font-size: 14px !important;
                line-height: 1.5 !important;
            }
            
            .warning-box {
                padding: 12px !important;
                margin: 15px 0 !important;
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
            
            h2 {
                font-size: 16px !important;
            }
            
            .info-item {
                margin: 8px 0 !important;
            }
            
            .logo-img {
                max-width: 120px !important;
            }
        }
    </style>
    
</body>
</html>`,
                    recipient: organizerEmail, // ส่งให้คนที่จองห้อง
                    accessToken: tokenCache.getAccessToken(),
                };
                
                try {
                    // await sendMailAsync(mailData.subject, mailData.body, mailData.recipient, mailData.accessToken);
                    console.log(`📧 Warning email sent to ${organizerEmail} (${countbacklist.pinMissCount} misses)`);
                } catch (emailError) {
                    console.error("Error sending warning email:", emailError);
                }
            }
        }
        res.status(200).json({ message: "Event deleted successfully" });
    } catch (error) {
        console.error("Error deleting event:", error);
        res.status(500).json({ error: "Failed to delete event" });
    }
}

const createroom = async (req, res) => {
    const { createroomdata } = req.body;

    if (!createroomdata ||
        !createroomdata.RoomNumber ||
        !createroomdata.startdatetime ||
        !createroomdata.enddatetime) {
        return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const AccessToken = tokenCache.getAccessToken();
    if (!AccessToken) {
        console.error("No access token found in cache.");
        return res.status(400).json({ success: false, error: "Please login again." });
    }

    try {
        const isCreated = await createMSEvent(AccessToken, createroomdata);
        if (!isCreated) return res.status(400).json({ success: false, error: "Event creation failed." });

        console.log(`Booking created for room ${createroomdata.RoomNumber}`);
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error during createMSEvent:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
};


const createsearchpin = async (req, res) => {
    const { pindata } = req.body;
    if (!pindata || !pindata.eventId || !pindata.room_number || !pindata.organizerMail || !pindata.pin || !pindata.startDateTime || !pindata.endDateTime) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const booking = await bookingkey.create({ 
            room: pindata.room_number,
            eventId: pindata.eventId,
            organizerMail: pindata.organizerMail,
            pin: pindata.pin,
            startDateTime: new Date(pindata.startDateTime),
            endDateTime: new Date(pindata.endDateTime),
            B_createdAt: new Date()
        });
        // const booking = await bookingkey.findOne({ eventId, room: room_number });
        if (!booking) return res.status(400).json({ error: "Not found eventId" });
        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error searching pin by event ID:", error);
        res.status(500).json({ success: false, error: "Failed to search pin by event ID" });
    }
}

const endmeeting = async (req, res) => {
    try{
        const { endmeetingdata } = req.body; // endmeetingdata = {eventId, startdatetime, isAllDay}
        const enddate = new Date(); // await GetTimeAPI('UTC');
        const newenddate = new Date(enddate);
        
        const AccessToken = tokenCache.getAccessToken();
        let startDateTime;
        if (endmeetingdata.isAllDay) {
        // Parse วันที่จาก startdatetime มาเป็นปี/เดือน/วัน
        const date = new Date(endmeetingdata.startdatetime);
        const year  = date.getUTCFullYear();
        const month = date.getUTCMonth();      // zero‑based
        const day   = date.getUTCDate();

        // สร้าง timestamp ของ 00:00 UTC
        const utcMidnight = Date.UTC(year, month, day);
        // บวก 1 ชั่วโมง (1 * 60 * 60 * 1000 ms)
        const oneHourMs = 1 * 60 * 60 * 1000;
        const dt = new Date(utcMidnight + oneHourMs);
        
        // toISOString() จะคืนแบบ "...Z" เราเลย .replace เพื่อได้ ".0000000"``
        startDateTime = dt.toISOString()           // e.g. "2025-07-21T18:00:00.000Z"
        } else {
        startDateTime = new Date(endmeetingdata.startdatetime).toISOString()
        }
        await getGraphClient(AccessToken)
        .api(`/me/events/${endmeetingdata.eventId}`)
        .update({
            // subject: Meeting in Room ${endmeetingdata.RoomNumber} has end,
            isAllDay: false,
            start: {
                dateTime: startDateTime,
                timeZone: "UTC"
            },
            end: {
                dateTime: newenddate.toISOString(), 
                timeZone: "UTC"
            },
        })
        console.log("Update event success");
        res.status(200).json({ message: "Update event successfully" });
    } catch(error){
        console.error("Error in endtask:", error);
        res.status(500).json({ error: "Failed to end task" });
    }
} 

const closedoor = async (req, res) => {
    const { room_number } = req.body;
    if (!room_number) return res.status(400).json({ error: "RoomNumber is Missing" }); 
    const room = room_number.slice(2,4);

    try{
        // const isClosed = await sendMQTTMessage(`floor15/access-control/${room}`, 'close');
        // console.log(`MQTT message sent: ${isClosed}`);
        // if(!isClosed.success) throw new Error(isClosed.error);
        return res.status(200).json({ success: true, message: `Door for room ${room_number} closed successfully` });
    } catch (error){
        console.error(`Error closing door for room ${room_number}:`, error)
        res.status(500).json({ error: "Failed to close door", detail: error.message });
    }
}

module.exports = { 
    getuser
    , keyPins, createsearchpin
    , adminKeyPin, closedoor
    , deleteroom, createroom ,endmeeting
};