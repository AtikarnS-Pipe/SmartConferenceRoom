const { Auth,
    Createhousekeeper,
    createadmin,
    refreshadmintoken,
    signout,
    ChangeAdminPW,
    deletehousekeeper,
    editpinhousekeeper
 } = require('../controllers/account.controllers');
const { authorize } = require('../middlewares/auth.middleware')
const express = require("express");
const AccountRouter = express.Router();

Accountrouter.post('/createadmin', createadmin);
Accountrouter.post('/auth', Auth);
Accountrouter.post('/changeadminpw', authorize, ChangeAdminPW);
Accountrouter.post('/createhousekeeper', authorize, Createhousekeeper);
Accountrouter.post('/edithousekeeper', authorize, editpinhousekeeper);
Accountrouter.post('/deletehousekeeper', authorize, deletehousekeeper);
Accountrouter.post('/refreshtoken', refreshadmintoken);
Accountrouter.post('/signout', authorize, signout);

module.exports = AccountRouter;
