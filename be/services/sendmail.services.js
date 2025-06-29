const { Client } = require('@microsoft/microsoft-graph-client');
require('isomorphic-fetch');

async function sendMailAsync(subject, body, recipient, accessToken) { // เเก้ผู้รับเมลให้ตาม api
    try{
    const client = getClient(accessToken);
    const message = {
        message: {
        subject,
        body: { contentType: 'Text', content: body },
        toRecipients: [{ emailAddress: { address: recipient } }] //`${@tcc-technology}`
    },
    saveToSentItems: true
    };
    return client.api('/me/sendMail').post(message);
    } catch (error) {
        console.error('Send mail failed:', error);
        throw error;
    }
}

function getClient(accessToken) {
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    }
  });
}

module.exports = sendMailAsync