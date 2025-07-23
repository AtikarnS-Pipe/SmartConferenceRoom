import React from 'react';

function ZoomControls({ zoomLevel, setZoomLevel }) {
  
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(0.5, prev - 0.5));
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(4, prev + 0.5));
  };

  return (
  <>
    <button
      className="zoom-btn zoom-out"
      onClick={handleZoomOut}
      style={{ marginRight: '8px' }}
    >
      <span className="zoom-icon">−</span>
      <span className="zoom-label">Zoom Out</span>
    </button>
    <button
      className="zoom-btn zoom-in"
      onClick={handleZoomIn}
    >
      <span className="zoom-icon">+</span>
      <span className="zoom-label">Zoom In</span>
    </button>
    <style>{`
      .zoom-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: #F8FAFC;
        color: #374151;
        border: 1px solid #E2E8F0;
        padding: 6px 18px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        min-width: auto;
        box-shadow: 0 1px 4px rgba(0,0,0,0.04);
      }

      .zoom-btn:active {
        transform: scale(0.97);
      }

      .zoom-btn:hover {
        background: #E0E7EF;
        border-color: #CBD5E1;
      }

      .zoom-btn.zoom-in {
        background: #3B82F6;
        color: #fff;
        border: 1px solid #3B82F6;
      }

      .zoom-btn.zoom-in:hover {
        background: #2563EB;
        border-color: #2563EB;
      }

      .zoom-icon {
        font-size: 16px;
        font-weight: bold;
      }

      .zoom-label {
        white-space: nowrap;
      }

      @media (max-width: 768px) {
        .zoom-btn {
          font-size: 13px;
          padding: 5px 15px;
          border-radius: 7px;
          gap: 5px;
        }
        
        .zoom-icon {
          font-size: 15px;
        }
      }

      @media (max-width: 600px) {
        .zoom-btn {
          font-size: 12px;
          padding: 4px 12px;
          border-radius: 6px;
          gap: 4px;
        }
        
        .zoom-icon {
          font-size: 14px;
        }
      }

      @media (max-width: 480px) {
        .zoom-btn {
          font-size: 11px;
          padding: 3px 5px;
          border-radius: 5px;
          gap: 3px;
          min-width: 65px;
        }
        
        .zoom-icon {
          font-size: 13px;
        }
        
        .zoom-label {
          font-size: 10px;
        }
      }

      @media (max-width: 360px) {
        .zoom-btn {
          padding: 3px 8px;
          font-size: 10px;
          min-width: 55px;
        }
        
        .zoom-icon {
          font-size: 12px;
        }
        
        .zoom-label {
          font-size: 9px;
        }
      }
    `}</style>
  </>
);

}

export default ZoomControls;
