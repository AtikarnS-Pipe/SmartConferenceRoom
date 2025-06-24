const { getAllusers, Login, Auth } = require("../controllers/admin.controllers");
const express = require("express");
const Adminrouter = express.Router();

Adminrouter.get('/sse', getAllusers);
Adminrouter.get('/login', Login);
Adminrouter.post('/auth', Auth);

module.exports = Adminrouter;
