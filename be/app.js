require('dotenv').config({ path: './config/.env'});
const syncAllRooms = require('./services/roomsync.services');
// เชื่อมต่อกับ MongoDB
const {connectToDatabase} = require("./database/mongodb");
const { monitorToken } = require('./utils/tokenCache');
const { seedMqttRooms } = require('./models/MqttState');
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

app.use(cors({
  origin: [process.env.FRONTEND_ADMIN, process.env.FRONTEND_USERS], // ***********************
  credentials: true
}));

app.use(express.json()); // เเปลง http body เป็น json
app.use(cookieParser()); 

monitorToken(); // เริ่ม monitor token loop

app.use("/api1/admin", Adminrouter);
app.use("/api2/user", Userrouter);
app.use("/api1/account", Accountrouter);
app.use("/api1/superadmin", SuperAdminRouter)

app.get('/', (req, res) => {
  res.send('Welcome to the Smart Display Conference System!');
});

// Sync all rooms for mail sending every 10 s
const sintervalId = setInterval(() => {
  syncAllRooms();
}, 8000);

app.listen(process.env.PORT, async () => {
  console.log(`Server running at http://localhost:${process.env.PORT}`);
  await connectToDatabase();
  await seedMqttRooms();
});
