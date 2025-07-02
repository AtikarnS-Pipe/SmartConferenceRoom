const { Auth,
    Createhousekeeper,
    createadmin,
    refreshadmintoken,
    signout,
    ChangeAdminPW,
    deletehousekeeper,
    editpinhousekeeper,
    sendEmailOTP,
    verifyEmailOTP,
    resetEmailPassword
 } = require('../controllers/account.controllers');

const { authorize } = require('../middlewares/auth.middleware')
const express = require("express");
const AccountRouter = express.Router();

AccountRouter.post('/createadmin', createadmin);
AccountRouter.post('/auth', Auth);
AccountRouter.post('/changeadminpw', authorize, ChangeAdminPW);
AccountRouter.post('/createhousekeeper', authorize, Createhousekeeper);
AccountRouter.post('/edithousekeeper', authorize, editpinhousekeeper);
AccountRouter.post('/deletehousekeeper', authorize, deletehousekeeper);
AccountRouter.post('/refreshtoken', refreshadmintoken);
AccountRouter.post('/signout', authorize, signout);
AccountRouter.post('/otp/send', sendEmailOTP);
AccountRouter.post('/otp/verify', verifyEmailOTP);
AccountRouter.post('/otp/reset', resetEmailPassword);

module.exports = AccountRouter;
