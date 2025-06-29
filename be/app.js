require('dotenv').config({ path: './config/.env'});
const syncAllRooms = require('./services/roomsync.services');
const {connectToDatabase} = require("./database/mongodb");
const express = require("express");
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

app.listen(process.env.PORT, async () => {
  console.log(`Server running at http://localhost:${process.env.PORT}`);
  await connectToDatabase();
});
