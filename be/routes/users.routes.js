const express = require("express");
const { getuser, keyPins, adminKeyPin, createroom, deleteroom, endmeeting } = require("../controllers/users.controllers");
const Userrouter = express.Router();

Userrouter.get("/sse/:floors/:rooms", getuser);
Userrouter.post("/key", keyPins);
Userrouter.post("/admin-key", adminKeyPin); 
Userrouter.patch("/endmeeting", endmeeting); 

Userrouter.delete('/ms/delete', deleteroom );
Userrouter.post('/ms/create', createroom );
module.exports = Userrouter;
