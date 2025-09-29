/**
 * ไฟล์นี้จัดการการแสดงผล Swagger UI สำหรับโปรเจค Smart Display Conference
 *
 * วิธีการใช้งาน:
 *   1. ติดตั้งไลบรารี swagger-ui-express และ yamljs ด้วยคำสั่ง:
 *        npm install swagger-ui-express yamljs
 *   2. ในไฟล์ app.js หรือไฟล์ที่สร้าง Express app ให้เรียกใช้โมดูลนี้และ
 *      ส่ง instance ของ app เข้าไป เช่น:
 *        const express = require('express');
 *        const app = express();
 *        // ... ตั้งค่าอื่นๆ ...
 *        require('./swagger')(app);
 *   3. รันเซิร์ฟเวอร์แล้วเปิดเบราว์เซอร์ไปที่ http://localhost:PORT/api-docs เพื่อดูเอกสาร
 */

const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

// โหลดไฟล์สเปค root
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));

module.exports = function setupSwagger(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};