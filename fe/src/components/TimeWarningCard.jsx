import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const TimeWarningCard = ({ currentEvent, getTimeRemaining }) => {
  const [showCard, setShowCard] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const [isSlideUp, setIsSlideUp] = useState(false);

  useEffect(() => {
    if (!currentEvent) {
      setShowCard(false);
      setHasShown(false);
      return;
    }

    const checkTimeRemaining = () => {
      const now = new Date();
      const end = new Date(currentEvent.end.dateTime + 'Z');
      const diffMs = end - now;
      const remainingMinutes = Math.floor(diffMs / (1000 * 60));
      const remainingSeconds = Math.floor(diffMs / 1000);

      // Show card when 10 minutes remaining and hasn't been shown yet
      if (remainingMinutes < 10 && remainingSeconds > 0 && !hasShown) {
        setShowCard(true);
        setHasShown(true);
        setIsSlideUp(false);
      } else if (remainingSeconds <= 0) {
        // Trigger slide up animation when event ends
        setIsSlideUp(true);
        
        // Hide card after slide up animation completes (500ms)
        setTimeout(() => {
          setShowCard(false);
          setHasShown(false);
          setIsSlideUp(false);
        }, 500);
      }
    };

    checkTimeRemaining();
    const interval = setInterval(checkTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [currentEvent, hasShown]);

  // Reset hasShown when event changes
  useEffect(() => {
    setHasShown(false);
  }, [currentEvent?.id]);

  if (!showCard || !currentEvent) return null;

  return (
    <div className="time-warning-overlay">
      <div className={`time-warning-card ${isSlideUp ? 'slide-up' : ''}`}>
        <div className="time-warning-icon">
          <Clock size={24} />
        </div>
        <div className="time-warning-content">
          <h3 className="time-warning-title">Meeting Ending Soon</h3>
          <p className="time-warning-subject">{currentEvent.subject}</p>
          <p className="time-warning-time">
            Time Remaining: <span className="time-warning-countdown">{getTimeRemaining(currentEvent)}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TimeWarningCard;
