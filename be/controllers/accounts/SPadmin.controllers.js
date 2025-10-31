const User = require('../../models/User');
const {AddLogmonitoring} = require('../../utils/AddLogmonitoring');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const GetDateTimeTH = require('../../utils/getTodaydatetime');
require('dotenv').config();
// const { GetTimeAPI } = require('../../utils/getTodaydatetime');

const createadmin = async (req, res) => {
  const SuperAdmin = req.user;
  const { email, password, name, pin } = req.body;

  if (SuperAdmin.role !== 'Superadmin') {
    return res.status(403).json({ message: 'Only SuperAdmin can create admin' });
  }

  try {
    // ตรวจสอบว่ามี account ที่ active (ไม่ใช่ Deactivate) และใช้ข้อมูลซ้ำกัน
    const existingActiveAdmin = await User.findOne({
      role: { $ne: 'Deactivate' },
      $or: [{ email }, { pin }, { name }]
    });

    if (existingActiveAdmin) {
      const duplicatefield = [];
      let message = 'No duplicate';

      if (existingActiveAdmin.pin === pin) duplicatefield.push('pin');
      if (existingActiveAdmin.name === name) duplicatefield.push('name');
      if (existingActiveAdmin.email === email) duplicatefield.push('email');

      if (duplicatefield.length === 1) {
        message = `This ${duplicatefield[0]} is already in use by an active account. Please use a different one.`;
      } else if (duplicatefield.length > 1) {
        message = `These ${duplicatefield.join(' and ')} are already in use by an active account. Please use different values.`;
      }

      return res.status(400).json({ message });
    }

    // ตรวจสอบว่ามี account ที่ Deactivate และใช้ข้อมูลซ้ำกัน
    const existingDeactivatedAdmin = await User.findOne({
      role: 'Deactivate',
      $or: [{ email }, { pin }, { name }]
    });

    // ถ้ามี account ที่ Deactivate ให้ลบออกก่อนสร้างใหม่
    if (existingDeactivatedAdmin) {
      await User.deleteOne({ _id: existingDeactivatedAdmin._id });
      
      // เพิ่ม log การลบ account เก่า
      const deleteLogData = {
        user_Id: existingDeactivatedAdmin._id,
        L_status: 'Admin was deleted',
        role: 'Admin',
        Details: `Admin name: ${existingDeactivatedAdmin.name}`,
        L_createdAt: new Date(),
      };
      await AddLogmonitoring(deleteLogData);
    }

    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS));
    const hashpassword = await bcrypt.hash(password, salt);

    const newAdmin = await User.create({
      email,
      password: hashpassword,
      role: 'Admin',
      login_status: 'offline',
      name,
      pin
    });

    // logsmonitoring function
    const datalogs = {  
      user_Id: newAdmin._id, 
      L_status: 'Admin was created', 
      role: newAdmin.role, 
      Details: `Admin name: ${newAdmin.name}`, 
      L_createdAt: new Date(), //await GetTimeAPI('Asia/Bangkok'),
    };
    const log = await AddLogmonitoring(datalogs);
  
    // const token = jwt.sign({ userId: newAdmin._id }, process.env.JWT_SECRET, {
    //   expiresIn: process.env.JWT_EXPIRES_IN,
    // });
    // const refreshtoken = jwt.sign({ userId: newAdmin._id }, process.env.JWT_SECRET, {
    //   expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
    // });

    // res.cookie("refreshtoken", refreshtoken, { // จนกว่าจะปิด browser cookie จึงจะหมดอายุ
    //   httpOnly: true,
    //   secure: false,  // เปลี่ยนเป็น true ถ้าใช้ HTTPS
    //   sameSite: 'lax', // ป้องกัน CSRF
    //   path: '/account/refreshtoken', // จำกัด route ที่ใช้ cookie ได้
    // });

    res.status(201).json({
      success: true,
      message: 'Create Admin successfully',
      data: {
        user: newAdmin,
      },
    });

  } catch (error) {
    console.error("Create Admin error:", error);
    res.status(500).json({ message: error.message });
  }
};

const deleteadmin = async (req, res) => {
  try {
    const SuperAdmin = req.user;
    const { id } = req.body;
    console.log("Delete Admin request body:", req.body);

    if (SuperAdmin.role !== 'Superadmin') {
      return res.status(403).json({ message: 'Only SuperAdmin can delete admin' });
    }

    if (!id) {
      return res.status(400).json({ message: "Admin's ID is required" });
    }

    const ThisAdmin = await User.findOneAndUpdate(
      { _id: id, role: 'Admin' },
      { role: 'Deactivate' }, // not use, log in db
      { new: true }
    );

    if (!ThisAdmin) {
      return res.status(404).json({ message: 'Admin is not found in Documents' });
    }

    // logsmonitoring function
    const datalogs = {
      user_Id: ThisAdmin._id,
      L_status: 'Admin was deleted',
      role: 'Admin',
      Details: `Admin name: ${ThisAdmin.name}`,
      L_createdAt: new Date(), //await GetTimeAPI('Asia/Bangkok'),
    };

    const log = await AddLogmonitoring(datalogs);

    res.status(200).json({
      success: true,
      message: `Admin's ID ${id} has been deleted successfully`,
    });
  } catch (error) {
    console.error("Delete Admin error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


module.exports = {
    createadmin, deleteadmin
}