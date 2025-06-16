require('dotenv').config({ path: './config/.env'});
const getGraphClient = require("../graph");
const { authProvider } = require("../AuthProvider");
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

const getAllusers = async (req, res) => {
    const code = req.query.code;

    res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': process.env.FRONTEND_ADMIN
    });

    let homeAccountId = null;
    try {
        if (code && code !== "null") {
            // login ครั้งแรก
            const tokenResponse = await authProvider.acquireTokenByCode({
                code,
                scopes: [process.env.SCOPE],
                redirectUri: `${process.env.FRONTEND_ADMIN}/admin/api`,
            });
            homeAccountId = tokenResponse.account.homeAccountId;
            // set cookie หลัง login สำเร็จ
            const shareToken = jwt.sign(
                { homeAccountId, type: 'share' },
                JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );
            res.cookie("user_token", shareToken, {
                httpOnly: true,
                secure: false,
                sameSite: "lax", // ใช้ lax cookie ใน request ที่ไม่ใช่ same-origin
                path: '/',
                maxAge: 60 * 60 * 1000
            });
        } else {
            // ไม่มี code ให้ใช้ cookie
            const ttoken = req.cookies.user_token;
            if (ttoken) {
                try {
                    const jwtpayload = jwt.verify(ttoken, JWT_SECRET);
                    homeAccountId = jwtpayload.homeAccountId;
                    // ตรวจสอบ account ใน MSAL cache
                    const account = await authProvider.getAccountById(homeAccountId);
                    if (!account) {
                        res.write(`event: error\ndata: ${JSON.stringify({ error: "Session expired, please login again" })}\n\n`);
                        res.end();
                        return;
                    }
                } catch (jwtError) {
                    console.log("JWT error:", jwtError.message);
                    res.write(`event: error\ndata: ${JSON.stringify({ error: "Token invalid or expired" })}\n\n`);
                    res.end();
                    return;
                }
            } else {
                res.write(`event: error\ndata: ${JSON.stringify({ error: "No valid code or token" })}\n\n`);
                res.end();
                return;
            }
        }

        if (!homeAccountId) {
            res.write(`event: error\ndata: ${JSON.stringify({ error: "No valid code or token" })}\n\n`);
            res.end();
            return;
        }

        let account = await authProvider.getAccountById(homeAccountId);
        if (!account) {
            res.write(`event: error\ndata: ${JSON.stringify({ error: "Session expired, please login again" })}\n\n`);
            res.end();
            return;
        }
        let accessToken = await getAccessToken(account);

        setInterval(async () => {
            const newToken = await getAccessToken(account);
            if (newToken) accessToken = newToken;
        }, 30 * 60 * 1000);

        fetchAllRoom(res, accessToken);
        setInterval(async () => {
            fetchAllRoom(res, accessToken);
        }, 10000);

    } catch (err) {
        res.write(`event: error\ndata: ${JSON.stringify({ error: "Failed, please check login, geting token and fetching data", detail: err.message })}\n\n`);
        res.end();
        return;
    }
};

const Login = async (req, res) => {
    params = new URLSearchParams({
        client_id: process.env.CLIENT_ID,
        response_type: "code",
        redirect_uri: `${process.env.FRONTEND_ADMIN}/admin/api`,
        response_mode: "query",
        scope: process.env.SCOPE
    });
    res.redirect(`https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/authorize?${params.toString()}`);
};


async function getAccessToken(account){
        let tokenResponse = await authProvider.acquireTokenSilent(
            account,
            ["Calendars.Read.Shared"]
        );
        return tokenResponse.accessToken;   
    } 

async function fetchAllRoom(res, accessToken) {
    try {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);

        const startDateTime = now.toISOString().slice(0,10); //"2025-05-19"
        const endDateTime = tomorrow.toISOString().slice(0,10);
        const roomNumbers = [
            1501, 1502, 1503, 1504, 1505,
            1506, 1514, 1515, 1519, 1520
        ];

        if (!accessToken) {
            throw new Error("No accessToken");
        }

        const results = await Promise.all(
            roomNumbers.map(async (room) => {
                const graphResponse = await getGraphClient(accessToken)
                    .api(`https://graph.microsoft.com/v1.0/users/${room}@tcc-technology.com/calendarView`)
                    .query({
                        startDateTime: `${startDateTime}T00:00:00Z`,
                        endDateTime: `${endDateTime}T00:00:00Z`,
                        "$orderby": "start/dateTime",
                        "$select": "organizer,start,end,locations"
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

        console.log(results);
        res.write(`data: ${JSON.stringify({ results })}\n\n`);
    } catch (error) {
        console.error(error);
        res.write(`event: error\ndata: ${JSON.stringify({ error: "Failed to fetch data (fetchRoomEventsAndSend)" })}\n\n`);
    }
}
        
module.exports = { getAllusers, Login, fetchAllRoom };