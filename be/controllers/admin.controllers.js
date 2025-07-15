require('dotenv').config({ path: './config/.env'});
const { getTokenByCode } = require("../AuthProvider");
const tokenCache = require('../utils/tokenCache')
const {encryptToken} = require('../utils/encode')
const {
    addCacheandDB, 
    sendscheduledata, 
    fetchAllRoom,
    getUserProfile,
    } = require('../services/admin.services')

const getAllusers = async (req, res) => {
    const code = req.query.code;
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
                console.error(`💥 Unauthorized email: ${userProfile.mail}, Only meetingroom@tcc-technology.com is allowed. `);
                res.write(`event: forceLogout\ndata: ${JSON.stringify({ 
                error: `Unauthorized email: ${userProfile.mail}, Only meetingroom@tcc-technology.com is allowed.`})}\n\n`);
                return;
            }

            console.log(`✅ Authorized user: ${userProfile.mail}`);

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
        console.log(`SSE connection closed for admin`);
    });

    req.on('error', (err) => {
        clearInterval(intervalId);
        console.error('SSE request error:', err);
    });

    res.on('finish', () => {
        clearInterval(intervalId);
        console.log(`Response finished for admin`);
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
        console.log(`SSE connection closed`);
    });

    req.on('error', (err) => {
        clearInterval(intervalId);
        console.error('SSE request error:', err);
    });

    // จัดการเมื่อ response สิ้นสุด res.end()
    res.on('finish', () => {
        clearInterval(intervalId);
        console.log(`Response finished`);
    });
}



        
module.exports = { getAllusers, Login, getschedule };