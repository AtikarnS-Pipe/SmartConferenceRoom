require('dotenv').config({ path: './config/.env'});
const { getTokenByCode } = require("../AuthProvider");
const tokenCache = require('../utils/tokenCache')
const {encryptToken, decryptToken} = require('../utils/encode')
const {addCacheandDB, sendscheduledata, fetchAllRoom} = require('../services/admin.services')
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const getAllusers = async (req, res) => {
    const code = req.query.code;
    let token = req.query.token;
    let tokenResponse, intervalId;

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
        intervalId = setInterval(async () => {
            await tokenCache.isTokenExpired();
            fetchAllRoom(res, decryptToken(tokenCache.getAccessToken()));
        }, 15000);

        req.on('close', () => {
        clearInterval(intervalId);
        console.log(`SSE connection closed for admin`);
        });

        req.on('error', (err) => {
            clearInterval(intervalId);
            console.error('SSE request error:', err);
        });

        // จัดการเมื่อ response สิ้นสุด
        res.on('finish', () => {
            clearInterval(intervalId);
            console.log(`Response finished for admin`);
        });


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

const getschedule = async (req, res) => {
    res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': process.env.FRONTEND_ADMIN
    });

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
        console.log(`Response finished for room ${Room}`);
    });
}


        
module.exports = { getAllusers, Login, getschedule };