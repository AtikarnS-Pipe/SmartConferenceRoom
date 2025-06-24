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

module.exports = { Auth };