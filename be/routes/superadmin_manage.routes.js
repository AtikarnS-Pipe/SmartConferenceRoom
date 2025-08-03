// conf_backend/be/routes/superadmin_manage.routes.js
const { createadmin, deleteadmin } = require('../controllers/accounts/SPadmin.controllers')

const { authorize } = require('../middlewares/auth.middleware')
const express = require("express");
const SuperAdminRouter = express.Router();

SuperAdminRouter.post('/createadmin', authorize, createadmin);
SuperAdminRouter.delete('/deleteadmin', authorize, deleteadmin);

module.exports = SuperAdminRouter;