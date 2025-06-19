// tokenCache.js

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
  isTokenExpired: () => {
    if (!expiryDate) return true;
    return new Date() >= expiryDate;
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
