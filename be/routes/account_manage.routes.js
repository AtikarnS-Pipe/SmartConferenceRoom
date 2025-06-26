const { Auth, createadmin } = require('../controllers/accounts.controllers');
const express = require("express");
const Accountrouter = express.Router();

Accountrouter.post('/auth', Auth);
Accountrouter.post('/createadmin', createadmin);

module.exports = Accountrouter;
