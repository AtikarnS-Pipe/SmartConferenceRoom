import React from 'react';

function ZoomControls({ zoomLevel, setZoomLevel }) {
  
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(0.5, prev - 0.5));
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(4, prev + 0.5));
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
      <button
        style={{
          backgroundColor: '#E5E7EB',
          color: '#374151',
          border: '1px solid #D1D5DB',
          padding: '4px 8px',
          borderRadius: '6px',
          fontSize: '18px',
          marginRight: '6px',
          cursor: 'pointer'
        }}
        onClick={handleZoomOut}
      >
        − Zoom Out
      </button>      <button
        style={{
          backgroundColor: '#E5E7EB',
          color: '#374151',
          border: '1px solid #D1D5DB',
          padding: '4px 8px',
          borderRadius: '6px',
          fontSize: '18px',
          marginRight: '6px',
          cursor: 'pointer'
        }}
        onClick={handleZoomIn}
      >
        + Zoom In
      </button>
    </div>
  );
}

export default ZoomControls;
