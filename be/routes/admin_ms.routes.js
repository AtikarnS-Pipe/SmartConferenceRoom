const { getAllusers, Login } = require("../controllers/admin.controllers");
const express = require("express");
const Adminrouter = express.Router();

Adminrouter.get('/sse', getAllusers);
Adminrouter.get('/login', Login);

module.exports = Adminrouter;
