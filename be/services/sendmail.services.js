const getGraphClient = require('../utils/graph');
require('isomorphic-fetch');
fs = require('fs');
const path = require('path');

async function sendMailAsync(subject, body, recipient, accessToken) { // เเก้ผู้รับเมลให้ตาม api
    try{
        const imagePath = path.join(__dirname, '../logo/thumbnail_Outlook-tnktrguf.png');
        const imageData = fs.readFileSync(imagePath).toString('base64'); // อ่านไฟล์รูปภาพเป็น base64
        const client = getGraphClient(accessToken);
        const message = {
            message: {
            subject,
            body: { contentType: 'HTML', content: body },
            toRecipients: [{ emailAddress: { address: recipient } }], //`${@tcc-technology}`
            attachments: [
                {
                    "@odata.type": "#microsoft.graph.fileAttachment",
                    name: "thumbnail_Outlook-tnktrguf.png", // เปลี่ยนชื่อให้ตรงกับไฟล์จริง
                    contentType: "image/png", // เปลี่ยนชนิดเป็น image/png
                    contentBytes: imageData,  // รูป base64
                    contentId: "thumbnail_Outlook-tnktrguf.png",  // ช้ตรงกับ src="cid:..."
                    isInline: true
                }
            ]
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