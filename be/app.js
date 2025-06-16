require('dotenv').config({ path: './config/.env'});
const {connectToDatabase} = require("./database/mongodb");
const express = require("express");
const Adminrouter = require("./routes/admin.routes");
const Userrouter = require("./routes/users.routes");
// const Pinrouter = require("./routes/pins.routes");
const { GetScheduleData } = require("./services/adminsocket.services");
const cors = require('cors');
const session = require('express-session');
const http = require("http");
const { Server } = require("socket.io"); // มี auto-Fallback เเละลด http api ที่ต้องป้องกัน ลดการ post,get อีกทั้ง (Low-latency) Server “push” ข้อมูลได้ทันที ไม่ต้องรอให้ลูกค้า “poll” ทุก ๆ X วินาที
const cookie = require("cookie");
const cookieParser = require('cookie-parser');
const app = express();
const server = http.createServer(app); //ให้ Socket.IO สามารถใช้งานบนพอร์ตเดียวกันกับ Express ได้
const io = new Server(server, {  cors: {
    origin: [process.env.FRONTEND_ADMIN, process.env.FRONTEND_USERS], // ***********************
    credentials: true
  } }); 
const jwt = require('jsonwebtoken');
const { authProvider } = require("./AuthProvider");

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

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { 
    httpOnly: true, 
    secure: false , 
    // sameSite: "none", เปิดคู่ secure ถ้าจะใช้ none 
    maxAge: 1000 * 60 * 60 } // 3 hours
}));

app.use(express.json()); // เเปลง http body เป็น json
app.use(cookieParser());

io.on("connection", (socket) => { //socket เป็นตัวเเทนเเต่ละการเชื่อมต่อ รอรับ event จาก client
  console.log("User connected:", socket.id);

  socket.on("get_schedule", async (data) => {
    console.log("get_schedule => ", data);
    const { Room, startdate, enddate } = data;
    const start = `${startdate.slice(4)}-${startdate.slice(2,4)}-${startdate.slice(0,2)}`;
    const end = `${enddate.slice(4)}-${enddate.slice(2,4)}-${enddate.slice(0,2)}`;
    try {
      const cookies = socket.request.headers.cookie? cookie.parse(socket.request.headers.cookie): {};
      console.log("cookies ScedulePage\n:", cookies);
      const Token = cookies.user_token
      const payload = jwt.verify(Token, JWT_SECRET);
      const account = await authProvider.getAccountById(payload.homeAccountId);
      if (!account) {
          throw new Error("Session expired, please ask admin to login again");
      }
      let tokenResponse = await authProvider.acquireTokenSilent(
          account,
          [process.env.SCOPE]
      ); 
      let results = await GetScheduleData(tokenResponse, Room, start, end);
      socket.emit("receive_api", results);

      setInterval(async () => {
        results = await GetScheduleData(tokenResponse, Room, start, end);
        socket.emit("receive_api", results);
      }, 10000);
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
// app.use("/pins", Pinrouter);

app.get('/', (req, res) => {
  res.send('Welcome to the Smart Display Conference System!');
});

server.listen(process.env.PORT, async () => {
  console.log(`Server running at http://backend:${process.env.PORT}`);
  await connectToDatabase();
});

