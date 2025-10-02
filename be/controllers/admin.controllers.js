require('dotenv').config({ path: './config/.env' });
const { getTokenByCode } = require("../utils/AuthProvider");
const tokenCache = require('../utils/tokenCache')
const { encryptToken } = require('../utils/encode')
const {
    addCacheandDB,
    sendscheduledata,
    fetchAllRoom,
    getUserProfile,
    deleteEventByAdminService
} = require('../services/admin.services')

const isDebug = (process.env.DEBUG_MODE || "true") === "true";

const getAllusers = async (req, res) => {
    const code = req.query.code;
    // console.log("Code received:", code);
    let tokenResponse, intervalId, accessToken;

    res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': process.env.FRONTEND_ADMIN
    });

    if (code && code !== "null") {
        // Login ครั้งแรกด้วย Microsoft OAuth
        console.log("Processing Microsoft OAuth code...");

        try {
            // ขอ token จาก Microsoft
            tokenResponse = await getTokenByCode(code);
            // ตรวจสอบว่าเป็น email ที่ถูกต้องหรือไม่
            const userProfile = await getUserProfile(tokenResponse.access_token);


            if (userProfile.mail !== 'meetingroom@tcc-technology.com') {
                console.error(`💥 Unauthorized email: ${userProfile.mail} `);
                console.log("📤 Sending forceLogout event to frontend");
                res.write(`event: forceLogout\ndata: ${JSON.stringify({
                    error: `Unauthorized email: ${userProfile.mail}`
                })}\n\n`);

                console.log("⏰ Waiting 1 second before closing connection...");
                setTimeout(() => {
                    console.log("🔚 Closing SSE connection after unauthorized email");
                    res.end();
                }, 1000);
                return; // ⭐ หยุดการทำงานทันที
            }


            // เข้ารหัสและบันทึก token
            const encryptedRefreshToken = encryptToken(tokenResponse.refresh_token);

            const tokenData = {
                accessToken: tokenResponse.access_token, //encryptedAccessToken,
                refreshToken: encryptedRefreshToken,
                expiryDate: new Date(Date.now() + (tokenResponse.expires_in * 1000)),
                token_status: 'createtoken'
            };

            // บันทึก token ลง DB
            await addCacheandDB(tokenData);
            accessToken = tokenResponse.access_token;
        } catch (err) {
            console.error("Error!!", err);
            res.write(`event: error\ndata: ${JSON.stringify({
                error: "Authentication failed",
                detail: err.message
            })}\n\n`);
            res.end();
            return;
        }
    } else {
        try {
            // ไม่มี code
            console.log("No code provided, fetching token...");

            // เอา Access token ล่าสุดจาก cache 
            const latestAccessToken = tokenCache.getAccessToken();
            if (!latestAccessToken) {
                console.error("No refresh token found in cache...");
                throw new Error("No refresh token found in caches. Please login again.");
            }

            // ⭐ ตรวจสอบ email อีกครั้งแม้ว่าจะใช้ cached token
            console.log("🔍 Verifying email with cached token...");
            const userProfile = await getUserProfile(latestAccessToken);

            if (userProfile.mail !== 'meetingroom@tcc-technology.com') {
                console.error(`💥 Unauthorized email with cached token: ${userProfile.mail}`);
                console.log("📤 Sending forceLogout event to frontend");
                res.write(`event: forceLogout\ndata: ${JSON.stringify({
                    error: `Unauthorized email: ${userProfile.mail}`
                })}\n\n`);

                console.log("⏰ Waiting 1 second before closing connection...");
                setTimeout(() => {
                    console.log("🔚 Closing SSE connection after unauthorized email (cached token)");
                    res.end();
                }, 1000);
                return;
            }

            console.log("✅ Email verified with cached token:", userProfile.mail);
            accessToken = latestAccessToken;
            // console.log("get accessToken from cache:", accessToken);
        } catch (err) {
            console.error("Error in getAllusers:", err.message);
            res.write(`event: error\ndata: ${JSON.stringify({ error: "Admin controllers failed", detail: err.message })}\n\n`);
            res.end();
            return;
        }
    }
    // เริ่มดึงข้อมูล room และส่ง SSE
    await fetchAllRoom(res, accessToken);
    intervalId = setInterval(async () => {
        await fetchAllRoom(res, accessToken);
    }, 15000);

    // จัดการเมื่อ connection ปิด
    req.on('close', () => {
        clearInterval(intervalId);
        // console.log(`SSE connection closed for admin`);
    });

    req.on('error', (err) => {
        clearInterval(intervalId);
        // console.error('SSE request error:', err);
    });

    res.on('finish', () => {
        clearInterval(intervalId);
        // console.log(`Response finished for admin`);
    });


};

const Login = async (req, res) => {
    params = new URLSearchParams({
        client_id: process.env.CLIENT_ID,
        response_type: "code",
        redirect_uri: `${process.env.REDIRECT_URI}`,
        response_mode: "query",
        scope: `${process.env.SCOPE1} ${process.env.SCOPE2} ${process.env.SCOPE3} ${process.env.SCOPE4} ${process.env.SCOPE5}`,
        prompt: "select_account",
    });
    res.redirect(`https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/authorize?${params.toString()}`);
};

const getschedule = async (req, res) => {
    res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': process.env.FRONTEND_ADMIN
    });

    // res.flushHeaders();
    sendscheduledata(req, res)
    const intervalId = setInterval(async () => {
        sendscheduledata(req, res)
    }, 10000);

    // *** สำคัญ: จัดการ cleanup เมื่อ client disconnect ***
    // ปิด connection
    req.on('close', () => {
        clearInterval(intervalId);
        // console.log(`SSE connection closed`);
    });

    req.on('error', (err) => {
        clearInterval(intervalId);
        // console.error('SSE request error:', err);
    });

    // จัดการเมื่อ response สิ้นสุด res.end()
    res.on('finish', () => {
        clearInterval(intervalId);
        // console.log(`Response finished`);
    });
}

const deleteeventbyadmin = async (req, res) => {
    if (isDebug) {
        return res.status(200).json({ message: "Debug mode - skip delete" });
    }

    const { eventId, room_number } = req.body; // eventId, room_number

    const AccessToken = tokenCache.getAccessToken();
    if (!AccessToken) {
        return res.status(401).json({ error: "No refresh token found. Please login again." });
    }

    try {
        const result = await deleteEventByAdminService(eventId, room_number, AccessToken);

        if (!result.success) {
            return res.status(result.status).json({ error: result.message });
        }

        return res.status(200).json({ message: result.message });
    } catch (error) {
        console.error("Error deleting event by admin:", error);
        return res.status(500).json({ error: "Failed to delete event by admin" });
    }
};


module.exports = { getAllusers, Login, getschedule, deleteeventbyadmin };