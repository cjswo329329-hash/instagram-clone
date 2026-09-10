import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { Modal } from '../common/Modal';

export const HighlightViewerModal = ({ isOpen, onClose, highlight }) => {
  if (!highlight) return null;

  // Mock slides for the highlight
  const slides = highlight.slides || [
    {
      id: 1,
      mediaUrl: highlight.coverUrl,
      timeAgo: '1일 전',
    },
    {
      id: 2,
      mediaUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80',
      timeAgo: '3일 전',
    },
    {
      id: 3,
      mediaUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
      timeAgo: '1주 전',
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    setCurrentIndex(0);
    setProgress(0);
    setIsPaused(false);
  }, [highlight]);

  useEffect(() => {
    if (!isOpen || isPaused) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentIndex < slides.length - 1) {
            setCurrentIndex((idx) => idx + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + 2; // ~5 seconds per slide
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, isPaused, currentIndex, slides.length, onClose]);

  const handlePrev = (e) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex((idx) => idx - 1);
      setProgress(0);
    }
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (currentIndex < slides.length - 1) {
      setCurrentIndex((idx) => idx + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const currentSlide = slides[currentIndex];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="420px"
      width="95%"
      showCloseButton={false}
      style={{ backgroundColor: 'transparent', boxShadow: 'none' }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '9 / 16',
          maxHeight: '85vh',
          backgroundColor: '#000000',
          borderRadius: '16px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 12px 48px rgba(0,0,0,0.6)',
        }}
        onClick={() => setIsPaused(!isPaused)}
      >
        {/* Top Progress Bars */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            right: '12px',
            display: 'flex',
            gap: '4px',
            zIndex: 10,
          }}
        >
          {slides.map((_, idx) => {
            let width = '0%';
            if (idx < currentIndex) width = '100%';
            else if (idx === currentIndex) width = `${progress}%`;

            return (
              <div
                key={idx}
                style={{
                  flex: 1,
                  height: '3px',
                  backgroundColor: 'rgba(255, 255, 255, 0.35)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width,
                    backgroundColor: '#ffffff',
                    transition: idx === currentIndex ? 'width 0.1s linear' : 'none',
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Top Header: Highlight Title and Close Button */}
        <div
          style={{
            position: 'absolute',
            top: '24px',
            left: '12px',
            right: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 10,
            color: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img
              src={highlight.coverUrl}
              alt={highlight.title}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '1.5px solid #ffffff',
              }}
            />
            <span style={{ fontSize: '14px', fontWeight: 600, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
              {highlight.title}
            </span>
            <span style={{ fontSize: '12px', opacity: 0.8 }}>
              {currentSlide?.timeAgo || '1일 전'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isPaused && (
              <span
                style={{
                  fontSize: '11px',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                일시 정지
              </span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              style={{
                color: '#ffffff',
                cursor: 'pointer',
                padding: '4px',
                filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))',
              }}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Main Media */}
        <img
          src={currentSlide?.mediaUrl}
          alt="Highlight slide"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            userSelect: 'none',
          }}
        />

        {/* Prev / Next Click Zones */}
        <div
          onClick={handlePrev}
          style={{
            position: 'absolute',
            top: '60px',
            left: 0,
            width: '30%',
            bottom: '40px',
            cursor: currentIndex > 0 ? 'pointer' : 'default',
            zIndex: 5,
          }}
        />
        <div
          onClick={handleNext}
          style={{
            position: 'absolute',
            top: '60px',
            right: 0,
            width: '30%',
            bottom: '40px',
            cursor: 'pointer',
            zIndex: 5,
          }}
        />

        {/* Navigation Arrows */}
        {currentIndex > 0 && (
          <button
            onClick={handlePrev}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#ffffff',
              backgroundColor: 'rgba(0,0,0,0.3)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10,
            }}
          >
            <ChevronLeft size={24} />
          </button>
        )}

        <button
          onClick={handleNext}
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#ffffff',
            backgroundColor: 'rgba(0,0,0,0.3)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
          }}
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </Modal>
  );
};
