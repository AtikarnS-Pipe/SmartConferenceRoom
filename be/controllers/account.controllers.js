// accounts.controllers.js
const bcrypt = require('bcryptjs');
const { refreshalltoken } = require('../utils/refreshalltoken');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const Auth = async (req, res) => {
    const { email, password } = req.body;
    console.log("ready to auth", email, password);
    try{
      const user = await User.findOne({ email });
      
      if(!user){
        console.log("User not found");
        return res.status(404).json({error: "User not found"});
      } 
      const isMatch = await bcrypt.compare(password, user.password);
      if(!isMatch){
        console.log("Invalid credentials");
        return res.status(400).json({error: "Invalid credentials"});
      }  

      if (user.role !== 'admin') {
        console.log("invalid role");  
        return res.status(403).json({ message: 'Access denied. Only admin can sign in.' });
      }
      console.log("2312312sasasas3Invalid credentials");

      user.login_status = 'online';
      await user.save();
      // รับ userId:user._id
      const token = refreshalltoken(req, res, user._id);
      console.log("get token successfully", token);
      res.json({token})
    } catch (error) {
      res.status(500).json({error: error.message});
    }
}

const Createhousekeeper = async (req, res) => {
    const admin = req.user; // จาก authorize middleware

    if (admin.role !== 'admin') {
        return res.status(403).json({ message: 'Only admin can create housekeeper, Please login to get this access' });
    }
    const { name, pin } = req.body;
    const newHousekeeper = await User.create({
        name,
        pin,
        role: 'housekeeper',
        createdBy: admin._id,
        login_status: 'no permission'  
    })
    res.status(201).json({
        success: true,
        message: 'Housekeeper created successfully',
        data: newHousekeeper
    })
}

const createadmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. เช็คว่า email นี้มีอยู่แล้วในระบบไหม
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    // 3. สร้าง user ใหม่ในฐานข้อมูล
    const newUser = await User.create({
      email,
      password, // เข้ารหัส password
      role: 'admin',
      login_status: 'offline'
    });

    // 4. สร้าง token, refreshtoken หลังสมัครเสร็จ
    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
    const refreshtoken = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
    });

    res.cookie("refreshtoken", refreshtoken, { // จนกว่าจะปิด browser cookie จึงจะหมดอายุ
      httpOnly: true,
      secure: false,  // เปลี่ยนเป็น true ถ้าใช้ HTTPS
      sameSite: 'lax', // ป้องกัน CSRF
      path: '/account/refresh-token', // จำกัด route ที่ใช้ cookie ได้
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        refreshtoken, //เดี๋ยวมาลบ*********
        user: newUser,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// ถ้ากด fn. อื่นจะมา refresh token ให้ใหม่ก่อน เเล้วค่อยไปใช้งาน
const refreshadmintoken = async (req, res) => {
  const refreshToken = req.cookies.refreshtoken;
  jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => { // ตรวจสอบ token ว่ายังไม่หมดอายุ
  if (err) {
    return res.status(401).json({ error: 'Invalid refresh token', err: err.message });
  }
    const userId = decoded.userId;
    // รับ userid
    const newAccessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
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
  });
};

const signout = async (req, res) => {
  const user = req.user; // จาก authorize middleware
  // if (user.role !== 'admin') {
  //   return res.status(403).json({ message: 'Only admin can sign out' });
  // }
  // หาใน db ก่อนว่า user นี้มีอยู่จริงไหม
  user.login_status = 'offline';
  await user.save();
  res.clearCookie("refreshtoken", { path: '/account/refresh-token' }); // ลบ cookie refresh token
  res.json({ success: true, message: 'User signed out successfully' });
}

module.exports = { Auth, Createhousekeeper, createadmin, refreshadmintoken, signout };