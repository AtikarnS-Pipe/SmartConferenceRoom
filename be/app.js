// swagger doc
const setupSwagger = require('./swagger/swaggerUI');

require('dotenv').config({ path: './config/.env'});
const syncAllRooms = require('./services/roomsync.services');
// เชื่อมต่อกับ MongoDB
const { connectToDatabase} = require("./database/mongodb");
const { monitorToken } = require('./utils/tokenCache');
const { seedMqttRooms } = require('./models/MqttState');
const express = require("express");
const { initMqtt } = require('./services/mqtt/SendMQTT');
const { initLogger } = require('./services/mqtt/mqttlogger'); 

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
}, 7000);

async function startServer() {
  try {
    // 0. setup swagger
    setupSwagger(app);
    // 1. เชื่อมต่อ Database ก่อน
    await connectToDatabase();
    console.log('✅ Database connected');
    
    // 2. set ค่า default state ห้องที่มีจอ for mqtt state
    await seedMqttRooms(); 
    console.log('✅ MQTT Rooms seeded');
    
    // 3. เริ่ม MQTT connection
    if (process.env.OPEN_MQTT === "true") {
      await initMqtt(); // connect mqtt + door control (topic cmd)
      await initLogger(); // attach logger subscriber of mqtt (topic rssi)
      console.log('✅ MQTT initialized');
    }
    
    // 4. เริ่ม HTTP Server
    app.listen(process.env.PORT, () => {
      console.log(`✅ Server running on port ${process.env.PORT}`);
    });
    
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

startServer();