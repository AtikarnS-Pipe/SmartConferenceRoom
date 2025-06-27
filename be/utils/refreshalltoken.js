require('dotenv').config({path:"../config/.env"})
const jwt = require('jsonwebtoken');

function refreshalltoken(req, res, userId) {
    const newAccessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    const newRefreshToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN });
    res.cookie("refreshtoken", newRefreshToken, { // จนกว่าจะปิด browser cookie จึงจะหมดอายุ
      httpOnly: true,
      secure: false,  // เปลี่ยนเป็น true ถ้าใช้ HTTPS
      sameSite: 'lax', // ป้องกัน CSRF
      path: '/account/refresh-token', // จำกัด route ที่ใช้ cookie ได้
    });
    // res.json({ refreshSuccess: "true",
    //   accessToken: newAccessToken,
    //   refreshToken: newRefreshToken //เดี๋ยวมาลบ*********
    //   });
    return newAccessToken;
}
module.exports = { refreshalltoken }