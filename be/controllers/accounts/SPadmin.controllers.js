const User = require('../../models/User');
const {AddLogmonitoring} = require('../../utils/AddLogmonitoring');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const createadmin = async (req, res) => {
  const SuperAdmin = req.user;
  const { email, password, name, pin } = req.body;
  if (SuperAdmin.role !== 'Superadmin') return res.status(403).json({ message: 'Only SuperAdmin can create admin' });
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
    const newAdmin = await User.create({
      email,
      password, // เข้ารหัส password
      role: 'Admin',
      login_status: 'offline'
    });

    // logsmonitoring function
    const datalogs = {  
      user_Id: newAdmin._id, 
      L_status: 'Admin was created', 
      role: newAdmin.role, 
      Details: `Admin id: ${newAdmin._id}`, 
      L_createdAt: new Date(),
    };
    const log = await AddLogmonitoring(datalogs);
  
    const token = jwt.sign({ userId: newAdmin._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
    const refreshtoken = jwt.sign({ userId: newAdmin._id }, process.env.JWT_SECRET, {
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
      message: 'Create Admin successfully',
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

const deleteadmin = async (req, res) => {
    try {
        const SuperAdmin = req.user;
        const { name } = req.body;
        if (SuperAdmin.role !== 'Superadmin') return res.status(403).json({ message: 'Only SuperAdmin can delete admin' });
        if (!name) return res.status(400).json({ message: `Admin's Name are required` });
        // const isAdminpw = await bcrypt.compare(password, adminDB.password)
        const ThisAdmin = await User.findOneAndUpdate(
            { name, role: 'Admin'},
            { role: 'Deactivate' }, // not use, log in db     
            { new: true } 
        );
        if (!ThisAdmin) return res.status(404).json({ message: 'Admin is not found in Documents' });

        // logsmonitoring function
        const datalogs = {  
          user_Id: ThisAdmin._id, 
          L_status: 'Admin was deleted', 
          role: 'Admin', 
          Details: `Admin name: ${name}`, 
          L_createdAt: new Date(),
        };
        const log = await AddLogmonitoring(datalogs);
        res.status(200).json({ success: true, message: `Admin's name ${name}, has been deleted successfully` });
    } catch (error) {
        console.error("Delete Admin error:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = {
    createadmin, deleteadmin
}