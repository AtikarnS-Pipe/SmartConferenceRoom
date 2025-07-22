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
      path: '/account/refreshtoken', 
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
  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token provided.' });
  }

  jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid or expired refresh token.', details: err.message });
    }

    const userId = decoded.userId;

    const newAccessToken = jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    const newRefreshToken = jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
    );

    res.cookie("refreshtoken", newRefreshToken, {
      httpOnly: true,
      secure: false,  // เปลี่ยนเป็น true ถ้าใช้ HTTPS
      sameSite: 'lax',
      path: '/account/refreshtoken',
    });

    res.json({
      refreshSuccess: true,
      accessToken: newAccessToken,
    });
  });
};
module.exports = { refreshalltoken, refreshadmintoken }