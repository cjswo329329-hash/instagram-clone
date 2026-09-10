import React, { useState } from 'react';
import { Crop, ZoomIn } from 'lucide-react';

export const ImageEditor = ({
  images,
  aspectRatio,
  onChangeAspectRatio
}) => {
  const [showRatios, setShowRatios] = useState(false);

  const ratios = [
    { label: '1:1', value: '1 / 1' },
    { label: '4:5', value: '4 / 5' },
    { label: '16:9', value: '16 / 9' },
  ];

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        backgroundColor: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        minHeight: '420px',
        maxHeight: '520px',
      }}
    >
      <div
        style={{
          width: '100%',
          aspectRatio: aspectRatio,
          maxHeight: '520px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src={images[0]}
          alt="Edit preview"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </div>

      {/* Ratio Selector Button at bottom-left */}
      <div style={{ position: 'absolute', bottom: '16px', left: '16px', zIndex: 10 }}>
        {showRatios && (
          <div
            style={{
              position: 'absolute',
              bottom: '40px',
              left: 0,
              backgroundColor: 'rgba(26, 26, 26, 0.85)',
              backdropFilter: 'blur(8px)',
              borderRadius: '8px',
              padding: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            {ratios.map((r) => (
              <button
                key={r.value}
                onClick={() => {
                  onChangeAspectRatio(r.value);
                  setShowRatios(false);
                }}
                style={{
                  color: aspectRatio === r.value ? '#0095f6' : '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  padding: '6px 12px',
                  textAlign: 'left',
                  borderRadius: '4px',
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => setShowRatios(!showRatios)}
          style={{
            backgroundColor: 'rgba(26, 26, 26, 0.8)',
            color: '#ffffff',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Ratio selector"
        >
          <Crop size={18} />
        </button>
      </div>
    </div>
  );
};
