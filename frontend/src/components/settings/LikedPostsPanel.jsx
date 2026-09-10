import React, { useState } from 'react';
import { Heart, Check, Trash2, ArrowUpDown } from 'lucide-react';
import { Button } from '../common/Button';
import { useModal } from '../../contexts/ModalContext';

export const LikedPostsPanel = ({ showToast }) => {
  const { posts, toggleLikePost, openPostDetail } = useModal();
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedPostIds, setSelectedPostIds] = useState([]);
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' or 'oldest'

  const likedPosts = posts.filter(p => p.isLiked);

  const sortedPosts = [...likedPosts].sort((a, b) => {
    return sortOrder === 'newest' ? b.id - a.id : a.id - b.id;
  });

  const handleToggleSelectPost = (postId) => {
    setSelectedPostIds(prev =>
      prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPostIds.length === likedPosts.length) {
      setSelectedPostIds([]);
    } else {
      setSelectedPostIds(likedPosts.map(p => p.id));
    }
  };

  const handleBatchUnlike = () => {
    if (selectedPostIds.length === 0) return;
    selectedPostIds.forEach(id => {
      toggleLikePost(id);
    });
    showToast(`${selectedPostIds.length}개 게시물의 좋아요를 취소했습니다.`);
    setSelectedPostIds([]);
    setIsSelectMode(false);
  };

  return (
    <div style={{ maxWidth: '680px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>
            좋아요한 콘텐츠 관리
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            회원님이 좋아요를 누른 총 {likedPosts.length}개의 게시물입니다.
          </p>
        </div>

        {likedPosts.length > 0 && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant={isSelectMode ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => {
                setIsSelectMode(!isSelectMode);
                setSelectedPostIds([]);
              }}
            >
              {isSelectMode ? '취소' : '선택'}
            </Button>
          </div>
        )}
      </div>

      {/* Select Mode Action Bar */}
      {isSelectMode && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '10px',
            marginBottom: '16px',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700 }}>
              {selectedPostIds.length}개 선택됨
            </span>
            <button
              onClick={handleSelectAll}
              style={{ fontSize: '13px', color: 'var(--ig-primary-button)', fontWeight: 600, cursor: 'pointer' }}
            >
              {selectedPostIds.length === likedPosts.length ? '전체 해제' : '모두 선택'}
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleBatchUnlike}
            disabled={selectedPostIds.length === 0}
            style={{
              backgroundColor: selectedPostIds.length > 0 ? 'var(--ig-danger)' : 'var(--border-color)',
              borderColor: selectedPostIds.length > 0 ? 'var(--ig-danger)' : 'var(--border-color)',
              color: '#ffffff',
            }}
          >
            좋아요 취소
          </Button>
        </div>
      )}

      {/* Grid of Liked Posts */}
      {sortedPosts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          <Heart size={44} strokeWidth={1.5} style={{ margin: '0 auto 12px', color: 'var(--text-secondary)' }} />
          <p style={{ fontSize: '16px', fontWeight: 600 }}>좋아요를 누른 게시물이 없습니다.</p>
          <p style={{ fontSize: '13px', marginTop: '4px' }}>마음에 드는 사진이나 동영상에 하트를 눌러보세요.</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '6px',
          }}
        >
          {sortedPosts.map(post => {
            const coverUrl = post.media?.[0]?.mediaUrl || post.mediaUrl;
            const isSelected = selectedPostIds.includes(post.id);

            return (
              <div
                key={post.id}
                onClick={() => {
                  if (isSelectMode) {
                    handleToggleSelectPost(post.id);
                  } else {
                    openPostDetail(post);
                  }
                }}
                style={{
                  position: 'relative',
                  aspectRatio: '1 / 1',
                  backgroundColor: '#1a1a1a',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                }}
              >
                <img
                  src={coverUrl}
                  alt="Liked post thumbnail"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />

                {/* Selection Checkbox Overlay */}
                {isSelectMode && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      border: isSelected ? 'none' : '2px solid #ffffff',
                      backgroundColor: isSelected ? 'var(--ig-primary-button)' : 'rgba(0,0,0,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                    }}
                  >
                    {isSelected && <Check size={16} strokeWidth={3} />}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
