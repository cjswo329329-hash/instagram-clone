import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Copy, Play, Film, Bookmark, UserCheck, Camera } from 'lucide-react';
import { useModal } from '../../contexts/ModalContext';
import { useAuth } from '../../contexts/AuthContext';

export const PostGrid = ({ posts, tab = 'posts', isMe = true }) => {
  const { openPostDetail, openCreatePost } = useModal();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handlePostClick = (post) => {
    if (!user) {
      navigate('/login');
      return;
    }
    openPostDetail(post);
  };

  // Render authentic Instagram empty states
  if (!posts || posts.length === 0) {
    if (tab === 'saved') {
      return (
        <div style={{ textAlign: 'center', padding: '60px 20px', maxWidth: '360px', margin: '0 auto' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              border: '2px solid var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Bookmark size={30} strokeWidth={1.5} color="var(--text-primary)" />
          </div>
          <h3 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '12px' }}>
            저장
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            다시 보고 싶은 사진과 동영상을 저장하세요. 저장한 콘텐츠는 회원님만 볼 수 있으며 다른 사람에게는 공개되지 않습니다.
          </p>
        </div>
      );
    }

    if (tab === 'tagged') {
      return (
        <div style={{ textAlign: 'center', padding: '60px 20px', maxWidth: '360px', margin: '0 auto' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              border: '2px solid var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <UserCheck size={30} strokeWidth={1.5} color="var(--text-primary)" />
          </div>
          <h3 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '12px' }}>
            내가 나온 사진
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            사람들이 회원님을 사진에 태그하면 태그된 사진이 여기에 표시됩니다.
          </p>
        </div>
      );
    }

    if (tab === 'reels') {
      return (
        <div style={{ textAlign: 'center', padding: '60px 20px', maxWidth: '360px', margin: '0 auto' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              border: '2px solid var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Film size={30} strokeWidth={1.5} color="var(--text-primary)" />
          </div>
          <h3 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '12px' }}>
            릴스 동영상
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            회원님의 짧고 흥미로운 릴스 동영상을 공유해보세요.
          </p>
        </div>
      );
    }

    // Default posts tab empty state
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', maxWidth: '360px', margin: '0 auto' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            border: '2px solid var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <Camera size={30} strokeWidth={1.5} color="var(--text-primary)" />
        </div>
        <h3 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '12px' }}>
          사진 공유
        </h3>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
          사진을 공유하면 회원님의 프로필에 표시됩니다.
        </p>
        {isMe && (
          <button
            onClick={() => openCreatePost()}
            style={{
              color: 'var(--ig-primary-button)',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            첫 사진 공유하기
          </button>
        )}
      </div>
    );
  }

  const isReelsTab = tab === 'reels';

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '4px',
        width: '100%',
      }}
      className="post-grid-container"
    >
      {posts.map((post) => {
        const coverUrl = post.media?.[0]?.mediaUrl || post.mediaUrl;
        const isMultiple = post.media?.length > 1 || post.isMultiple;
        const isVideo = post.isVideo || isReelsTab;

        return (
          <div
            key={post.id}
            onClick={() => handlePostClick(post)}
            style={{
              position: 'relative',
              aspectRatio: isReelsTab ? '9 / 16' : '1 / 1',
              backgroundColor: '#1a1a1a',
              cursor: 'pointer',
              overflow: 'hidden',
            }}
            className="grid-item-card"
          >
            <img
              src={coverUrl}
              alt="Grid thumbnail"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                transition: 'transform 0.2s ease',
              }}
              loading="lazy"
            />

            {/* Multiple media indicator */}
            {isMultiple && !isReelsTab && (
              <div
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  color: '#ffffff',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))',
                  pointerEvents: 'none',
                }}
              >
                <Copy size={18} />
              </div>
            )}

            {/* Reels Video indicator */}
            {isVideo && (
              <div
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  color: '#ffffff',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))',
                  pointerEvents: 'none',
                }}
              >
                <Film size={18} />
              </div>
            )}

            {/* Reels View count on bottom left if reels tab */}
            {isReelsTab && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '8px',
                  left: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 600,
                  textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                }}
              >
                <Play size={12} fill="#ffffff" />
                <span>{((post.likesCount || 1000) * 8).toLocaleString()}</span>
              </div>
            )}

            {/* Hover overlay with like and comment stats */}
            <div
              className="grid-hover-overlay"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '24px',
                color: '#ffffff',
                opacity: 0,
                transition: 'opacity 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '16px' }}>
                <Heart size={20} fill="#ffffff" />
                <span>{(post.likesCount || 0).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '16px' }}>
                <MessageCircle size={20} fill="#ffffff" />
                <span>{(post.commentsCount || post.comments?.length || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        );
      })}

      <style>{`
        .grid-item-card:hover .grid-hover-overlay {
          opacity: 1 !important;
        }
        .grid-item-card:hover img {
          transform: scale(1.02);
        }
        @media (min-width: 768px) {
          .post-grid-container {
            gap: 24px !important;
          }
        }
      `}</style>
    </div>
  );
};
