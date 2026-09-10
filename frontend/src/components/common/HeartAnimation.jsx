import React from 'react';
import { Heart } from 'lucide-react';

export const HeartAnimation = ({ show }) => {
  if (!show) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        pointerEvents: 'none',
        zIndex: 50,
      }}
      className="heart-burst-animate"
    >
      <Heart
        size={100}
        fill="#ffffff"
        color="#ffffff"
        style={{
          filter: 'drop-shadow(0 0 16px rgba(0,0,0,0.5))',
        }}
      />
    </div>
  );
};
