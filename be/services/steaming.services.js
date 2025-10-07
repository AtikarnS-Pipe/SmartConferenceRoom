const User = require('../models/User')
const Logsmonitoring = require('../models/Logsmonitoring');
const Bookingkey = require('../models/bookingkey');

async function GetAdminListFromDB(res){
    try {
        const Admin = await User.find({role: "Admin"})
        .select('email name role login_status updatedAt');
        // console.log("data:", Admin)
        res.write(`event: adminList\ndata: ${JSON.stringify(Admin)}\n\n`);
        return Admin;
    } catch (error) {
        console.error("Error query admin data from DB:", error);
        throw new Error('Failed to Get admin data');
    }
}

async function GetHousekeeperFromDB(res){
    try {
        const Housekeeper = await User.find({role: "Housekeeper"})
        .select('name role pin');
        // console.log("data:", Housekeeper)
        res.write(`event: HousekeeperList\ndata: ${JSON.stringify(Housekeeper)}\n\n`);
        return Housekeeper;
    } catch (error) {
        console.error("Error query Housekeeper data from DB:", error);
        throw new Error('Failed to Get Housekeeper data');
    }
}

async function LogsFromDB(res) {
    try {
      const combined_Logs = await Logsmonitoring.aggregate([
        // === A) Logsmonitoring → normalize เป็น pattern เดียวกัน ===
        { $match: { role: { $in: ["Admin", "Housekeeper"] } } },
        {
          $project: {
            _id: 1,
            eventId: 1,
            status: "$L_status",              // ใช้สถานะเดิมจาก log admin/housekeeper
            timestamp: "$L_createdAt",        // map เป็น timestamp กลาง
            role: "$role",                    // "Admin"/"Housekeeper"
            detail: "$Details",               // เปลี่ยนชื่อเป็น detail
            user_Id: "$user_Id",              // คงไว้ตามเดิม (ถ้ามี)
            source: { $literal: "Logsmonitoring" },
            updatedAt: "$L_createdAt",        // ใช้สำหรับ sort รวม
          }
        },
  
        // === B) Bookingkey → Access logs (User access room) ===
        {
          $unionWith: {
            coll: "Event", // ชื่อ collection จริงของ Bookingkey model
            pipeline: [
              { $match: { isPinVerified: "true" } },
              {
                $project: {
                  _id: 1,
                  eventId: 1,
                  status: { $literal: "Access room" },
                  // ใช้ updatedAt เป็นเวลา access (เพราะ verify สำเร็จ → updatedAt เปลี่ยน)
                  timestamp: "$updatedAt",
                  role: { $literal: "User" },
                  // detail: "User accessed Room <room> (<start>-<end>)"
                  detail: {
                    $concat: [
                      "User accessed Room ",
                      { $toString: "$room" },
                      " (",
                      {
                        $dateToString: {
                          format: "%Y-%m-%d %H:%M:%S",
                          date: { $add: ["$startDateTime", 7 * 60 * 60 * 1000] }
                        }
                      },
                      " - ",
                      {
                        $dateToString: {
                          format: "%Y-%m-%d %H:%M:%S",
                          date: { $add: ["$endDateTime", 7 * 60 * 60 * 1000] }
                        }
                      },
                      ")"
                    ]
                  },
                  user_Id: null, // ตามที่ซีนต้องการ “ว่างไว้”
                  source: { $literal: "Bookingkey" },
                  updatedAt: "$updatedAt" // ให้ sort ได้
                }
              }
            ]
          }
        },
  
        // === C) Bookingkey → End logs (User end meeting) ===
        {
          $unionWith: {
            coll: "Event",
            pipeline: [
              { $match: { isended: true } },
              {
                $project: {
                  _id: 1,
                  eventId: 1,
                  status: { $literal: "End meeting" },
                  // ใช้ endmeetingAt เป็นเวลา end
                  timestamp: "$endmeetingAt",
                  role: { $literal: "User" },
                  // detail: "User ended meeting in Room <room> (<start>-<end>)"
                  detail: {
                    $concat: [
                      "User ended meeting in Room ",
                      { $toString: "$room" },
                      " (",
                      {
                        $dateToString: {
                          format: "%Y-%m-%d %H:%M:%S",
                          date: { $add: ["$startDateTime", 7 * 60 * 60 * 1000] }
                        }
                      },
                      " - ",
                      {
                        $dateToString: {
                          format: "%Y-%m-%d %H:%M:%S",
                          date: { $add: ["$endmeetingAt", 7 * 60 * 60 * 1000] }
                        }
                      },
                      ")"
                    ]
                  },
                  user_Id: null, // ว่างไว้
                  source: { $literal: "Bookingkey" },
                  // กัน null sort หลุด: ถ้า endmeetingAt เป็น null ให้ fallback เป็น updatedAt
                  updatedAt: { $ifNull: ["$endmeetingAt", "$updatedAt"] }
                }
              }
            ]
          }
        },
  
        // === D) รวมแล้วเรียงล่าสุด → เก่าสุด ===
        { $sort: { updatedAt: -1 } },

      ]);
  
      res.write(`event: Logsmonitoring\ndata: ${JSON.stringify(combined_Logs)}\n\n`);
      return combined_Logs;
    } catch (error) {
      console.error("Error query Logs dashboard admin data from DB:", error);
      throw new Error("Failed to Get Logs data");
    }
  }

module.exports = {
    GetAdminListFromDB,
    GetHousekeeperFromDB,
    LogsFromDB
}