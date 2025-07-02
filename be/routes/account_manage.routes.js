<<<<<<< HEAD
const { Auth,
    Createhousekeeper,
    createadmin,
    refreshadmintoken,
    signout,
    ChangeAdminPW,
    deletehousekeeper,
    editpinhousekeeper
 } = require('../controllers/account.controllers');
=======
const { Auth, Createhousekeeper, createadmin, refreshadmintoken, signout, sendEmailOTP, verifyEmailOTP, resetEmailPassword } = require('../controllers/account.controllers');
>>>>>>> d9701b01c7b592f1af8192aa0a3a8b1703b97066
const { authorize } = require('../middlewares/auth.middleware')
const express = require("express");
const AccountRouter = express.Router();

<<<<<<< HEAD
Accountrouter.post('/createadmin', createadmin);
Accountrouter.post('/auth', Auth);
Accountrouter.post('/changeadminpw', authorize, ChangeAdminPW);
Accountrouter.post('/createhousekeeper', authorize, Createhousekeeper);
Accountrouter.post('/edithousekeeper', authorize, editpinhousekeeper);
Accountrouter.post('/deletehousekeeper', authorize, deletehousekeeper);
Accountrouter.post('/refreshtoken', refreshadmintoken);
Accountrouter.post('/signout', authorize, signout);
=======
AccountRouter.post('/createadmin', createadmin);
AccountRouter.post('/auth', Auth);
AccountRouter.post('/createhousekeeper', authorize, Createhousekeeper);
AccountRouter.post('/refreshtoken', refreshadmintoken);
AccountRouter.post('/otp/send', sendEmailOTP);
AccountRouter.post('/otp/verify', verifyEmailOTP);
AccountRouter.post('/otp/reset', resetEmailPassword);
// Accountrouter.post('/signout', authorize, signout);
>>>>>>> d9701b01c7b592f1af8192aa0a3a8b1703b97066

module.exports = AccountRouter;
