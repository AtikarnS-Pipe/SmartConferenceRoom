const express = require("express");
const { getuser } = require("../controllers/users.controllers");
const Userrouter = express.Router();

Userrouter.get("/sse/:floors/:rooms", getuser);

module.exports = Userrouter;
