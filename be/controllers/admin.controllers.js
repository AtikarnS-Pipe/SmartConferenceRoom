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

    if (!code && !req.session.homeAccountId) {
         console.log("fail session")

        res.write(`event: error\ndata: ${JSON.stringify({ error: "No code, please login" })}\n\n`);
        res.end();
        return;
    }
    console.log("Admin ready to get data")

    try{
        if (code && code !== "null") {
        console.log("Geting Token first time!!")
            const tokenResponse = await authProvider.acquireTokenByCode({
                code,
                scopes: [process.env.SCOPE],
                redirectUri: `${process.env.FRONTEND_ADMIN}/admin/api`,
            });
            if (!tokenResponse) {
                throw new Error("tokenResponse is undefined");
            }
            req.session.homeAccountId = tokenResponse.account.homeAccountId;
        }        
    } catch (err) {
            console.error("Error in acquireTokenByCode:", err.message);
            const token = req.cookies.user_token;
           if (token) {
                try {
                    const jwtpayload = jwt.verify(token, JWT_SECRET);
                    const account = await authProvider.getAccountById(jwtpayload.homeAccountId);
                    if (account) {
                        req.session.homeAccountId = account.homeAccountId;
                    } else {
                        throw new Error("No account found from cookie token");
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
    
        
    try{
        let account, accessToken;

            account = await authProvider.getAccountById(req.session.homeAccountId);
            if (!account) {
                res.write(`event: error\ndata: ${JSON.stringify({ error: "Session expired, please login again" })}\n\n`);
                res.end();
                return;
            }
            accessToken = await getAccessToken(account, req, res);
            setInterval(async () => {
                const newToken = await getAccessToken(account, req, res);
                if (newToken) {
                    accessToken = newToken; // อัปเดตค่า
                    console.log("Access token updated");
                } else {
                    console.warn("Failed to refresh access token");
                }
            }, 30 * 60 * 1000); // ทุก 30 นาที
        
            fetchAllRoom(res, accessToken);
            const intervalId = setInterval(async () => {
                fetchAllRoom(res, accessToken);
            }, 10000);

    } catch (err) {
        res.write(`event: error\ndata: ${JSON.stringify({ error: "Failed, please check login, geting token and fetching data", detail: err.message })}\n\n`);
        res.end();
        return;
    }
};

const Login = async (req, res) => {
    console.log("welcome to admin/api")
    if (req.session.homeAccountId) {
      res.redirect(`${process.env.FRONTEND_ADMIN}/admin/api`);
      console.log("Redirect to admin/api")
    } else {
      const params = new URLSearchParams({
        client_id: process.env.CLIENT_ID,
        response_type: "code",
        redirect_uri: `${process.env.FRONTEND_ADMIN}/admin/api`, // redirect กลับ FE
        response_mode: "query",
        scope: process.env.SCOPE
      });
      console.log("login to admin/api")
      res.redirect(`https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/authorize?${params.toString()}`);
    }
};


async function getAccessToken(account, req, res){
        try{
            let tokenResponse = await authProvider.acquireTokenSilent(
                account,
                ["Calendars.Read.Shared"]
            );
            if (account) {
                const shareToken = jwt.sign(
                    { homeAccountId: account.homeAccountId, type: 'share' },
                    JWT_SECRET,
                    { expiresIn: process.env.JWT_EXPIRES_IN }
                );
                res.cookie("user_token", shareToken, { ///
                    httpOnly: true,
                    secure: false, // true ถ้าใช้ https
                    sameSite: "strict",
                    maxAge:  60 * 60 * 1000
                });
            return tokenResponse.accessToken;   
            }else{
                throw new Error("Cannot get TokenSilent.(tokenResponse is undefined)");
            }
        } catch (err) {
            console.error("Error in acquireTokenSilent:", err);
            return null;
        }
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