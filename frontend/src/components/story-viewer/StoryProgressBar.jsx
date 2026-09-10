import React from 'react';

export const StoryProgressBar = ({
  count,
  currentIndex,
  progress
}) => {
  return (
    <div
      style={{
        display: 'flex',
        gap: '4px',
        width: '100%',
        padding: '12px 14px',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 20,
      }}
    >
      {Array.from({ length: count }).map((_, idx) => {
        let barFill = '0%';
        if (idx < currentIndex) {
          barFill = '100%';
        } else if (idx === currentIndex) {
          barFill = `${progress}%`;
        }

        return (
          <div
            key={idx}
            style={{
              flex: 1,
              height: '2.5px',
              backgroundColor: 'rgba(255, 255, 255, 0.35)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: barFill,
                height: '100%',
                backgroundColor: '#ffffff',
                transition: idx === currentIndex ? 'width 0.1s linear' : 'none',
              }}
            />
          </div>
        );
      })}
    </div>
  );
};
