const { Auth } = require('../controllers/accounts.controllers');
const express = require("express");
const Accountrouter = express.Router();

Accountrouter.post('/auth', Auth);

module.exports = Accountrouter;
