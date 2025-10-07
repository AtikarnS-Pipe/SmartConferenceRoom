// const axios = require('axios');
require('dotenv').config({ path: '../config/.env' });

let dailyCache = {
  valueTH: null,
  valueUTC: null,
  date: null, // format: YYYY-MM-DD
};

async function getTodaydatetime() {
  // HARD CODE for UTC time for Microsoft Graph API
  const tzOffset = 7 * 60; // Thailand UTC+7 (minutes)
  const gettime = new Date();  //await GetTimeAPICache('Asia/Bangkok');
  const now = new Date(gettime);

  const thYear = now.getFullYear();
  const thMonth = now.getMonth();
  const thDate = now.getDate();
  const thHour = now.getHours();
  // console.log(`${now.toISOString()} Today's in Thailand: ${thYear}-${thMonth + 1}-${thDate} Hour: ${thHour}`);

  // lost time for 1 ms
  // Start of today in Thailand (00:00)
  let startTH = new Date(Date.UTC(thYear, thMonth, thDate, 0, 0, 0, 1) - tzOffset * 60 * 1000);
  // End of today in Thailand (23:59)
  let endTH = new Date(Date.UTC(thYear, thMonth, thDate, 23, 59, 59, 999) - tzOffset * 60 * 1000);

  // ถ้ายังไม่ถึง 07:00 ไทย จะขยับวันเป็นปัจจุบัน
  // if (thHour < 7) {
  //     startTH = new Date(startTH.getTime() + 24 * 60 * 60 * 1000);
  //     endTH = new Date(endTH.getTime() + 24 * 60 * 60 * 1000);
  // }

  const startDateTime = startTH.toISOString();
  const endDateTime = endTH.toISOString();


  return {
    startDateTime, endDateTime
  }
}


// async function GetDateTimeTH() {
//     const result = await axios.get('https://timeapi.io/api/Time/current/zone?timeZone=Asia/Bangkok');
//     const time2 = result.data.dateTime;
//     console.log(`Current TH23124122341 : ${time2}`);
//     return time2;
// }

// async function GetDateTimeUTC() {
//     const result = await axios.get('https://timeapi.io/api/Time/current/zone?timeZone=UTC');
//     const time3 = result.data.dateTime;
//     console.log(`Current UTC23124122341 : ${time3}`);
//     // if (isNaN(time3.getTime())) console.error("❌ Invalid UTC time received:", result.data.dateTime);
//     // console.log(`Current UTC : ${time3.toISOString()}`);
//     return time3;
// }



// const GetTimeAPICache = async (timezone) => { // this api's rate limit is 1000 requests per day and 1 request per second
//     const today = new Date().toISOString().slice(0, 10); // เอาวันปัจจุบันบน server มา check เคลื่อน 3 นาทีถ้า sensetime  

//     // หากยังไม่มี cache หรือเป็นของวันเก่า จะ fetch ใหม่
//     if (!dailyCache.date || !dailyCache.valueTH || !dailyCache.valueUTC || dailyCache.date !== today) {
//         try{
//             // 2025-07-26 14:00:00 th
//             const thRes = await axios.get(`https://api.timezonedb.com/v2.1/get-time-zone?key=${process.env.API_TIME_KEY}&format=json&by=zone&zone=Asia/Bangkok`);
//             const bangkokTime = new Date(`${thRes.data.formatted}+07:00`);
//             const utcTime = bangkokTime;
//             // console.log("Bangkok Time:", thRes.data.formatted , "UTC Time:", utcTime);

//             dailyCache.valueTH = thRes.data.formatted;
//             dailyCache.valueUTC = utcTime;
//             dailyCache.date = today;
//             console.log("Time data fetched TH:", dailyCache.valueTH);
//         } catch (error) {
//             console.error("Error fetching time data:", error);
//             throw new Error("Failed to fetch time data from API");
//         }

//     }
//     return timezone === "UTC" ? dailyCache.valueUTC : dailyCache.valueTH; // Date type
// }

// const GetTimeAPI = async (timezone) => { // this api's rate limit is 1000 requests per day and 1 request per second
//     let timedata;
//     const baseURL = 'https://api.timezonedb.com/v2.1/get-time-zone';

//     if (timezone === 'Asia/Bangkok') {
//         const thRes = await axios.get(`${baseURL}?key=${process.env.API_TIME_KEY}&format=json&by=zone&zone=Asia/Bangkok`);
//         const iso = thRes.data.formatted.replace(' ', 'T') + '+07:00';
//         timedata = new Date(iso);
//     } else {
//         const utcRes = await axios.get(`${baseURL}?key=${process.env.API_TIME_KEY}&format=json&by=zone&zone=UTC`);
//         const iso = utcRes.data.formatted.replace(' ', 'T') + '+00:00';
//         timedata = new Date(iso);
//     }

//     return timedata;
// }

module.exports = {
  getTodaydatetime,
  // GetDateTimeTH,
  // GetDateTimeUTC,
  // GetTimeAPICache,
  // GetTimeAPI
};