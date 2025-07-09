import { useState, useEffect } from 'react';

export function useEvents(floor, room) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  console.log("Events updated:", events);
}, [events]);


  useEffect(() => {
  if (!floor || !room) {
    setLoading(true);
    setEvents([]);
    return;
  }

  const eventSource = new EventSource(`/user/sse/${floor}/${room}`);

  const fallbackTimeout = setTimeout(() => {
    console.warn("SSE fallback timeout: no data received.");
    setEvents([]);
    setLoading(false); // หรือให้เป็น Available state
  }, 10000); // รอ 10 วิ ถ้าไม่มีข้อมูล

  eventSource.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      const safeResults = Array.isArray(data.results) ? data.results : [];
      setEvents(safeResults);
      setLoading(false);
      clearTimeout(fallbackTimeout); // ถ้าได้ข้อมูล เคลียร์ timeout ทันที
    } catch (err) {
      console.error("Error parsing SSE data:", err);
      setEvents([]);
      setLoading(true);
    }
  };

  eventSource.onerror = (e) => {
    console.error("SSE error:", e);
    setEvents([]);
    setLoading(true);
  };

  return () => {
    eventSource.close();
    clearTimeout(fallbackTimeout); // cleanup ป้องกัน memory leak
  };
}, [floor, room]);

  return { events, loading };
}
