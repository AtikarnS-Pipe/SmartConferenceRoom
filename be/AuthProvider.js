const axios = require('axios');
const qs = require('querystring');
require('dotenv').config();

async function getTokenByCode(code) {
    const tokenEndpoint = `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`;

    const params = {
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.REDIRECT_URI,
        scope: `${process.env.SCOPE1} ${process.env.SCOPE2} ${process.env.SCOPE3}`
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
    scope:  process.env.SCOPE1 + ' ' + process.env.SCOPE2 + ' ' + process.env.SCOPE3
  };

  try {
    const response = await axios.post(tokenEndpoint, qs.stringify(params), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return response.data;
  } catch (error) {
    console.error("Error: Refresh token Error");
    if (error.response) {
      console.error("Status Code:", error.response.status);
      console.error("Response Data:", error.response.data);
    } else {
      console.error("Error Message:", error.message);
    }
    throw error;
  }
}

module.exports = {
  getTokenByCode,
  refreshAccessToken
};
