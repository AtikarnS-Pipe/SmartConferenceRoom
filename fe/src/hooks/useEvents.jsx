import { useState, useEffect } from 'react';

export function useEvents(floor, room) {
  const [events, setEvents] = useState([]);
  console.log (events)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ถ้าไม่ได้รับ floor หรือ room ไม่ต้องโหลด
    if (!floor || !room) {
      setLoading(true);
      setEvents([]);
      return;
    }

    const eventSource = new EventSource(`/user/sse/${floor}/${room}`);

    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);

        // ✅ ถ้าข้อมูลถูกต้องและมีผลลัพธ์
        setEvents(data.results);
        setLoading(false);
      } catch (err) {
        console.error("Error parsing SSE data:", err);
        setLoading(true);//ต้องเป็น true
      }
    };

    eventSource.onerror = (e) => {
      console.error("SSE error:", e);
      setLoading(true); // มี error ก็ยังถือว่ายังโหลดอยู่ //ต้องเป็น true
    };

    return () => {
      eventSource.close();
    };
  }, [floor, room]);

  return { events, loading };
}
