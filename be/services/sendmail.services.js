const getGraphClient = require('../utils/graph');
require('isomorphic-fetch');
const fs = require('fs');
const path = require('path');
const retryCount = 3; // ลองใหม่กี่ครั้ง

async function sendMailAsync(subject, body, recipient, accessToken) { // ช้ตรงกับ src="cid:..."
  const imagePath = path.join(__dirname, '../logo/thumbnail_Outlook-tnktrguf.png'); // อ่านไฟล์รูปภาพเป็น base64
  const imageData = fs.readFileSync(imagePath).toString('base64');
  const client = getGraphClient(accessToken);

  const message = {
    message: {
      subject,
      body: { contentType: 'HTML', content: body },
      toRecipients: [{ emailAddress: { address: recipient } }],
      attachments: [
        {
          "@odata.type": "#microsoft.graph.fileAttachment",
          name: "thumbnail_Outlook-tnktrguf.png", // เปลี่ยนชื่อให้ตรงกับไฟล์จริง
          contentType: "image/png", // เปลี่ยนชนิดเป็น image/png
          contentBytes: imageData,  // รูป base64
          contentId: "thumbnail_Outlook-tnktrguf.png", 
          isInline: true
        }
      ]
    },
    saveToSentItems: true
  };

  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      await client.api('/me/sendMail').post(message);
      console.log(`Mail sent successfully to ${recipient}`);
      return true; // success
    } catch (error) {
      const code = error.statusCode || error.code;
      console.error(`Send mail failed (attempt ${attempt}/${retryCount}):`, code, error.message);

      // Graph แนะนำ exponential backoff เวลามี 429/503
      if (attempt < retryCount && (code === 429 || code === 503)) {
        const wait = 2000 * attempt; // 2s, 4s, 6s...
        console.log(` Retrying after ${wait}ms...`);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }

      return false; // fail แบบถาวร
    }
  }
}

module.exports = sendMailAsync;
