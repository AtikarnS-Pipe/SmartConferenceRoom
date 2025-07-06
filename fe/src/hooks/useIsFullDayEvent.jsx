// ใช้ในหลาย components เพื่อเช็คว่า event เป็น full day (24 ชั่วโมง) หรือไม่
export function useIsFullDayEvent() {
  return function isFullDayEvent(event) {
    if (!event?.start?.dateTime || !event?.end?.dateTime) return false;
    const startDate = new Date(event.start.dateTime + 'Z');
    const endDate = new Date(event.end.dateTime + 'Z');
    const durationHours = (endDate - startDate) / (1000 * 60 * 60);
    return durationHours >= 24; //ถ้ามากกว่า 24 ชั่วโมงเป็น คืน true
  };
} 