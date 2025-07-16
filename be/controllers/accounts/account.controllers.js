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
      const user = await User.findOne({ email, role: 'Admin' });
      if(!user){
        console.log("[Login] User not found:", email);
        return res.status(404).json({error: "User not found"});
      } 
      const isMatch = await bcrypt.compare(password, user.password);
      if(!isMatch){
        console.log("Invalid credentials");
        return res.status(400).json({error: "Invalid credentials"});
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

      res.json({token, name: user.name, pin: user.pin, role: user.role})
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
    if (admin.role !== 'admin') return res.status(403).json({ message: 'Only admin can change password' });
    if (!newpin) return res.status(400).json({ message: 'Passwords are required!' });

    const checkpin = await User.findOne({ 
      role: { $ne: 'Deactivated'}, _id: { $ne: admin._id}, pin: newpin,   
    });
    if (checkpin){
      return res.status(400).json({ message: 'This PIN already exists, please choose another.' });
    }

    // existingUser.pin = await bcrypt.hash(newpin, parseInt(process.env.BCRYPT_SALT_ROUNDS));
    if(admin.pin.toString() === newpin.toString()) {
      return res.status(400).json({ message: 'New PIN must not be the same as the old PIN.' });
    }
    admin.pin = newpin;
    await admin.save();
    res.json({ success: true, NewPin: admin.pin, message: `${admin.email} Pin changed successfully` });
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
    const checkpin = await User.findOne({  // ถ้ามี name or pin สักอันที่ตรง
      role: { $ne: 'Deactivated' },
      $or : [
        { pin }, {name}
      ]
     });
    if (checkpin) {
      const duplicatefield = [];
       let message = 'No duplicate';
      if (checkpin.pin === pin) duplicatefield.push('pin');
      if (checkpin.name === name) duplicatefield.push('name'); 
      duplicatefield.length === 1 ? message = `This ${duplicatefield[0]} is exists, Please use a different one.` : message;
      duplicatefield.length > 1 ? message = `These ${duplicatefield.join('and')} are exists, Please use a different one.`  : message;
      return res.status(400).json({ message });
    }

    const newHousekeeper = await User.create({
        name,
        pin,
        role: 'Housekeeper',
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
  if (user.role !== 'admin') {
    if(process.env.DEBUG_MODE) console.log("Only admin can sign out");
    return res.status(403).json({ message: 'Only admin can sign out' });
  }
  user.login_status = 'offline';
  await user.save();
  // logsmonitoring create
  const logs = await Logsmonitoring.create({
    user_Id: user._id, 
    L_status: 'Admin Logged out', 
    role: user.role, 
    Details: `Admin name: ${user.name}`, 
    L_createdAt: new Date(),
  })
  res.clearCookie("refreshtoken", { path: '/account/refresh-token' }); // ลบ cookie refresh token
  res.json({ success: true, message: 'User signed out successfully' });
}

const createadmin = async (req, res) => {
  const SuperAdmin = req.user;
  const { email, password, name, pin } = req.body;
  if (SuperAdmin.role !== 'SuperAdmin') return res.status(403).json({ message: 'Only SuperAdmin can create admin' });
  try {
    const existingAdmin = await User.findOne({
      role: { $ne: 'Deactivated' },
      $or: [
        {email}, {pin}, {name}
      ] 
    });
    if (existingAdmin) {
      const duplicatefield = [];
      let message = 'No duplicate';
      if (existingAdmin.pin === pin) duplicatefield.push('pin');
      if (existingAdmin.name === name) duplicatefield.push('name'); 
      if (existingAdmin.email === email) duplicatefield.push('email');
      duplicatefield.length === 1 ? message = `This ${duplicatefield[0]} is exists, Please use a different one.` : message;
      duplicatefield.length > 1 ? message = `These ${duplicatefield.join('and')} are exists, Please use a different one.`  : message;
      return res.status(400).json({ message });
    }
    const newUser = await User.create({
      email,
      password, // เข้ารหัส password
      role: 'Admin',
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
    const { name } = req.body;
    if (admin.role !== 'admin') return res.status(403).json({ message: 'Only admin can delete housekeeper' });
    if (!name) return res.status(400).json({ message: 'Housekeeper ์s Name are required' });
    // const isAdminpw = await bcrypt.compare(password, adminDB.password)
    const ThisHousekeeper = await User.findOneAndUpdate(
      { name, role: 'Housekeeper'},
      { role: 'Deactivate' }, // not use, log in db     
      { new: true } 
    );
    if (!ThisHousekeeper) return res.status(404).json({ message: 'Housekeeper is not found in Documents' });

    // logsmonitoring create
    const logs = await Logsmonitoring.create({
      user_Id: ThisHousekeeper._id, 
      L_status: 'Housekeeper was deleted', 
      role: 'Housekeeper', 
      Details: `Housekeeper name: ${name}`, 
      L_createdAt: new Date(),
    })
    res.status(200).json({ success: true, message: `Housekeeper's name ${name}, has been deleted successfully` });
  } catch (error) {
    console.error("Delete housekeeper error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// รับ name เเม่บ้าน, newpassword  ที่จะเปลี่ยนมาเพื่อ เเก้ไข pin
const editpinhousekeeper = async (req, res) => {
  try{
    const admin = req.user;
    const { name, newpin } = req.body;
    if (admin.role !== 'admin') return res.status(403).json({ message: 'Only admin can edit pin housekeeper.' });
    if (!name || !newpin) return res.status(400).json({ message: 'Name and Password are required' });
    
    const ThisHousekeeper = await User.findOneAndUpdate(
      { name, role: 'Housekeeper' },
      { $set: { pin: newpin } },
      { new: true } // เพื่อคืนข้อมูลที่ update
    );
    if (!ThisHousekeeper) {
      return res.status(404).json({ message: 'Housekeeper is not found in Documents' });
    }

    // logsmonitoring create
    const logs = await Logsmonitoring.create({
      user_Id: ThisHousekeeper._id, 
      L_status: 'Housekeeper was changed pin', 
      role: ThisHousekeeper.role, 
      Details: `Housekeeper name: ${name}`, 
      L_createdAt: new Date(),
    })
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

const profile = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'admin') {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      name: user.name,
      email: user.email,
      role: user.role,
    })
  }catch (error) {
    console.error("Profile error:", error);
    return res.status(500).json({ error: 'Internal server error' });
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
  resetEmailPassword,
  profile
};