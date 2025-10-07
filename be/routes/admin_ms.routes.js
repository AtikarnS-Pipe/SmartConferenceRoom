const { getAllusers, Login, getschedule, deleteeventbyadmin } = require("../controllers/admin.controllers");
const express = require("express");
const Adminrouter = express.Router();

Adminrouter.get('/sse', getAllusers);
Adminrouter.get('/login', Login);
Adminrouter.delete('/delete', deleteeventbyadmin);
Adminrouter.get('/schedule/:Room/:startdate/:enddate', getschedule);

module.exports = Adminrouter;
