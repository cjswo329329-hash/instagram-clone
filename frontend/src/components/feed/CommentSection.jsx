import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
export const CommentSection = ({
  post,
  onOpenDetail,
}) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleUserClick = (targetUsername) => {
    if (!targetUsername) return;
    navigate(`/${targetUsername}`);
  };

  const shouldTruncate = post.caption && post.caption.length > 90 && !isExpanded;

  return (
    <div style={{ padding: '0 14px 14px 14px' }}>
      {/* Caption */}
      {post.caption && (
        <div style={{ fontSize: '14px', marginBottom: '6px', lineHeight: 1.45 }}>
          <span
            onClick={() => handleUserClick(post.author?.username)}
            style={{
              fontWeight: 600,
              marginRight: '6px',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              transition: 'opacity 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            {post.author?.username}
          </span>
          <span style={{ whiteSpace: 'pre-line' }}>
            {shouldTruncate ? `${post.caption.slice(0, 90)}...` : post.caption}
          </span>
          {shouldTruncate && (
            <button
              onClick={() => setIsExpanded(true)}
              style={{
                color: 'var(--text-secondary)',
                fontSize: '14px',
                marginLeft: '6px',
                fontWeight: 400,
              }}
            >
              더 보기
            </button>
          )}
        </div>
      )}

      {/* View All Comments link */}
      {post.comments && post.comments.length > 0 && (
        <button
          onClick={onOpenDetail}
          style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            marginBottom: '6px',
            display: 'block',
            textAlign: 'left',
          }}
        >
          댓글 {(post.commentsCount || post.comments.length).toLocaleString()}개 모두 보기
        </button>
      )}

      {/* Recent Comments preview */}
      {post.comments && post.comments.slice(-2).map((comment) => (
        <div
          key={comment.id}
          style={{
            fontSize: '14px',
            marginBottom: '4px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
          }}
        >
          <div>
            <span
              onClick={() => handleUserClick(comment.author?.username || comment.username)}
              style={{
                fontWeight: 600,
                marginRight: '6px',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                transition: 'opacity 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              {comment.author?.username || comment.username}
            </span>
            <span>{comment.text}</span>
          </div>
        </div>
      ))}

      {/* Post Timestamp */}
      <div style={{ marginTop: '6px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          {post.timeAgo || '방금 전'}
        </span>
      </div>
    </div>
  );
};
