const User = require('../../models/User');
const {AddLogmonitoring} = require('../../utils/AddLogmonitoring');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const { GetDateTimeTH } = require('../../utils/getTodaydatetime');

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

    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS));
    const hashpassword = await bcrypt.hash(password, salt);
    const newAdmin = await User.create({
      email,
      password: hashpassword, // เข้ารหัส password
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
      L_createdAt: await GetDateTimeTH(),
    };
    const log = await AddLogmonitoring(datalogs);

    res.status(201).json({
      success: true,
      message: 'Create Admin successfully',
      data: {
        user: newAdmin,
      },
    });
    console.log(`Create Admin successfully: ${newAdmin._id}`);
  } catch (error) {
    console.error("Create Admin error:", error);
    res.status(500).json({ error: error.message });
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
      L_createdAt: await GetDateTimeTH(),
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