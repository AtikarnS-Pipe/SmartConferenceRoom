const { getAllusers, Login, getschedule } = require("../controllers/admin.controllers");
const express = require("express");
const Adminrouter = express.Router();

Adminrouter.get('/sse', getAllusers);
Adminrouter.get('/login', Login);
Adminrouter.get('/schedule/:Room/:startdate/:enddate', getschedule);

module.exports = Adminrouter;
