// accounts.controllers.js
const bcrypt = require('bcryptjs');
const { refreshalltoken } = require('../../utils/refreshalltoken');
const jwt = require('jsonwebtoken');
const { sendOTP, verifyOTP, resetPassword } = require('../../services/admin.services');
//models
const User = require('../../models/User');
const Logsmonitoring = require('../../models/Logsmonitoring')

const Auth = async (req, res) => { // admin sign-in
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

      user.login_status = 'online';
      await user.save();
      // รับ userId:user._id
      const token = refreshalltoken(req, res, user._id);

      // logsmonitoring create
    const logs = await Logsmonitoring.create({
      user_Id: user._id, 
      L_status: 'Admin Logged in', 
      role: user.role, 
      Details: `Admin name: ${user.name}`, 
      L_createdAt: new Date(),
    })

      res.json({token})
    } catch (error) {
      console.error("Authentication error:", error);
      res.status(500).json({ error: 'Internal server error' });
    }
}

// รับ newpw จาก body //ไม่ส่ง oldpw มาละ
const ChangeAdminPin = async (req, res) => { // ไม่น่าต้อง logs เปลี่ยน pin ตัวเอง
  try{
    const admin = req.user;
    const {newpin} = req.body;
    if (!newpin) {
      return res.status(400).json({ message: 'Passwords are required!' });
    }
    if (admin.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can change password' });
    }
    const existingUser = await User.findById(admin._id);
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // existingUser.pin = await bcrypt.hash(newpin, parseInt(process.env.BCRYPT_SALT_ROUNDS));
    if(existingUser.pin === newpin) {
      return res.status(400).json({ message: 'Password is duplicate!' });
    }
    existingUser.pin = newpin;
    await existingUser.save();
    res.json({ success: true, NewPin: existingUser.pin, message: `${existingUser.email} Pin changed successfully` });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: 'Internal server error'});
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
    // logsmonitoring create
    const logs = await Logsmonitoring.create({
      user_Id: newHousekeeper._id, 
      L_status: 'Housekeeper was created', 
      role: newHousekeeper.role, 
      Details: `Housekeeper name: ${newHousekeeper._id}`, 
      L_createdAt: new Date(),
    })
    res.status(201).json({
        success: true,
        message: 'Housekeeper created successfully',
        data: newHousekeeper
    })
}

