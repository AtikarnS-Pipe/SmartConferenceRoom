const express = require("express");
const { getuser, keyPins } = require("../controllers/users.controllers");
const Userrouter = express.Router();

Userrouter.get("/sse/:floors/:rooms", getuser);
Userrouter.post("/validatePin", keyPins);

module.exports = Userrouter;
