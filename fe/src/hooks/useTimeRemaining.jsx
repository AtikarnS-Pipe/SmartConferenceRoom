
export function parseDateTime(dateTimeStr) {
    // ถ้ายังไม่มี Z หรือ offset ใด ๆ เลย ให้เติม 'Z' หมายถึง UTC
    if (!dateTimeStr.endsWith("Z") && !/[+-]\d{2}:\d{2}$/.test(dateTimeStr)) {
      dateTimeStr += "Z";
    }
    return new Date(dateTimeStr);
  }
  
  export function getTimeRemaining(event) {
    const now = new Date();
    const end = parseDateTime(event.end.dateTime);
  
    const diffMs = end - now;
  
    if (diffMs <= 0) {
      return "Event ended";
    }
  
    const seconds = Math.floor(diffMs / 1000) % 60;
    const minutes = Math.floor(diffMs / (1000 * 60)) % 60;
    const hours = Math.floor(diffMs / (1000 * 60 * 60)) % 24;
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
    let result = "";
  
    if (days > 0) result += `${days}d `;
    if (hours > 0 || days > 0) result += `${hours}h `;
    if (minutes > 0 || hours > 0 || days > 0) result += `${minutes}m `;
    result += `${seconds}s`;
  
    return result.trim();
  }
  