// accounts.controllers.js
require('dotenv').config({ path: '../../config/.env' });
const bcrypt = require('bcryptjs');
const { refreshalltoken } = require('../../utils/refreshalltoken');
const { sendOTP, verifyOTP, resetPassword } = require('../../services/admin.services');
//models
const User = require('../../models/User');
const { AddLogmonitoring } = require('../../utils/AddLogmonitoring');
// const { GetTimeAPI } = require('../../utils/getTodaydatetime');

const Auth = async (req, res) => { // admin sign-in
    console.log(`${req.ip} ${req.method} ${req.originalUrl}`)
    const { email, password } = req.body;
    if(process.env.DEBUG_MODE) console.log("ready to auth", email, password);
    try{
      const user = await User.findOne({ email, role: { $in: ['Admin', 'Superadmin'] } });
      console.log("user find in Auth!");
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

      // logsmonitoring function
      const datalogs = {  
        user_Id: user._id, 
        L_status: 'Admin Logged in', 
        role: user.role, 
        Details: `Admin name: ${user.name}`, 
        L_createdAt: new Date() //await GetTimeAPI('Asia/Bangkok'),
      };
      const log = await AddLogmonitoring(datalogs);

      res.json({token, name: user.name, pin: user.pin, role: user.role})
    } catch (error) {
      console.error("Authentication error:", error);
      res.status(500).json({ error: 'Internal server error' });
    }
}

