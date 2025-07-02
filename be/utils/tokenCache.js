// tokenCache.js
const {refreshAccessToken} = require('../AuthProvider')
const {encryptToken, decryptToken} = require('../utils/encode')
const Token = require('../models/token')

let accessToken = null;
let refreshToken = null;
let expiryDate = null; // Date object or ISO string

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

  /**
   * Check if current access token is expired
   * @returns {boolean}
   */
  isTokenExpired: async function() {
    if(new Date() >= expiryDate){
      this.clear()
      // จริงๆ ต้องเอา unique ตัวเองหา ใน TOKEN DB ถ้าเจอดึงมา refresh, ไม่เจอ error
    }
    if(accessToken === null || refreshToken === null || expiryDate === null){ // server down
      try{
        const Gettoken = await Token.findOne().sort({ _id: 1 }); // subscription ที่มีค่า index น้อยที่สุด
        if (!Gettoken) {
          console.error('No token found in DB')
          throw new Error("No token in DB or can not find token in DB")
        }
        // console.log('Display findOne():',Gettoken);
        const newtoken = await refreshAccessToken(decryptToken(Gettoken.refreshToken))
        this.setToken({ 
          accessToken: encryptToken(newtoken.access_token),// opactoken
          refreshToken: encryptToken(newtoken.refresh_token), // oprftoken
          expiryDate: new Date(Date.now() + 60 * 60 * 1000)
        });
      } catch (err) {
        console.error("tokenCache.js :", err);
        return; 
      }
      
    }
  },

  /**
   * Clear all token data
   */
  clear: () => {
    accessToken = null;
    refreshToken = null;
    expiryDate = null;
  }
};
