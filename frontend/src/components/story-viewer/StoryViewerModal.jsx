import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Heart, Send } from 'lucide-react';
import { StoryProgressBar } from './StoryProgressBar';
import { Avatar } from '../common/Avatar';
import { useModal } from '../../contexts/ModalContext';

export const StoryViewerModal = () => {
  const navigate = useNavigate();
  const { activeStory, closeStoryViewer } = useModal();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [hasLiked, setHasLiked] = useState(false);

  const duration = 5000; // 5 seconds per story
  const intervalTime = 50;

  useEffect(() => {
    if (activeStory) {
      setCurrentIndex(activeStory.initialIndex || 0);
      setProgress(0);
      setHasLiked(false);
    }
  }, [activeStory]);

  useEffect(() => {
    if (!activeStory || isPaused) return;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          // Advance to next story if available
          if (currentIndex < activeStory.stories.length - 1) {
            setCurrentIndex(idx => idx + 1);
            return 0;
          } else {
            closeStoryViewer();
            return 100;
          }
        }
        return prev + (intervalTime / duration) * 100;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [activeStory, currentIndex, isPaused, closeStoryViewer]);

  if (!activeStory) return null;

  const currentItem = activeStory.stories[currentIndex];

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    }
  };

  const handleNext = () => {
    if (currentIndex < activeStory.stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    } else {
      closeStoryViewer();
    }
  };

  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    alert(`'${activeStory.username}'님에게 스토리에 대한 답장을 전송했습니다: "${replyText}"`);
    setReplyText('');
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#1a1a1a',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Instagram logo top-left */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '24px',
          zIndex: 100,
        }}
      >
        <span className="brand-logo" style={{ color: '#ffffff', fontSize: '2rem' }}>
          Instagram
        </span>
      </div>

      {/* Close button top-right */}
      <button
        onClick={closeStoryViewer}
        style={{
          position: 'absolute',
          top: '20px',
          right: '24px',
          color: '#ffffff',
          zIndex: 100,
        }}
        aria-label="Close stories"
      >
        <X size={32} />
      </button>

      {/* Story Viewer Phone Shell */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '430px',
          height: '92vh',
          maxHeight: '820px',
          borderRadius: '16px',
          overflow: 'hidden',
          backgroundColor: '#000000',
          boxShadow: '0 8px 30px rgba(0,0,0,0.8)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Progress bar */}
        <StoryProgressBar
          count={activeStory.stories.length}
          currentIndex={currentIndex}
          progress={progress}
        />

        {/* Top User Header */}
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: 0,
            right: 0,
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 30,
          }}
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (activeStory.username) {
                closeStoryViewer();
                navigate(`/${activeStory.username}`);
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              transition: 'opacity 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <Avatar src={activeStory.profileImage} size="sm" />
            <span style={{ color: '#ffffff', fontSize: '14px', fontWeight: 600 }}>
              {activeStory.username}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
              {currentItem?.timeAgo || '3시간 전'}
            </span>
          </div>
        </div>

        {/* Click Areas for Navigation */}
        <div
          onClick={handlePrev}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '35%',
            height: '80%',
            zIndex: 10,
            cursor: 'pointer',
          }}
          aria-label="Previous story"
        />
        <div
          onClick={handleNext}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '65%',
            height: '80%',
            zIndex: 10,
            cursor: 'pointer',
          }}
          aria-label="Next story"
        />

        {/* Story Media Image */}
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={currentItem?.mediaUrl || currentItem?.media_url}
            alt="Story content"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Bottom Reply Bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '14px 16px',
            zIndex: 30,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
          }}
        >
          <form
            onSubmit={handleSendReply}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              borderRadius: '24px',
              padding: '8px 16px',
              backgroundColor: 'rgba(0,0,0,0.3)',
            }}
          >
            <input
              type="text"
              placeholder={`${activeStory.username}님에게 답장 보내기...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              style={{
                flex: 1,
                color: '#ffffff',
                fontSize: '14px',
              }}
              onFocus={() => setIsPaused(true)}
              onBlur={() => setIsPaused(false)}
            />
            {replyText && (
              <button type="submit" style={{ color: '#0095f6', fontWeight: 600 }}>
                보내기
              </button>
            )}
          </form>

          <button
            onClick={() => setHasLiked(!hasLiked)}
            style={{ color: hasLiked ? '#ed4956' : '#ffffff', padding: '4px' }}
          >
            <Heart size={26} fill={hasLiked ? '#ed4956' : 'none'} />
          </button>
        </div>
      </div>
    </div>
  );
};
