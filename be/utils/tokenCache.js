// tokenCache.js
const {refreshAccessToken} = require('../AuthProvider')
const {encryptToken, decryptToken} = require('../utils/encode')
const Token = require('../models/token')

let accessToken = null;
let refreshToken = null;
let expiryDate = null; // Date object or ISO string

let started = false; // กำหนด monitor เริ่มรันเเค่ครั้งเดียว

/**
   * Check if current token is expired
   * If expired, refresh it and update the cache and DB
*/
async function monitorToken() {
  if (started) return;
  started = true;

  console.log("🚀 Starting token monitor...");
  while (true) {
    if (!refreshToken || !expiryDate) {
      const tokenData = await Token.findOne().sort({ createdAt: -1 });
      if (!tokenData) console.log("No token found in DB");
      refreshToken = tokenData ? tokenData.refreshToken : null;
      expiryDate = tokenData ? new Date(tokenData.expiryDate) : null;
      accessToken = tokenData ? tokenData.accessToken : null;
      if (!refreshToken || !expiryDate) {
        console.log("⏳ Monitoring is waiting for token in cache...");
        await sleep(5000);
        continue;
      }
    }

    const now = new Date();
    const buffer = 5 * 60 * 1000;

    if (now >= new Date(expiryDate.getTime() - buffer)) {
      try {
        console.log("🔁 Refreshing token...");
        const newToken = await refreshAccessToken(decryptToken(refreshToken));
        const newAccessToken = encryptToken(newToken.access_token);
        const newRefreshToken = newToken.refresh_token? encryptToken(newToken.refresh_token) : refreshToken;
        const newExpiry = new Date(Date.now() + (newToken.expires_in || 3600) * 1000); //

        accessToken = newAccessToken;
        refreshToken = newRefreshToken;
        expiryDate = newExpiry;

        await Token.create({
          accessToken,
          refreshToken,
          expiryDate: newExpiry
        });

        console.log("✅ Token refreshed and inserted into DB");
      } catch (err) {
        console.error("❌ Failed to refresh token:", err.message);
      }
    }

    await sleep(20000);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms)); 
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
  }
};
