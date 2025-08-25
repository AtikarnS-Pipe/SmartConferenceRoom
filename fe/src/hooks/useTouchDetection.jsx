import { useEffect } from 'react';

export const useTouchDetection = ({ onTripleTouch, holdDuration = 1000 }) => {
  useEffect(() => {
    let timeout;
    const handleTouchStart = (event) => {
      if (event.touches.length === 3) {
        event.preventDefault();
        timeout = setTimeout(() => {
          onTripleTouch?.();
        }, holdDuration);
      }
    };
    const handleTouchEnd = () => clearTimeout(timeout);

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onTripleTouch, holdDuration]);
};
