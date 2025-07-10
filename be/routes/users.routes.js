const express = require("express");
const { getuser, keyPins, keyExpired, adminKeyPin, createroom, deleteroom, endmeeting } = require("../controllers/users.controllers");
const Userrouter = express.Router();

Userrouter.get("/sse/:floors/:rooms", getuser);
Userrouter.post("/key", keyPins);
Userrouter.post("/admin-key", adminKeyPin); 
// Userrouter.delete("/key", keyExpired);
Userrouter.patch("/endmeeting", endmeeting); 

Userrouter.delete('/ms/delete', deleteroom );
Userrouter.post('/ms/create', createroom );
module.exports = Userrouter;
