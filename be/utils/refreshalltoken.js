require('dotenv').config({ path: "../config/.env" })
const jwt = require('jsonwebtoken');

function refreshalltoken(req, res, userId) {
  const newAccessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
  const newRefreshToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN });
  console.log("Creating new access token for user:", userId);
  
  // ⭐ แก้ cookie path และ domain
  res.cookie("refreshtoken", newRefreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/', // ⭐ เปลี่ยนเป็น / เพื่อให้ใช้ได้ทุก path
    // domain: '.tcc-technology.com' // ⭐ เพื่อให้ใช้ได้ทั้ง subdomain
  });
  
  console.log("Successfully refresh token");
  return newAccessToken;
}

const refreshadmintoken = async (req, res) => {
  console.log("🔍 Refresh token request:");
  console.log("- Cookies:", req.cookies);
  console.log("- Headers cookie:", req.headers.cookie);
  
  const refreshToken = req.cookies.refreshtoken;
  
  if (!refreshToken) {
    console.error("❌ No refresh token found in cookies");
    return res.status(401).json({ error: 'No refresh token provided.' });
  }

  jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error("❌ Invalid refresh token:", err.message);
      return res.status(401).json({ error: 'Invalid or expired refresh token.', details: err.message });
    }

    const userId = decoded.userId;
    console.log("✅ Valid refresh token for user:", userId);

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

    // ⭐ แก้ cookie name และ path ให้ตรงกับ function ข้างบน
    res.cookie("refreshtoken", newRefreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/', // ⭐ เปลี่ยนเป็น /
      // domain: '.tcc-technology.com' // ⭐ เพิ่ม domain
    });

    console.log("✅ New tokens generated successfully");

    res.json({
      refreshSuccess: true,
      accessToken: newAccessToken,
    });
  });
};

module.exports = { refreshalltoken, refreshadmintoken }