// รับ newpw จาก body //ไม่ส่ง oldpw มาละ
const ChangeAdminPin = async (req, res) => {
  try {
    const admin = req.user;
    const { newpin } = req.body;

    if (admin.role !== 'Admin' && admin.role !== 'Superadmin') {
      return res.status(403).json({ field: 'pin', message: 'Only admin can change password' });
    }

    if (!newpin) {
      return res.status(400).json({ field: 'pin', message: 'PIN is required' });
    }

    const checkpin = await User.findOne({
      role: { $ne: 'Deactivated' },
      _id: { $ne: admin._id },
      pin: newpin,
    });

    if (checkpin) {
      return res.status(400).json({ field: 'pin', message: 'This PIN already exists, please choose another.' });
    }

    if (admin.pin.toString() === newpin.toString()) {
      return res.status(400).json({ field: 'pin', message: 'New PIN must not be the same as the old PIN.' });
    }

    admin.pin = newpin;
    await admin.save();

    res.json({ success: true, NewPin: admin.pin, message: 'PIN updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


const Createhousekeeper = async (req, res) => { 
    const admin = req.user; // จาก authorize middleware
    if (admin.role !== 'Admin' && admin.role !== 'Superadmin') {
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
    // logsmonitoring function
    const datalogs = {  
      user_Id: newHousekeeper._id, 
      L_status: 'Housekeeper was created', 
      role: newHousekeeper.role, 
      Details: `Housekeeper name: ${newHousekeeper.name}`, 
      L_createdAt: new Date() //await GetTimeAPI('Asia/Bangkok'),
    };
    const log = await AddLogmonitoring(datalogs);
    res.status(201).json({
        success: true,
        message: 'Housekeeper created successfully',
        data: newHousekeeper
    })
}

const signout = async (req, res) => {
  const user = req.user; // จาก authorize middleware
  if (user.role !== 'Admin' && user.role !== 'Superadmin') {
    if(process.env.DEBUG_MODE) console.log("Only admin can sign out");
    return res.status(403).json({ message: 'Only admin can sign out' });
  }
  user.login_status = 'offline';
  await user.save();
  // logsmonitoring function
  const datalogs = {  
    user_Id: user._id, 
    L_status: 'Admin Logged out', 
    role: user.role, 
    Details: `Admin name: ${user.name}`, 
    L_createdAt: new Date(), //await GetTimeAPI('Asia/Bangkok'),
  };
  const log = await AddLogmonitoring(datalogs);
  res.clearCookie("refreshtoken", { path: '/account/refreshtoken' }); // ลบ cookie refresh token
  res.json({ success: true, message: 'User signed out successfully' });
}

//ส่ง name เเม่บ้าน, password ของ admin ที่ลบมาเพื่อลบข้อมูล
const deletehousekeeper = async (req, res) => {
  try{
    const admin = req.user;
    const { id } = req.body;
    if (admin.role !== 'Admin' && admin.role !== 'Superadmin') return res.status(403).json({ message: 'Only admin can delete housekeeper' });
    if (!id) return res.status(400).json({ message: `Housekeeper ID is required` });
    // const isAdminpw = await bcrypt.compare(password, adminDB.password)
    const ThisHousekeeper = await User.findOneAndUpdate(
      { _id: id, role: 'Housekeeper'},
      { role: 'Deactivate' }, // not use, log in db     
      { new: true } 
    );
    if (!ThisHousekeeper) return res.status(404).json({ message: 'Housekeeper is not found in Documents' });

    // logsmonitoring function
    const datalogs = {  
      user_Id: ThisHousekeeper._id, 
      L_status: 'Housekeeper was deleted', 
      role: 'Housekeeper', 
      Details: `Housekeeper name: ${ThisHousekeeper.name}`, 
      L_createdAt: new Date(), //await GetTimeAPI('Asia/Bangkok'),
    };
    const log = await AddLogmonitoring(datalogs);

    res.status(200).json({ success: true, message: `Housekeeper's name ${ThisHousekeeper.name}, has been deleted successfully` });
  } catch (error) {
    console.error("Delete housekeeper error:", error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// รับ name เเม่บ้าน, newpassword  ที่จะเปลี่ยนมาเพื่อ เเก้ไข pin
const editpinhousekeeper = async (req, res) => {
  try{
    const admin = req.user;
    const { name, newpin } = req.body;
    if (admin.role !== 'Admin' && admin.role !== 'Superadmin') return res.status(403).json({ message: 'Only admin can edit pin housekeeper.' });
    if (!name || !newpin) return res.status(400).json({ message: 'ID and Pin are required' });

    // Find housekeeper and any user with same PIN in one query
    const [ThisHousekeeper, conflictUser] = await Promise.all([
      User.findOne({ name, role: 'Housekeeper' }),
      User.findOne({
        role: { $ne: 'Deactivated' },
        pin: newpin,
        name: { $ne: name } // exclude this housekeeper id
      }),
    ]);

    if (!ThisHousekeeper) return res.status(404).json({ message: 'Housekeeper not found.' });
    if (ThisHousekeeper.pin.toString() === newpin.toString()) return res.status(400).json({ message: 'This PIN is already used by this housekeeper. Please choose a different PIN.' });
    if (conflictUser) return res.status(400).json({ message: 'This PIN is already used by another user. Please choose a different one.' });

    ThisHousekeeper.pin = newpin;
    await ThisHousekeeper.save();

    // logsmonitoring function
    const datalogs = {  
      user_Id: ThisHousekeeper._id, 
      L_status: 'Housekeeper was changed pin', 
      role: ThisHousekeeper.role, 
      Details: `Housekeeper name: ${ThisHousekeeper.name}`, 
      L_createdAt: new Date(), //await GetTimeAPI('Asia/Bangkok'),
    };
    const log = await AddLogmonitoring(datalogs);

    res.status(200).json({ success: true, message: `Housekeeper's name, ${ThisHousekeeper.name}, has been updated pins with successfully` });
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
    if (user.role !== 'Admin' && user.role !== 'Superadmin') {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      name: user.name,
      email: user.email,
      role: user.role,
      pin: user.pin
    })
  }catch (error) {
    console.error("Profile error:", error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { 
  Auth,
  Createhousekeeper,
  signout, 
  ChangeAdminPin,
  deletehousekeeper,
  editpinhousekeeper,
  sendEmailOTP,
  verifyEmailOTP,
  resetEmailPassword,
  profile
};