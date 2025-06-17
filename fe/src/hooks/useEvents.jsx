import { useState, useEffect } from 'react';

export function useEvents(floor, room) {
  const [events, setEvents] = useState([]);
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

        // ✅ ตรวจว่าข้อมูลมาครบหรือไม่
        if (!data || !data.results || !Array.isArray(data.results)) {
          console.warn("Data not in expected format", data);
          setLoading(true); // ยังโหลดอยู่ เพราะข้อมูลไม่ถูกต้อง
          setEvents([]);
          return;
        }

        // ✅ ถ้าไม่มี event (array ว่าง) ก็ถือว่ายังโหลดอยู่
        if (data.results.length === 0) {
          setLoading(true); // ยังรอข้อมูล
          setEvents([]);
          return;
        }

        // ✅ ถ้าข้อมูลถูกต้องและมีผลลัพธ์
        setEvents(data.results);
        setLoading(false);
      } catch (err) {
        console.error("Error parsing SSE data:", err);
        setLoading(true);
      }
    };

    eventSource.onerror = (e) => {
      console.error("SSE error:", e);
      setLoading(true); // มี error ก็ยังถือว่ายังโหลดอยู่
    };

    return () => {
      eventSource.close();
    };
  }, [floor, room]);

  return { events, loading };
}
