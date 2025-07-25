const axios = require('axios');

async function getTodaydatetime() {
    const tzOffset = 7 * 60; // Thailand UTC+7 (minutes)
    const gettime = await GetDateTimeTH();
    const now = new Date(gettime);

    console.log(`Current local time: ${now}`);
    const thYear = now.getFullYear();
    const thMonth = now.getMonth();
    const thDate = now.getDate();
    
    // lost time for 1 ms
    // Start of today in Thailand (00:00)
    const startTH = new Date(Date.UTC(thYear, thMonth, thDate, 0, 0, 0, 1) - tzOffset * 60 * 1000);
    // End of today in Thailand (23:59)
    const endTH = new Date(Date.UTC(thYear, thMonth, thDate, 23, 59, 59, 999) - tzOffset * 60 * 1000);

    const startDateTime = startTH.toISOString();
    const endDateTime = endTH.toISOString();

    // console.log("startDateTime (UTC):", startDateTime);
    // console.log("endDateTime (UTC):", endDateTime);
    return {
        startDateTime,endDateTime
        }    
}

async function GetDateTimeTH() {
    const result = await axios.get('https://timeapi.io/api/Time/current/zone?timeZone=Asia/Bangkok');
    const time2 = result.data.dateTime;
    return time2;
}

async function GetDateTimeUTC() {
    const result = await axios.get('https://timeapi.io/api/Time/current/zone?timeZone=UTC');
    const time3 = result.data.dateTime;
    // if (isNaN(time3.getTime())) console.error("❌ Invalid UTC time received:", result.data.dateTime);
    // console.log(`Current UTC : ${time3.toISOString()}`);
    return time3;
}

module.exports = {getTodaydatetime, GetDateTimeTH, GetDateTimeUTC};