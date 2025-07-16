const { Auth,
    Createhousekeeper,
    signout,
    ChangeAdminPin,
    deletehousekeeper,
    editpinhousekeeper,
    sendEmailOTP,
    verifyEmailOTP,
    resetEmailPassword,
    profile
 } = require('../controllers/accounts/account.controllers');
const { refreshadmintoken } = require('../utils/refreshalltoken');
const { AdminListSchedule, HousekeeperListSchedule, LogsListSchedule } = require('../controllers/accounts/steamdata.controllers')
const { authorize } = require('../middlewares/auth.middleware')
const express = require("express");
const AccountRouter = express.Router();

AccountRouter.post('/createadmin', authorize, createadmin);
AccountRouter.get('/me', authorize, profile);
AccountRouter.post('/auth', Auth);
AccountRouter.patch('/changeadminpw', authorize, ChangeAdminPin);
AccountRouter.post('/createhousekeeper', authorize, Createhousekeeper);
AccountRouter.patch('/edithousekeeper', authorize, editpinhousekeeper);
AccountRouter.delete('/deletehousekeeper', authorize, deletehousekeeper);
AccountRouter.post('/refreshtoken', refreshadmintoken);
AccountRouter.post('/signout', authorize, signout);
AccountRouter.post('/otp/send', sendEmailOTP);
AccountRouter.post('/otp/verify', verifyEmailOTP);
AccountRouter.post('/otp/reset', resetEmailPassword);

// Steaming API with SSE
AccountRouter.get('/member', AdminListSchedule);
AccountRouter.get('/housekeepers', HousekeeperListSchedule);
AccountRouter.get('/logsmonitoring', LogsListSchedule);


module.exports = AccountRouter;
