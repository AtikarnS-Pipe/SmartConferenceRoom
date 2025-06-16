import { useState, useEffect } from 'react';

export function useEvents( floor, room) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!floor || !room) {
      setLoading(true);
      return;
    }

    const eventSource = new EventSource(`/user/sse/${floor}/${room}`);
    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setEvents(data.results);
        // console.log(data.results);
        setLoading(false);
      } catch (err) {
        console.error("Error parsing SSE data:", err);
        setLoading(false);
      }
    };
    eventSource.onerror = (e) => {
      console.error("SSE error:", e);
      setLoading(false);
    };

    return () => {
      eventSource.close();
    };
  }, [floor, room]);

  return { events, loading };
}