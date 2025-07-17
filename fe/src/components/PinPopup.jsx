import React, { useState, useEffect } from 'react';
import {DoorClosedLocked,DoorOpen,ShieldUser} from 'lucide-react'

const PinPopup = ({ onSubmit, error, waiting, title = 'Enter PIN Code', showIcon = true, showStaffIcon = false, onClose }) => {
  const [pin, setPin] = useState('');
  const [blink, setBlink] = useState(false);
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (pin.length === 4 && !waiting) {
      onSubmit(pin);
      setPin('');
    }
  }, [pin, waiting]);

// Reset countdown when component mounts
  useEffect(() => {
    setCountdown(30);
  }, []);

  // Auto-close timer with countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (onClose) onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Reset countdown on user interaction
  const resetCountdown = () => {
    setCountdown(30);
  };

  useEffect(() => {
    if (typeof error === 'string' && error !== 'Correct password' && error.trim() !== '') {
      setBlink(true);
      const timer = setTimeout(() => setBlink(false), 500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handlePress = (num) => {
    resetCountdown();
    if (pin.length < 4) setPin(pin + num);
  };

  const handleBackspace = () => {
    resetCountdown();
    setPin(pin.slice(0, -1));
  };

  const handleClear = () => {
    resetCountdown();
    setPin('');
  };

  const renderDots = () => (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      gap: '1.5rem',
      marginBottom: '2rem',
    }}>
      {[0, 1, 2, 3].map(i => (
        <div key={i} style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: pin.length > i ? '#1D4ED8' : '#D1D5DB',
          transition: 'background-color 0.2s ease'
        }} />
      ))}
    </div>
  );

  const keypad = [1, 2, 3, 4, 5, 6, 7, 8, 9, 'Clr', 0, '←'];

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem',
    }}>
      <div style={{
        background: '#fff',
        padding: '2rem',
        borderRadius: '1.5rem',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
        textAlign: 'center',
      }}>
        <h2 style={{
          fontSize: '1.75rem',
          marginBottom: '1.5rem',
          fontWeight: 600,
          color: '#111827',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          {title} {countdown > 0 && `(${countdown}s)`}
          {showStaffIcon && <ShieldUser size={30} color="#000000" />}
          {showIcon && (error === 'Correct password' ? <DoorOpen size={30} color="#000000" /> : <DoorClosedLocked size={30} color="#000000" />)}
        </h2>

        {renderDots()}

        {waiting && (
          <div style={{
            fontSize: '1rem',
            color: '#555',
            marginBottom: '1rem'
          }}>
            Checking...
          </div>
        )}

        {error && (
          <div
            style={{
              color: error === 'Correct password' ? '#10B981' : '#EF4444',
              fontSize: '20px',
              fontWeight: 500,
              marginBottom: '1.25rem',
              animation: blink ? 'blink 0.5s ease-in-out 2' : 'none',
            }}
          >
            {error}
            <style>{`
              @keyframes blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0; }
              }
            `}</style>
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1.5rem',
          justifyItems: 'center',
        }}>
          {keypad.map((key, idx) => (
            <button
              key={idx}
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                backgroundColor: '#F3F4F6',
                border: 'none',
                fontSize: '1.75rem',
                fontWeight: 500,
                color: '#111827',
                cursor: key !== '' && !waiting ? 'pointer' : 'default',
                opacity: key === '' || waiting ? 0.4 : 1,
                transition: 'all 0.2s ease-in-out'
              }}
              onClick={() => {
                if (waiting || key === '') return;
                if (key === '←') handleBackspace();
                else if (key === 'Clr') handleClear();
                else handlePress(key);
              }}
              disabled={key === '' || waiting}
            >
              {key}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PinPopup;
