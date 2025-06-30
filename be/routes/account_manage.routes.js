const { Auth, Createhousekeeper, createadmin, refreshadmintoken, signout, sendEmailOTP, verifyEmailOTP, resetEmailPassword } = require('../controllers/account.controllers');
const { authorize } = require('../middlewares/auth.middleware')
const express = require("express");
const AccountRouter = express.Router();

AccountRouter.post('/createadmin', createadmin);
AccountRouter.post('/auth', Auth);
AccountRouter.post('/createhousekeeper', authorize, Createhousekeeper);
AccountRouter.post('/refreshtoken', refreshadmintoken);
AccountRouter.post('/otp/send', sendEmailOTP);
AccountRouter.post('/otp/verify', verifyEmailOTP);
AccountRouter.post('/otp/reset', resetEmailPassword);
// Accountrouter.post('/signout', authorize, signout);

module.exports = AccountRouter;
