import React from 'react';
import { Heart, MessageCircle, Bookmark } from 'lucide-react';

export const formatCount = (count) => {
  if (count === null || count === undefined) return '0';
  const num = Number(count);
  if (isNaN(num) || num <= 0) return '0';
  if (num >= 10000) {
    const val = (num / 10000).toFixed(1).replace(/\.0$/, '');
    return `${val}만`;
  }
  if (num >= 1000) {
    const val = (num / 1000).toFixed(1).replace(/\.0$/, '');
    return `${val}천`;
  }
  return num.toLocaleString();
};

export const PostActions = ({
  isLiked = false,
  isBookmarked = false,
  likesCount = 0,
  commentsCount = 0,
  showCounts = false,
  onLike,
  onComment,
  onBookmark
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 14px 6px 14px',
      }}
    >
      {/* Left Action Buttons: Like & Comment */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={onLike}
          aria-label={isLiked ? "Unlike" : "Like"}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: isLiked ? 'var(--ig-danger)' : 'var(--text-primary)',
            transition: 'transform 0.15s ease, opacity 0.15s ease',
            padding: '2px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            userSelect: 'none',
          }}
          className={isLiked ? 'like-bounce' : ''}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          <Heart
            size={24}
            fill={isLiked ? 'var(--ig-danger)' : 'none'}
            stroke={isLiked ? 'var(--ig-danger)' : 'currentColor'}
            strokeWidth={isLiked ? 0 : 2}
          />
          {showCounts && Number(likesCount) > 0 && (
            <span
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '-0.2px',
                lineHeight: 1,
              }}
            >
              {formatCount(likesCount)}
            </span>
          )}
        </button>

        <button
          onClick={onComment}
          aria-label="Comment"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-primary)',
            transition: 'opacity 0.15s ease',
            padding: '2px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            userSelect: 'none',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          <MessageCircle size={24} strokeWidth={2} />
          {showCounts && Number(commentsCount) > 0 && (
            <span
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '-0.2px',
                lineHeight: 1,
              }}
            >
              {formatCount(commentsCount)}
            </span>
          )}
        </button>
      </div>

      {/* Right Action Button: Bookmark */}
      {onBookmark && (
        <button
          onClick={onBookmark}
          aria-label={isBookmarked ? "Remove bookmark" : "Bookmark"}
          style={{
            color: 'var(--text-primary)',
            padding: '2px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <Bookmark
            size={24}
            fill={isBookmarked ? 'var(--text-primary)' : 'none'}
            strokeWidth={isBookmarked ? 0 : 2}
          />
        </button>
      )}
    </div>
  );
};
