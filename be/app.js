require('dotenv').config({ path: './config/.env'});
const syncAllRooms = require('./services/roomsync.services');
// เชื่อมต่อกับ MongoDB
const {connectToDatabase} = require("./database/mongodb");
const { monitorToken } = require('./utils/tokenCache');
const express = require("express");
const axios = require('axios');
// Import routes
const SuperAdminRouter = require('./routes/superadmin_manage.routes')
const Adminrouter = require("./routes/admin_ms.routes");
const Userrouter = require("./routes/users.routes");
const Accountrouter = require("./routes/account_manage.routes");
const cors = require('cors');
const cookieParser = require('cookie-parser');
const app = express();
const {GetTimeAPI } = require('./utils/getTodaydatetime');

app.use(cors({
  origin: [process.env.FRONTEND_ADMIN, process.env.FRONTEND_USERS], // ***********************
  credentials: true
}));

app.use(express.json()); // เเปลง http body เป็น json
app.use(cookieParser()); 

monitorToken(); // เริ่ม monitor token loop

app.use("/admin", Adminrouter);
app.use("/user", Userrouter);
app.use("/account", Accountrouter);
app.use("/superadmin", SuperAdminRouter)

app.get('/', (req, res) => {
  res.send('Welcome to the Smart Display Conference System!');
});

// Sync all rooms for mail sending every 10 s
const sintervalId = setInterval(() => {
  syncAllRooms();
}, 6000);

(async () => {
  const thTime = await GetTimeAPI("Asia/Bangkok");
  console.log("Thai Time:", thTime);
  console.log("Thai Time:", new Date(thTime));
  console.log("Thai Time:", new Date(thTime).toISOString());

  const utcTime = await GetTimeAPI("UTC");
  console.log("UTC Time:", utcTime);
  console.log("UTC Time:", new Date(utcTime));
  console.log("UTC Time:", new Date(utcTime).toISOString());
})();

app.listen(process.env.PORT, async () => {
  console.log(`Server running at http://localhost:${process.env.PORT}`);
  await connectToDatabase();
});
