import React, { useState, useEffect } from 'react';

const PinPopup = ({ onSubmit, error, waiting }) => {
  const [pin, setPin] = useState('');
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    if (pin.length === 4 && !waiting) {
      onSubmit(pin);
      setPin('');
    }
  }, [pin, waiting]);

  // Trigger blink when error is 'incorrect password'
  useEffect(() => {
    if (typeof error === 'string' && error.toLowerCase() === 'incorrect password') {
      setBlink(true);
      const timer = setTimeout(() => setBlink(false), 500); // 0.5s blink
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handlePress = (num) => {
    if (pin.length < 4) {
      setPin(pin + num);
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

//จุด pin ที่กรอก
  const renderDots = () => {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', gap: '0.5rem' }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: pin.length > i ? '#2563EB' : '#e0e0e0'
          }} />
        ))}
      </div>
    );
  };

  const keypadNumbers = [1,2,3,4,5,6,7,8,9,'',0,'←'];

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '1rem',
        textAlign: 'center',
        width: '300px'
      }}>
        <h3 style={{ marginBottom: '1rem' }}>Unlock Door with Pin Code</h3>
        {renderDots()}
        {waiting && (
          <div style={{ color: '#333', marginBottom: '1rem' }}>Checking...</div>
        )}
        {error && (
          <div
            style={{
              color: error === 'Correct' ? 'green' : 'red',
              marginBottom: '1rem',
              animation: blink ? 'blink-animation 0.5s linear 2' : 'none',
            }}
          >
            {error}
            <style>
              {`@keyframes blink-animation {
                0% { opacity: 1; }
                25% { opacity: 0; }
                50% { opacity: 1; }
                75% { opacity: 0; }
                100% { opacity: 1; }
              }`}
            </style>
          </div>
        )}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          justifyItems: 'center',
          marginBottom: '1.5rem'
        }}>
          {keypadNumbers.map((key, index) => (
            <button
              key={index}
              style={{
                width: '60px',
                height: '60px',
                fontSize: '1.5rem',
                borderRadius: '30px',
                border: '1px solid #ccc',
                backgroundColor: '#f9f9f9',
                cursor: key !== '' && !waiting ? 'pointer' : 'default',
                opacity: waiting ? 0.5 : 1
              }}
              onClick={() => {
                if (waiting) return;
                if (key === '←') handleBackspace();
                else if (key !== '') handlePress(key);
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
