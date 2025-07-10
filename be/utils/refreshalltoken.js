require('dotenv').config({path:"../config/.env"})
const jwt = require('jsonwebtoken');

function refreshalltoken(req, res, userId) {
    const newAccessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    const newRefreshToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN });
    console.log("newAccessToken");
    // จนกว่าจะปิด browser cookie จึงจะหมดอายุ
    res.cookie("refreshtoken", newRefreshToken, { 
      httpOnly: true,
      secure: false, 
      sameSite: 'lax', 
      path: '/account/refresh-token', 
    });
    // res.json({ refreshSuccess: "true",
    //   accessToken: newAccessToken,
    //   refreshToken: newRefreshToken //เดี๋ยวมาลบ*********
    //   });
    console.log("sucessfully refresh token");
    return newAccessToken;
}

// ถ้ากด fn. อื่นจะมา refresh token ให้ใหม่ก่อน เเล้วค่อยไปใช้งาน
const refreshadmintoken = async (req, res) => {
  const refreshToken = req.cookies.refreshtoken;
  jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => { // ตรวจสอบ token ว่ายังไม่หมดอายุ
    if (err) {
      return res.status(401).json({ error: 'Invalid refresh token', err: err.message });
    }
      const userId = decoded.userId;

    if(decoded.expiredate < new Date()) {
      // รับ userid
      const newAccessToken = jwt.sign({ userId, expiredate: new Date() + 55 * 60 * 1000 }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
      const newRefreshToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN });
      res.cookie("refreshtoken", newRefreshToken, { // จนกว่าจะปิด browser cookie จึงจะหมดอายุ
        httpOnly: true,
        secure: false,  // เปลี่ยนเป็น true ถ้าใช้ HTTPS
        sameSite: 'lax', // ป้องกัน CSRF
        path: '/account/refresh-token', // จำกัด route ที่ใช้ cookie ได้
      });
      res.json({ refreshSuccess: "true",
        accessToken: newAccessToken,
        refreshToken: newRefreshToken //เดี๋ยวมาลบ*********
        });
    }
  });
};
module.exports = { refreshalltoken, refreshadmintoken }