const signout = async (req, res) => {
  const user = req.user; // จาก authorize middleware
  const admin = User.findById(user._id);
  if (admin.role !== 'admin') {
    if(process.env.DEBUG_MODE) console.log("Only admin can sign out");
    return res.status(403).json({ message: 'Only admin can sign out' });
  }
  // หาใน db ก่อนว่า user นี้มีอยู่จริงไหม
  admin.login_status = 'offline';
  await admin.save();
  // logsmonitoring create
  const logs = await Logsmonitoring.create({
    user_Id: user._id, 
    L_status: 'Admin Logged out', 
    role: admin.role, 
    Details: `Admin name: ${admin.name}`, 
    L_createdAt: new Date(),
  })
  res.clearCookie("refreshtoken", { path: '/account/refresh-token' }); // ลบ cookie refresh token
  res.json({ success: true, message: 'User signed out successfully' });
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
    // // logsmonitoring create
    // const logs = await Logsmonitoring.create({
    //   user_Id: newHousekeeper._id, 
    //   L_status: 'Housekeeper was created', 
    //   role: newHousekeeper.role, 
    //   Details: `Housekeeper name: ${newHousekeeper._id}`, 
    //   L_createdAt: new Date(),
    // })

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


//ส่ง name เเม่บ้าน, password ของ admin ที่ลบมาเพื่อลบข้อมูล
const deletehousekeeper = async (req, res) => {
  try{
    const admin = req.user;
    if (admin.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can delete housekeeper' });
    }
    const { name, password } = req.body;
    if (!name || !password) {
      return res.status(400).json({ message: 'Name and Password are required' });
    } 
    const adminDB = await User.findById(admin._id);
    const isAdminpw = await bcrypt.compare(password, adminDB.password)
    if(!isAdminpw){
      return res.status(400).json({ message: 'Invalid admin password!' });
    }
    const ThisHousekeeper = await User.findOneAndDelete({ name, role: 'housekeeper' });
    if (!ThisHousekeeper) {
      return res.status(404).json({ message: 'Housekeeper is not found in Documents' });
    }
    // logsmonitoring create
    const logs = await Logsmonitoring.create({
      user_Id: ThisHousekeeper._id, 
      L_status: 'Housekeeper was deleted', 
      role: ThisHousekeeper.role, 
      Details: `Housekeeper name: ${name}`, 
      L_createdAt: new Date(),
    })
    res.status(200).json({ success: true, message: `Housekeeper's name, ${name}, has been deleted successfully` });
  } catch (error) {
    console.error("Delete housekeeper error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// รับ name เเม่บ้าน, newpassword  ที่จะเปลี่ยนมาเพื่อ เเก้ไข pin
const editpinhousekeeper = async (req, res) => {
  try{
    const admin = req.user;
    if (admin.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can delete housekeeper' });
    }
    const { name, newpassword } = req.body;
    if (!name || !newpassword) {
      return res.status(400).json({ message: 'Name and Password are required' });
    } 
    const adminDB = await User.findById(admin._id);
    if(!adminDB){
      return res.status(400).json({ message: 'Cannot found admin' });
    }
    const ThisHousekeeper = await User.findOneAndUpdate(
      { name, role: 'housekeeper' },
      { $set: { pin: newpassword } },
      { new: true } // เพื่อคืนข้อมูลที่ update
    );
    // logsmonitoring create
    const logs = await Logsmonitoring.create({
      user_Id: ThisHousekeeper._id, 
      L_status: 'Housekeeper was changed pin', 
      role: ThisHousekeeper.role, 
      Details: `Housekeeper name: ${name}`, 
      L_createdAt: new Date(),
    })
    if (!ThisHousekeeper) {
      return res.status(404).json({ message: 'Housekeeper is not found in Documents' });
    }
    res.status(200).json({ success: true, message: `Housekeeper's name, ${name}, has been updated pins with ${newpassword} successfully` });
  } catch (error) {
    console.error("Delete housekeeper error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// otp/send
const sendEmailOTP = async (req, res) => {
  try {
    const { email } = req.body;
    console.log(`${req.method}, ${req.originalUrl}`);
    const result = await sendOTP(email);

    if (!result.success) {
      return res.status(200).json({ message: `If the email exists in our system, an OTP has been sent.` });
    } 
    return res.status(200).json({ message: `If the email exists in our system, an OTP has been sent.` });
  } 
  catch (err) {
    console.log(`${err.message}`);
    return res.status(500).json({ message: err.message });
  }
}

// otp/verify
const verifyEmailOTP = async (req, res) => {
  try {
    const { email, otp_code } = req.body;
    console.log(`${req.method} ${req.originalUrl}`);
    const result = await verifyOTP(email, otp_code);

    if (!result.success) {
      console.log(result.message);
      return res.status(200).json({ message: `Your OTP is invalid.` });
    }
    return res.status(200).json({ message: `Your OTP has been verified. `, reset_token: result.token});
  }
  catch (err) {
    console.log(err.message);
    return res.status(500).json({ message: err.message });
  }
}

// otp/reset
const resetEmailPassword = async (req, res) => {
  try {
    const { reset_token, new_password } = req.body;
    console.log(`${req.method} ${req.originalUrl}`);
    const result = await resetPassword(reset_token, new_password);

    if(!result.success) {
      console.log(result.message);
      return res.status(200).json({ message: "Failed to change password."});
    }
    return res.status(200).json({ message: result.message });
  }
  catch (err) {
    console.log(err.message);
    return res.status(500).json({ message: err.message });
  }
}

module.exports = { 
  Auth,
  Createhousekeeper,
  createadmin, 
  signout, 
  ChangeAdminPin,
  deletehousekeeper,
  editpinhousekeeper,
  sendEmailOTP,
  verifyEmailOTP,
  resetEmailPassword
};