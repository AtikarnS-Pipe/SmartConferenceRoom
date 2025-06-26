// accounts.controllers.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const Auth = async (req, res) => {
    const { email, password } = req.body;
    try{
        const user = await User.findOne({ email });
        if(!user) return res.status(404).json({error: "Invalid credentials"});

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) return res.status(400).json({error: "Invalid credentials"});

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token })
    } catch (error) {
        res.status(500).json({error: error.message});

    }
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
    });

    // 4. สร้าง token, refreshtoken หลังสมัครเสร็จ
    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user :newUser,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
module.exports = { Auth };