const crypto = require('crypto');
// const { config } = require('dotenv');
require('dotenv').config({path:"./config/.env"})
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'base64'); // node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
const IV_LENGTH = 12; 

// Encrypt
function encryptToken(plainText) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);

  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

// Decrypt
function decryptToken(encryptedBase64) {
  const data = Buffer.from(encryptedBase64, 'base64');
  const iv = data.slice(0, IV_LENGTH);
  const tag = data.slice(IV_LENGTH, IV_LENGTH + 16);
  const encryptedText = data.slice(IV_LENGTH + 16);

  const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  decipher.setAuthTag(tag);

  const decrypted = decipher.update(encryptedText, null, 'utf8') + decipher.final('utf8');
  return decrypted;
}

module.exports = { encryptToken, decryptToken };
