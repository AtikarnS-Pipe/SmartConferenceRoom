const getGraphClient = require('../utils/graph');
require('isomorphic-fetch');

async function sendMailAsync(subject, body, recipient, accessToken) { // เเก้ผู้รับเมลให้ตาม api
    try{
    const client = getGraphClient(accessToken);
    const message = {
        message: {
        subject,
        body: { contentType: 'HTML', content: body },
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

module.exports = sendMailAsync