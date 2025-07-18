const express = require("express");
const { getuser, keyPins, adminKeyPin, createroom, deleteroom, endmeeting, closedoor, searchpinByeventId } = require("../controllers/users.controllers");
const Userrouter = express.Router();

Userrouter.get("/sse/:floors/:rooms", getuser);
Userrouter.post("/key", keyPins);
Userrouter.post("/admin-key", adminKeyPin);
Userrouter.post("/search-pin", searchpinByeventId);
Userrouter.patch("/endmeeting", endmeeting); 
Userrouter.post('/closedoor', closedoor)

Userrouter.delete('/ms/delete', deleteroom);
Userrouter.post('/ms/create', createroom);
module.exports = Userrouter;
