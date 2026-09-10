import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { Avatar } from '../common/Avatar';

export const StoryTray = () => {
  const { user } = useAuth();
  const { stories, openStoryViewer } = useModal();
  const { requireAuth } = useAuthGuard();
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const amount = direction === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  // 비로그인(게스트) 사용자에게는 스토리 트레이를 노출하지 않음 (실제 인스타그램 웹 표준)
  if (!user) {
    return null;
  }

  // 1. 내 스토리 데이터 확인 (본인이 올린 스토리가 있는지 조회)
  const myStoryItem = stories.find(
    s => (s.userId && user?.id && String(s.userId) === String(user.id)) ||
         (s.username && user?.username && s.username === user.username)
  );

  // 2. 다른 사람들의 스토리 목록 (현재 로그인한 유저 본인은 반드시 제외하여 중복 방지!)
  const otherStories = stories.filter(
    s => !( (s.userId && user?.id && String(s.userId) === String(user.id)) ||
            (s.username && user?.username && s.username === user.username) )
  );

  return (
    <div
      style={{
        position: 'relative',
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '8px',
        padding: '16px 0',
        marginBottom: '20px',
        border: '1px solid var(--border-color)',
      }}
      className="story-tray-wrapper"
    >
      {/* Scroll Left Button */}
      <button
        onClick={() => handleScroll('left')}
        style={{
          position: 'absolute',
          left: '8px',
          top: '50%',
          transform: 'translateY(-50%)',
          backgroundColor: '#ffffff',
          borderRadius: '50%',
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
          zIndex: 10,
          color: '#333333',
        }}
        className="story-nav-btn"
      >
        <ChevronLeft size={18} />
      </button>

      {/* Horizontal Tray */}
      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          overflowX: 'auto',
          padding: '0 16px',
        }}
        className="no-scrollbar"
      >
        {/* 1. 맨 앞: 내 스토리 (오직 1개만 렌더링!) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            flexShrink: 0,
            width: '66px',
          }}
          onClick={() => {
            if (myStoryItem && myStoryItem.stories?.length > 0) {
              openStoryViewer(myStoryItem);
            } else {
              alert("스토리 추가 기능: 내 스토리에 새로운 일상을 공유해보세요!");
            }
          }}
        >
          <Avatar
            src={user?.profile_image_url}
            size="lg"
            isAddable={!myStoryItem || !myStoryItem.stories?.length}
            hasStory={Boolean(myStoryItem && myStoryItem.stories?.length > 0)}
            isStoryViewed={Boolean(myStoryItem && !myStoryItem.hasUnseen)}
            alt="내 스토리"
          />
          <span
            style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '64px',
              textAlign: 'center',
            }}
          >
            내 스토리
          </span>
        </div>

        {/* 2. 그 뒤: 팔로우 및 다른 유저들의 스토리 (본인 제외 & 각자의 고유 사진 노출) */}
        {otherStories.map((storyItem) => (
          <div
            key={storyItem.userId || storyItem.username}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              flexShrink: 0,
              width: '66px',
            }}
            onClick={() => {
              requireAuth(() => {
                openStoryViewer(storyItem);
              }, {
                actionType: 'story',
                title: '스토리 시청하기',
                description: 'Instagram에 로그인하여 크리에이터들의 24시간 스토리를 확인하세요.'
              });
            }}
          >
            <Avatar
              src={storyItem.profileImage}
              size="lg"
              hasStory={true}
              isStoryViewed={!storyItem.hasUnseen}
              alt={storyItem.username}
            />
            <span
              style={{
                fontSize: '12px',
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '64px',
                textAlign: 'center',
              }}
            >
              {storyItem.username}
            </span>
          </div>
        ))}
      </div>

      {/* Scroll Right Button */}
      <button
        onClick={() => handleScroll('right')}
        style={{
          position: 'absolute',
          right: '8px',
          top: '50%',
          transform: 'translateY(-50%)',
          backgroundColor: '#ffffff',
          borderRadius: '50%',
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
          zIndex: 10,
          color: '#333333',
        }}
        className="story-nav-btn"
      >
        <ChevronRight size={18} />
      </button>

      <style>{`
        @media (max-width: 768px) {
          .story-tray-wrapper {
            border: none !important;
            border-radius: 0 !important;
            margin-bottom: 0 !important;
            padding: 10px 0 12px 0 !important;
          }
          .story-nav-btn {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
