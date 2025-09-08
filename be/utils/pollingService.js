// pollingService.js
let intervalMs = 6000; // default = 6s
let timer = null;

function getInterval() {
  return intervalMs;
}

function setIntervalMs(ms, resetAfter = null) {
  intervalMs = ms;
  console.log(`Polling interval set to ${ms}ms`);

  // ถ้าอยาก auto-reset
  if (resetAfter) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      intervalMs = 6000;
    }, resetAfter);
  }
} 

module.exports = {
  getInterval,
  setIntervalMs,
};
