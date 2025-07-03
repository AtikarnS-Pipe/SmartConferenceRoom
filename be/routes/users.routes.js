const express = require("express");
const { getuser, keyPins, keyExpired, adminKeyPin } = require("../controllers/users.controllers");
const Userrouter = express.Router();

Userrouter.get("/sse/:floors/:rooms", getuser);
Userrouter.post("/key", keyPins);
Userrouter.delete("/key", keyExpired);
Userrouter.post("/admin-key", adminKeyPin); 

module.exports = Userrouter;
