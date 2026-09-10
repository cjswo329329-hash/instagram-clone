import React, { useState, useEffect, useRef } from 'react';
import { X, Heart, Smile } from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { useAuth } from '../../contexts/AuthContext';
import { reelApi, postApi } from '../../services';

export const ReelsCommentDrawer = ({ isOpen, onClose, reel, onAddComment }) => {
  if (!isOpen || !reel) return null;

  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState(reel.comments || []);
  const [commentLikes, setCommentLikes] = useState({});
  const [replyingTo, setReplyingTo] = useState(null); // { commentId, username }
  const [expandedReplies, setExpandedReplies] = useState(new Set());
  const inputRef = useRef(null);

  const fetchComments = () => {
    if (reel?.id) {
      reelApi.getReelComments(reel.id).then(res => {
        if (res && res.length > 0) {
          setComments(res.map(c => ({
            id: c.id,
            username: c.author?.username || c.username,
            profileImageUrl: c.author?.profile_image_url || c.profile_image_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
            text: c.content || c.text,
            timeAgo: c.time_ago || c.timeAgo || '방금 전',
            likes: c.likes_count || c.likes || 0,
            repliesCount: c.replies_count || c.replies?.length || 0,
            replies: (c.replies || []).map(r => ({
              id: r.id,
              username: r.author?.username || r.username,
              profileImageUrl: r.author?.profile_image_url || r.profile_image_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
              text: r.content || r.text,
              timeAgo: r.time_ago || r.timeAgo || '방금 전',
              likes: r.likes_count || r.likes || 0
            }))
          })));
        } else {
          setComments(reel.comments || []);
        }
      }).catch(err => {
        console.warn('Could not fetch reel comments from backend:', err);
        setComments(reel.comments || []);
      });
    }
  };

  useEffect(() => {
    fetchComments();
  }, [reel?.id]);

  const emojis = ['❤️', '🔥', '👏', '😍', '🙌', '✨', '☕️', '🥐'];

  const handleStartReply = (comment) => {
    setReplyingTo({
      commentId: comment.id,
      username: comment.username
    });
    setCommentText(`@${comment.username} `);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const toggleRepliesVisibility = (commentId) => {
    setExpandedReplies(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const textToSubmit = commentText.trim();
    const parentId = replyingTo ? replyingTo.commentId : null;

    setCommentText('');
    setReplyingTo(null);

    try {
      await reelApi.addReelComment(reel.id, textToSubmit, parentId);
      fetchComments();
      if (parentId) {
        setExpandedReplies(prev => new Set(prev).add(parentId));
      }
    } catch (err) {
      console.error('Failed to submit reel comment on backend:', err);
    }
  };

  const handleToggleCommentLike = async (commentId) => {
    const nextState = !commentLikes[commentId];
    setCommentLikes(prev => ({
      ...prev,
      [commentId]: nextState
    }));
    try {
      await postApi.toggleCommentLike(commentId);
    } catch (err) {
      console.error('Failed to toggle comment like:', err);
    }
  };

  const handleAddEmoji = (emoji) => {
    setCommentText(prev => prev + emoji);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        zIndex: 1100,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          height: '100%',
          backgroundColor: 'var(--bg-primary)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.2)',
          animation: 'slideInRight 0.25s ease-out forwards',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div style={{ width: '24px' }} />
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
            댓글 ({comments.length})
          </h3>
          <button
            onClick={onClose}
            style={{
              color: 'var(--text-primary)',
              cursor: 'pointer',
              padding: '4px',
              background: 'none',
              border: 'none'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Comment list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }} className="no-scrollbar">
          {comments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
              <p style={{ fontSize: '14px' }}>아직 댓글이 없습니다.</p>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>첫 번째 댓글을 남겨보세요.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {comments.map((c) => {
                const isLiked = !!commentLikes[c.id];
                const likeCount = (c.likes || 0) + (isLiked ? 1 : 0);
                const replies = c.replies || [];
                const repliesCount = c.repliesCount || replies.length;
                const isRepliesExpanded = expandedReplies.has(c.id);

                return (
                  <div key={c.id} style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <Avatar src={c.profileImageUrl} size="sm" alt={c.username} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {c.username}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {c.timeAgo}
                          </span>
                        </div>
                        <p style={{ fontSize: '13.5px', color: 'var(--text-primary)', lineHeight: 1.45, wordBreak: 'break-word' }}>
                          {c.text}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                          <button
                            onClick={() => handleStartReply(c)}
                            style={{
                              fontSize: '11px',
                              color: 'var(--text-secondary)',
                              fontWeight: 600,
                              cursor: 'pointer',
                              background: 'none',
                              border: 'none',
                              padding: 0
                            }}
                          >
                            답글 달기
                          </button>
                        </div>

                        {/* View replies button */}
                        {repliesCount > 0 && (
                          <button
                            onClick={() => toggleRepliesVisibility(c.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              fontSize: '11px',
                              color: 'var(--text-muted)',
                              fontWeight: 600,
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              marginTop: '8px',
                              padding: 0
                            }}
                          >
                            <span style={{ display: 'inline-block', width: '20px', height: '1px', backgroundColor: 'var(--border-color)' }} />
                            {isRepliesExpanded ? '답글 숨기기' : `답글 ${repliesCount}개 보기`}
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => handleToggleCommentLike(c.id)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '2px',
                          cursor: 'pointer',
                          color: isLiked ? 'var(--ig-danger)' : 'var(--text-muted)',
                          paddingTop: '2px',
                          background: 'none',
                          border: 'none'
                        }}
                      >
                        <Heart size={14} fill={isLiked ? 'var(--ig-danger)' : 'none'} />
                        {likeCount > 0 && (
                          <span style={{ fontSize: '10px' }}>{likeCount}</span>
                        )}
                      </button>
                    </div>

                    {/* Replies list */}
                    {isRepliesExpanded && replies.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px', paddingLeft: '40px' }}>
                        {replies.map(r => (
                          <div key={r.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                            <Avatar src={r.profileImageUrl} size="xs" alt={r.username} />
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                  {r.username}
                                </span>
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                  {r.timeAgo}
                                </span>
                              </div>
                              <p style={{ fontSize: '12.5px', color: 'var(--text-primary)', lineHeight: 1.4, wordBreak: 'break-word' }}>
                                {r.text}
                              </p>
                              <button
                                onClick={() => handleStartReply({ id: c.id, username: r.username })}
                                style={{
                                  fontSize: '10px',
                                  color: 'var(--text-secondary)',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  background: 'none',
                                  border: 'none',
                                  padding: 0,
                                  marginTop: '2px'
                                }}
                              >
                                답글 달기
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Emoji Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            padding: '10px 16px',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)',
          }}
        >
          {emojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleAddEmoji(emoji)}
              style={{
                fontSize: '20px',
                cursor: 'pointer',
                transition: 'transform 0.1s ease',
                background: 'none',
                border: 'none',
                padding: '2px'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.25)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Replying banner if active */}
        {replyingTo && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 16px',
              backgroundColor: 'var(--bg-secondary)',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '12px',
              color: 'var(--text-secondary)',
            }}
          >
            <span><strong>@{replyingTo.username}</strong> 님에게 답글 남기는 중</span>
            <button
              onClick={() => { setReplyingTo(null); setCommentText(''); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Input Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-primary)',
          }}
        >
          <Avatar
            src={user?.profile_image_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
            size="sm"
            alt="Current user"
          />
          <input
            ref={inputRef}
            type="text"
            placeholder={replyingTo ? `@${replyingTo.username}님에게 답글 달기...` : `${user?.username || 'alex_creator'}(으)로 댓글 달기...`}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              fontSize: '13.5px',
              color: 'var(--text-primary)',
            }}
          />
          <button
            type="submit"
            disabled={!commentText.trim()}
            style={{
              fontWeight: 700,
              fontSize: '13.5px',
              color: commentText.trim() ? 'var(--ig-primary-button)' : 'var(--text-muted)',
              cursor: commentText.trim() ? 'pointer' : 'default',
              background: 'none',
              border: 'none'
            }}
          >
            {replyingTo ? '답글' : '게시'}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};
