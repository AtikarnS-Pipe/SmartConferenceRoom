const express = require("express");
const { getuser, keyPins, keyExpired } = require("../controllers/users.controllers");
const Userrouter = express.Router();

Userrouter.get("/sse/:floors/:rooms", getuser);
Userrouter.post("/key", keyPins);
Userrouter.delete("/key", keyExpired);

module.exports = Userrouter;
