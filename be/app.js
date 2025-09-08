require('dotenv').config({ path: './config/.env'});
const syncAllRooms = require('./services/roomsync.services');
// เชื่อมต่อกับ MongoDB
const { connectToDatabase} = require("./database/mongodb");
const { monitorToken } = require('./utils/tokenCache');
const { seedMqttRooms } = require('./models/MqttState');
const express = require("express");
const { initMqtt } = require('./utils/SendMQTT');
// Import routes
const { DeviceState } = require('./models/Log_Device_Status');
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

// mini API: รับข้อมูลจาก Node-RED เก็บลง database
app.post('/api2/device', async (req, res) => {
  try {
    const { Device_date, Device_room, Device_status } = req.body;

    // validation แบบง่าย
    if (!Device_room || !Device_status) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const newDevice = await DeviceState.create({
      Device_date: Device_date || Date.now(),
      Device_room,
      Device_status
    });

    res.status(201).json({
      message: "Device state saved successfully",
      data: newDevice
    });
  } catch (err) {
    console.error("Error saving device:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(process.env.PORT, async () => {
  console.log(`Server running at http://localhost:${process.env.PORT}`);
  await connectToDatabase();
  await seedMqttRooms();
  await initMqtt();
});
