const { Auth, Createhousekeeper, createadmin, refreshadmintoken, signout } = require('../controllers/account.controllers');
const { authorize } = require('../middlewares/auth.middleware')
const express = require("express");
const Accountrouter = express.Router();

Accountrouter.post('/createadmin', createadmin);
Accountrouter.post('/auth', Auth);
Accountrouter.post('/createhousekeeper', authorize, Createhousekeeper);
Accountrouter.post('/refreshtoken', refreshadmintoken);
// Accountrouter.post('/signout', authorize, signout);

module.exports = Accountrouter;
