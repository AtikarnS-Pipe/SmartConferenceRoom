// mqttLogger.js
const { getClient } = require("./SendMQTT");
const Log_Device_Status = require("../../models/Log_Device_Status");

const TIMEOUT = 20000; // 20 วินาที
const lastUpdate = {}; // เก็บเวลา message ล่าสุดของแต่ละ topic
const hasSeenData = {};
const lastValue = {};
const currentState = {};

// mapping topic → rooms
const SUB_TOPIC_RSSI = process.env.MQTT_TOPIC_RSSI; 

const TOPICS = {
  [`${SUB_TOPIC_RSSI}15>1-2`]: [1501, 1502],
  [`${SUB_TOPIC_RSSI}15>5-6`]: [1505, 1506],
  [`${SUB_TOPIC_RSSI}15>14-15`]: [1514, 1515],
};

function initLogger() {
    const client = getClient();

    // subscribe ทุก topic
    Object.keys(TOPICS).forEach((topic) => client.subscribe(topic));

    client.on("message", async (topic, message) => {
        if (!TOPICS[topic]) return;

        const now = Date.now();
        let value = null;

        try {
            const data = JSON.parse(message.toString());

            if (typeof data === "number") {
                value = data;
            } else if (typeof data === "object" && data.rssi !== undefined) {
                value = Number(data.rssi);
            } else if (!isNaN(Number(data))) {
                value = Number(data);
            }
        } catch (err) {
            console.error("Parse error:", err.message);
            return;
        }

        // ✅ ถ้ามีค่าจริงเข้ามา → เปลี่ยน state เป็น online
        if (topic && value !== null) {
            lastUpdate[topic] = now;
            hasSeenData[topic] = true;
            lastValue[topic] = value;

            if (currentState[topic] !== "online") {
                currentState[topic] = "online";

                for (const room of TOPICS[topic]) {
                    try {
                        await Log_Device_Status.create({
                            Device_room: room,
                            Device_status: "online",
                            Device_date: new Date(),
                        });
                    } catch (err) {
                        console.error("Error saving device:", err);
                    }
                }
            }
            return;
        }
    });

    // ✅ Loop เช็ค timeout → offline
    setInterval(async () => {
        const now = Date.now();

        for (const topic of Object.keys(TOPICS)) {
            if (hasSeenData[topic] && now - (lastUpdate[topic] || 0) > TIMEOUT) {
                if (currentState[topic] !== "offline") {
                    currentState[topic] = "offline";

                    for (const room of TOPICS[topic]) {
                        try{
                        await Log_Device_Status.create({
                        Device_room: room,
                        Device_status: "offline",
                        Device_date: new Date(),
                        });
                        }catch(err){
                            console.error("Error saving device:", err);
                        } 
                    }
                    console.log(`💾 OFFLINE: ${TOPICS[topic].join(", ")}`);
                }
            }
        }
    }, 5000);
}

module.exports = { initLogger };