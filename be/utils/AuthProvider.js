const axios = require('axios');
const qs = require('querystring');
require('dotenv').config({ path: './config/.env' });

async function getTokenByCode(code) {
    const tokenEndpoint = `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`;

    const params = {
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.REDIRECT_URI,
        scope: `${process.env.SCOPE1} ${process.env.SCOPE2} ${process.env.SCOPE3} ${process.env.SCOPE4} ${process.env.SCOPE5}`
    };

    const response = await axios.post(tokenEndpoint, qs.stringify(params), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    return response.data;
}

async function refreshAccessToken(refresh_token) {
  const tenant = process.env.TENANT_ID || 'common';
  const tokenEndpoint = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;

  const params = {
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    grant_type: 'refresh_token',
    refresh_token,
    scope:  process.env.SCOPE1 + ' ' + process.env.SCOPE2 + ' ' + process.env.SCOPE3 + ' ' + process.env.SCOPE4 + ' ' + process.env.SCOPE5,
  };

  try {
    const response = await axios.post(tokenEndpoint, qs.stringify(params), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return response.data;
  } catch (error) {
    if (error.response?.data?.error === "invalid_grant") {
      console.warn("⚠️ Refresh token invalid/expired. Waiting for admin login...");
    } else {
      console.error("❌ Failed to refresh token:", error.message);
    }
    return null;
  }
}

module.exports = {
  getTokenByCode,
  refreshAccessToken
};
