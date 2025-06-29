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
module.exports = { refreshalltoken }