import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { HeartAnimation } from '../common/HeartAnimation';
import { useDoubleClick } from '../../hooks/useDoubleClick';

export const MediaCarousel = ({
  media = [],
  onDoubleTap,
  onImageClick,
  aspectRatio = '1 / 1',
  fillContainer = false,
  style = {}
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showHeart, setShowHeart] = useState(false);

  const handleDoubleClick = () => {
    setShowHeart(true);
    if (onDoubleTap) onDoubleTap();
    setTimeout(() => {
      setShowHeart(false);
    }, 900);
  };

  const handleSingleClick = (e) => {
    if (onImageClick) onImageClick(e);
  };

  const handleClick = useDoubleClick(handleSingleClick, handleDoubleClick);

  if (!media || media.length === 0) return null;

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : prev));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev < media.length - 1 ? prev + 1 : prev));
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: fillContainer ? '100%' : undefined,
        aspectRatio: fillContainer ? undefined : aspectRatio,
        backgroundColor: '#000000',
        overflow: 'hidden',
        userSelect: 'none',
        cursor: onImageClick ? 'pointer' : 'default',
        ...style,
      }}
      onClick={handleClick}
    >
      {/* Floating Heart on Double Tap */}
      <HeartAnimation show={showHeart} />

      {/* Image Slider Container */}
      <div
        style={{
          display: 'flex',
          width: `${media.length * 100}%`,
          height: '100%',
          transform: `translateX(-${(currentIndex * 100) / media.length}%)`,
          transition: 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        {media.map((item, idx) => (
          <div
            key={item.id || idx}
            style={{
              width: `${100 / media.length}%`,
              height: '100%',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#050505',
            }}
          >
            <img
              src={item.mediaUrl}
              alt="Post content"
              style={{
                width: '100%',
                height: '100%',
                objectFit: fillContainer ? 'contain' : 'cover',
              }}
              loading="lazy"
            />
          </div>
        ))}
      </div>

      {/* Left Navigation Arrow */}
      {currentIndex > 0 && (
        <button
          onClick={handlePrev}
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            color: '#111111',
            borderRadius: '50%',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            zIndex: 10,
          }}
          aria-label="Previous slide"
        >
          <ChevronLeft size={20} />
        </button>
      )}

      {/* Right Navigation Arrow */}
      {currentIndex < media.length - 1 && (
        <button
          onClick={handleNext}
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            color: '#111111',
            borderRadius: '50%',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            zIndex: 10,
          }}
          aria-label="Next slide"
        >
          <ChevronRight size={20} />
        </button>
      )}

      {/* Dots Indicator */}
      {media.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        >
          {media.map((_, idx) => (
            <div
              key={idx}
              style={{
                width: currentIndex === idx ? '6px' : '5px',
                height: currentIndex === idx ? '6px' : '5px',
                borderRadius: '50%',
                backgroundColor: currentIndex === idx ? '#0095f6' : 'rgba(255, 255, 255, 0.65)',
                transition: 'all 0.2s ease',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
