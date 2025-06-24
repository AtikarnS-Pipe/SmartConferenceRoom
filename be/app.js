require('dotenv').config({ path: './config/.env'});
const syncAllRooms = require('./services/roomsync.services');
const {connectToDatabase} = require("./database/mongodb");
const express = require("express");
const Adminrouter = require("./routes/admin_ms.routes");
const Userrouter = require("./routes/users.routes");
const Accountrouter = require("./routes/account_manage.routes");
const { GetScheduleData } = require("./services/adminsocket.services");
const cors = require('cors');
const http = require("http");
const { Server } = require("socket.io"); // มี auto-Fallback เเละลด http api ที่ต้องป้องกัน ลดการ post,get อีกทั้ง (Low-latency) Server “push” ข้อมูลได้ทันที ไม่ต้องรอให้ลูกค้า “poll” ทุก ๆ X วินาที
const tokenCache = require("./utils/tokenCache")
const {decryptToken} = require('./utils/encode')
const app = express();
const server = http.createServer(app); //ให้ Socket.IO สามารถใช้งานบนพอร์ตเดียวกันกับ Express ได้
const io = new Server(server, {  cors: {
    origin: [process.env.FRONTEND_ADMIN, process.env.FRONTEND_USERS], // ***********************
    credentials: true
  } }); 
const { getTokenByCode, refreshAccessToken } = require("./AuthProvider");

const JWT_SECRET = process.env.JWT_SECRET;
const allowedOrigins = [process.env.FRONTEND_ADMIN, process.env.FRONTEND_USERS];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET'],
  credentials: true
}));

app.use(express.json()); // เเปลง http body เป็น json


io.on("connection", (socket) => { //socket เป็นตัวเเทนเเต่ละการเชื่อมต่อ รอรับ event จาก client
  console.log("User connected:", socket.id);
  const intervalMap = new Map();

  socket.on("get_schedule", async (data) => {
    console.log("get_schedule => ", data);
    const { Room, startdate, enddate } = data;
    const start = `${startdate.slice(4)}-${startdate.slice(2,4)}-${startdate.slice(0,2)}`;
    const end = `${enddate.slice(4)}-${enddate.slice(2,4)}-${enddate.slice(0,2)}`;

    if (intervalMap.has(socket.id)) { // Reduce memory leak
      clearInterval(intervalMap.get(socket.id)); // clear the previous interval if exists
    }

    try {
      await tokenCache.isTokenExpired();
      let results = await GetScheduleData(decryptToken(tokenCache.getAccessToken()), Room, start, end);
      socket.emit("receive_api", results);
      const intervalId = setInterval(async () => {
        await tokenCache.isTokenExpired();
        results = await GetScheduleData(decryptToken(tokenCache.getAccessToken()), Room, start, end);
        socket.emit("receive_api", results);
      }, 15000);

      intervalMap.set(socket.id, intervalId);  // Store the interval ID for this socket connection
    } catch (err) {
      console.log("error:", err);
      socket.emit("receive_api", []);
      return;
    }

});

  socket.on("revoke_token", () => { // ฟังข้อมูลที่ client ส่งมา1
    io.emit("token_revoked");
  });
});

app.set("io", io); // เพื่อให้เรียก req.app.get("io") ได้ทุกที่ใน Express

app.use("/admin", Adminrouter);
app.use("/user", Userrouter);
app.use("/account", Accountrouter);

app.get('/', (req, res) => {
  res.send('Welcome to the Smart Display Conference System!');
});

// Sync all rooms every 10 seconds
syncAllRooms();
const sintervalId = setInterval(() => {
  syncAllRooms();
}, 10000); 

server.listen(process.env.PORT, async () => {
  console.log(`Server running at http://backend:${process.env.PORT}`);
  await connectToDatabase();
});
