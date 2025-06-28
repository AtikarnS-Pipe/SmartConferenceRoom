require('dotenv').config({ path: './config/.env'});
const getGraphClient = require("../graph");
const { getTokenByCode, refreshAccessToken } = require("../AuthProvider");
const tokenCache = require('../utils/tokenCache')
const {encryptToken, decryptToken} = require('../utils/encode')
const {addCacheandDB} = require('../services/adminsocket.services')
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const getAllusers = async (req, res) => {
    const code = req.query.code;
    let token = req.query.token;
    let tokenResponse;

    res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': process.env.FRONTEND_ADMIN
    });

    // check token has loged in by admin and get admin db
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await User.findById(decoded.userId);
    if (!admin || admin.role !== 'admin') {
        res.write(`event: error\ndata: ${JSON.stringify({ error: 'cant found admin!!' })}\n\n`);
        res.end();
        return;
    }

    // check code is loged in by microsoft
    try {
        if (code && code !== "null") {
            // login ครั้งแรก
            let encryptedACToken, encryptedRFToken, datatoken;
            tokenResponse = await getTokenByCode(code);
            try{
                encryptedRFToken = encryptToken(tokenResponse.refresh_token);
                encryptedACToken = encryptToken(tokenResponse.access_token);
                datatoken = { 
                    account: admin._id,
                    accessToken: encryptedACToken, 
                    refreshToken: encryptedRFToken, 
                    expiryDate: new Date(Date.now() + 60 * 60 * 1000)
                }
                await addCacheandDB(datatoken, admin._id);
            } catch(err){
                throw new Error("error:", err.message) 
            }
        } else {
            // GET token from cache or refresh it / if not found, get from DB
            await tokenCache.isTokenExpired();
        }
        
         
        fetchAllRoom(res, decryptToken(tokenCache.getAccessToken()));
        setInterval(async () => {
            await tokenCache.isTokenExpired();
            fetchAllRoom(res, decryptToken(tokenCache.getAccessToken()));
        }, 15000);


    } catch (err) {
        console.error("Error: Checking in admin.controllers")
        res.write(`event: error\ndata: ${JSON.stringify({ error: "Failed, please check login, geting token and fetching data", detail: err.message })}\n\n`);
        res.end();
        return;
    }
};

const Login = async (req, res) => {
    params = new URLSearchParams({
        client_id: process.env.CLIENT_ID,
        response_type: "code",
        redirect_uri: `${process.env.REDIRECT_URI}`,
        response_mode: "query",
        scope: `${process.env.SCOPE1} ${process.env.SCOPE2}`
    });
    res.redirect(`https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/authorize?${params.toString()}`);
};

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

        console.log("admin GET API success!!");
        res.write(`data: ${JSON.stringify({ results })}\n\n`);
    } catch (error) {
        console.error(error);
        res.write(`event: error\ndata: ${JSON.stringify({ error: "Failed to fetch data (fetchRoomEventsAndSend)" })}\n\n`);
    }
}
        
module.exports = { getAllusers, Login };