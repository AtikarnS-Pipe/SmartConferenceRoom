// tokenCache.js
const { refreshAccessToken } = require('./AuthProvider')
const { encryptToken, decryptToken } = require('../utils/encode')
const Token = require('../models/token')
const getGraphClient = require('./graph');

let accessToken = null;
let refreshToken = null;
let expiryDate = null; // Date object or ISO string
let calendarLoaded = false;
let roomobject = {
  "1501": '', "1502": '', "1503": '', "1504": '', "1505": '',
  "1506": '', "1514": '', "1515": '', "1519": '', "1520": '',
};

let started = false; // กำหนด monitor เริ่มรันเเค่ครั้งเดียว

/**
   * Check if current token is expired
   * If expired, refresh it and update the cache and DB
   * 
   ** Check if roomobject is empty
   * If empty, GET them IDs and update the roomobject
   * @param {string} token - Access token to authenticate with Microsoft Graph API
*/
async function monitorToken() {
  if (started) return;
  started = true;

  console.log("🚀 Starting token monitor...");
  while (true) {
    if (!refreshToken || !expiryDate || refreshToken === 'null') {
      const tokenData = await Token.findOne({
        token_status: { $in: ['refreshed', 'createtoken'] }
      }).sort({ createdAt: -1 });
      if (!tokenData) console.log("No token found in DB, Admin needs to login.");

      refreshToken = tokenData ? tokenData.refreshToken : null;
      expiryDate = tokenData ? new Date(tokenData.expiryDate) : null;
      accessToken = tokenData ? tokenData.accessToken : null;

      if (!refreshToken || !expiryDate) {
        console.log("⏳ Monitoring is waiting for token...");
        await sleep(5000);
        continue;
      }
    }

    const now = new Date();
    const buffer = 10 * 60 * 1000;

    if (now >= new Date(expiryDate.getTime() - buffer)) {
      try {
        console.log("🔁 Refreshing token...");
        // console.log("refresh tokenn:", refreshToken );
        const newToken = await refreshAccessToken(decryptToken(refreshToken));
        if (!newToken || !newToken.access_token) {
          console.log("logs status: refresh token failed in DB");
          accessToken = null
          refreshToken = null
          expiryDate = null

          await Token.create({
            accessToken,
            refreshToken,
            expiryDate,
            token_status: 'refreshfailed'
          });
          await sleep(10 * 1000); // wait 10s before retrying
          continue;
        }
        // console.log("New token received:", newToken);
        const newRefreshToken = newToken.refresh_token ? encryptToken(newToken.refresh_token) : null;

        accessToken = newToken.access_token;
        refreshToken = newRefreshToken;
        expiryDate = new Date(Date.now() + (newToken.expires_in || 3600) * 1000);

        await Token.create({
          accessToken,
          refreshToken,
          expiryDate,
          token_status: 'refreshed'
        });

        console.log("✅ Token refreshed and inserted into DB");
      } catch (err) {
        console.error("❌ Failed to refresh token:", err.message);
        continue;
      }
    }
    if (accessToken && !calendarLoaded) {
      calendarLoaded = await monitorCalendarId(accessToken);
    }
    await sleep(30 * 1000);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function monitorCalendarId(token) {
  const isroomissing = Object.values(roomobject).some(val => !val) // if any roomobject key is empty
  try {
    if (isroomissing) {
      console.log("Preloading calendar IDs api...");
      const calendars = await GetIdRoomnumber(token, roomobject); // update roomobject value with calendar IDs
      return calendars ? true : false;
    }

  } catch (err) {
    console.error("❌ Failed to get calendar ID :", err.message);
  }
}

async function GetIdRoomnumber(token, roomobject) {
  try {
    const calendars = await getGraphClient(token)
      .api('https://graph.microsoft.com/v1.0/me/calendars')
      .get();
    console.log("Preloading calendar IDs foreach...");
    calendars.value.forEach(cal => {
      const roomMatch = Object.keys(roomobject).find(room =>
        cal.owner?.address?.includes(`${room}@tcc-technology.com`)
      );
      if (roomMatch) {
        roomobject[roomMatch] = cal.id;
      }
    });
    // console.log("Available calendars:", calendars.value.map(cal => ({
    //     name: cal.name,
    //     id: cal.id,
    //     owner: cal.owner?.address
    // })));
    return calendars;
  } catch (error) {
    throw new Error('Failed to fetch ID');
  }
}
module.exports = {
  /**
   * Set token and expiry
   * @param {Object} tokenData 
   * @param {string} tokenData.accessToken 
   * @param {string} tokenData.refreshToken 
   * @param {Date|string} tokenData.expiryDate
   */
  setToken: ({ accessToken: at, refreshToken: rt, expiryDate: ed }) => {
    accessToken = at;
    refreshToken = rt;
    expiryDate = new Date(ed); // always convert to Date
  },

  /**
   * Get the current access token
   */
  getAccessToken: () => accessToken,

  /**
   * Get the current refresh token
   */
  getRefreshToken: () => refreshToken,

  monitorToken,

  /**
   * Clear all token data
   */
  clear: () => {
    accessToken = null;
    refreshToken = null;
    expiryDate = null;
  },

  roomobject
};