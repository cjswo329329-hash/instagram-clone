import React, { useState, useEffect, useRef } from 'react';
import { X, Heart, Smile, MoreHorizontal, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { reelApi } from '../../services/reelApi';

export default function ReelsCommentsBox({
  isOpen,
  onClose,
  reel,
  onAddComment,
  isMobile = false,
}) {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [commentLikes, setCommentLikes] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Realistic sample comments fallback matching the screenshot
  const defaultSampleComments = [
    {
      id: 9001,
      username: 'b.bagmyeonghwan',
      profileImageUrl: null,
      text: '이뽀~이뽀.~💚💚💚💚',
      timeAgo: '3시간',
      likes: 1,
    },
    {
      id: 9002,
      username: 'shanqinhuang',
      profileImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      text: '😍',
      timeAgo: '17시간',
      likes: 1,
    },
    {
      id: 9003,
      username: 'bolivarfidel544',
      profileImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      text: '❤️❤️',
      timeAgo: '15시간',
      likes: 0,
    },
    {
      id: 9004,
      username: 'guiguihml92',
      profileImageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      text: '😍😍😍😍❤️❤️❤️❤️❤️❤️❤️',
      timeAgo: '13시간',
      likes: 0,
    },
    {
      id: 9005,
      username: 'mario.revas',
      profileImageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
      text: '대박 영상이네요! 음악 정보 알 수 있을까요? 🎶',
      timeAgo: '16시간',
      likes: 2,
    },
  ];

  // Fetch comments from backend or initialize
  useEffect(() => {
    if (!reel?.id) return;

    let isMounted = true;
    const loadComments = async () => {
      try {
        const res = await reelApi.getReelComments(reel.id);
        if (isMounted) {
          if (res && res.length > 0) {
            const formatted = res.map((c) => ({
              id: c.id,
              username: c.author?.username || c.username || 'user',
              profileImageUrl: c.author?.profile_image_url || c.profile_image_url || null,
              text: c.content || c.text,
              timeAgo: c.time_ago || c.timeAgo || '방금',
              likes: c.likes_count || c.likes || 0,
              isLiked: c.is_liked || false,
            }));
            setComments(formatted);
          } else if (reel.comments && reel.comments.length > 0) {
            setComments(reel.comments);
          } else {
            setComments(defaultSampleComments);
          }
        }
      } catch (err) {
        if (isMounted) {
          setComments(reel.comments && reel.comments.length > 0 ? reel.comments : defaultSampleComments);
        }
      }
    };

    loadComments();
    return () => {
      isMounted = false;
    };
  }, [reel?.id]);

  if (!isOpen || !reel) return null;

  // Toggle comment like
  const handleToggleLike = (commentId) => {
    setCommentLikes((prev) => {
      const current = Boolean(prev[commentId]);
      return { ...prev, [commentId]: !current };
    });
  };

  // Reply to user
  const handleStartReply = (comment) => {
    setReplyingTo(comment);
    setCommentText(`@${comment.username} `);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Submit comment
  const handleSubmit = async (e) => {
    e?.preventDefault();
    const text = commentText.trim();
    if (!text) return;

    const newComment = {
      id: Date.now(),
      username: user?.username || 'me',
      profileImageUrl: user?.profile_image_url || null,
      text,
      timeAgo: '방금',
      likes: 0,
      isLiked: false,
    };

    // Optimistic local update
    setComments((prev) => [newComment, ...prev]);
    setCommentText('');
    setReplyingTo(null);
    setShowEmojiPicker(false);

    if (onAddComment) {
      onAddComment(reel.id, newComment);
    }

    // Scroll to top of comment list
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }

    // Call API in background
    try {
      await reelApi.addReelComment(reel.id, text);
    } catch (err) {
      console.warn('Could not post comment to backend:', err);
    }
  };

  // Insert emoji
  const handleInsertEmoji = (emoji) => {
    setCommentText((prev) => prev + emoji);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const quickEmojis = ['❤️', '🙌', '🔥', '👏', '😢', '😍', '😮', '😂'];

  const boxContent = (
    <div
      className="reels-comments-box-card"
      style={{
        width: isMobile ? '100%' : '360px',
        height: isMobile ? '70vh' : '520px',
        maxHeight: isMobile ? '80vh' : 'calc(100vh - 100px)',
        backgroundColor: 'var(--bg-elevated, #ffffff)',
        color: 'var(--text-primary, #000000)',
        borderRadius: isMobile ? '16px 16px 0 0' : '16px',
        boxShadow: isMobile
          ? '0 -4px 20px rgba(0, 0, 0, 0.25)'
          : '0 8px 30px rgba(0, 0, 0, 0.16)',
        border: '1px solid var(--border-color, #dbdbdb)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        userSelect: 'text',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Header: Close button on left, Title "댓글" centered */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '48px',
          padding: '0 16px',
          borderBottom: '1px solid var(--border-color, #efefef)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={onClose}
          aria-label="닫기"
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            padding: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-primary, #000000)',
            borderRadius: '50%',
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <X size={19} strokeWidth={2.2} />
        </button>

        <h3
          style={{
            margin: 0,
            fontSize: '15px',
            fontWeight: 700,
            color: 'var(--text-primary, #000000)',
            letterSpacing: '-0.2px',
          }}
        >
          댓글
        </h3>
      </div>

      {/* 2. Comments Scrollable List */}
      <div
        ref={listRef}
        className="no-scrollbar"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {comments.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary, #8e8e8e)',
              padding: '40px 0',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>아직 댓글이 없습니다.</p>
            <p style={{ fontSize: '12px', marginTop: '4px' }}>첫 번째 댓글을 남겨보세요.</p>
          </div>
        ) : (
          comments.map((comment) => {
            const isLiked = Boolean(commentLikes[comment.id] ?? comment.isLiked);
            const displayLikes = (comment.likes || 0) + (commentLikes[comment.id] ? 1 : 0);

            return (
              <div
                key={comment.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  width: '100%',
                }}
              >
                {/* Author Avatar */}
                <div style={{ flexShrink: 0 }}>
                  {comment.profileImageUrl ? (
                    <img
                      src={comment.profileImageUrl}
                      alt={comment.username}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '1px solid var(--border-color, #efefef)',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: '#dbdbdb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                      }}
                    >
                      <User size={18} fill="#ffffff" color="#dbdbdb" />
                    </div>
                  )}
                </div>

                {/* Comment Text & Meta */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ lineHeight: '1.4', wordBreak: 'break-word' }}>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: '13px',
                        color: 'var(--text-primary, #000000)',
                        cursor: 'pointer',
                        marginRight: '6px',
                      }}
                    >
                      {comment.username}
                    </span>
                    <span
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary, #8e8e8e)',
                        fontWeight: 400,
                      }}
                    >
                      {comment.timeAgo}
                    </span>
                    <div
                      style={{
                        fontSize: '13.5px',
                        color: 'var(--text-primary, #000000)',
                        marginTop: '2px',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {comment.text}
                    </div>
                  </div>

                  {/* Comment Sub-actions: Likes count, Reply, More */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginTop: '4px',
                      fontSize: '12px',
                      color: 'var(--text-secondary, #8e8e8e)',
                    }}
                  >
                    {displayLikes > 0 && (
                      <span style={{ fontWeight: 600, cursor: 'pointer' }}>
                        좋아요 {displayLikes}개
                      </span>
                    )}
                    <button
                      onClick={() => handleStartReply(comment)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        fontWeight: 600,
                        fontSize: '12px',
                        color: 'var(--text-secondary, #8e8e8e)',
                        cursor: 'pointer',
                      }}
                    >
                      답글 달기
                    </button>
                    <button
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        color: 'var(--text-secondary, #8e8e8e)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      aria-label="더 보기"
                    >
                      <MoreHorizontal size={13} />
                    </button>
                  </div>
                </div>

                {/* Like Heart Button on Right */}
                <button
                  onClick={() => handleToggleLike(comment.id)}
                  aria-label="댓글 좋아요"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '4px',
                    cursor: 'pointer',
                    color: isLiked ? '#ff3040' : 'var(--text-secondary, #8e8e8e)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.15s',
                  }}
                  onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(1.2)')}
                  onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <Heart
                    size={14}
                    strokeWidth={1.8}
                    fill={isLiked ? '#ff3040' : 'none'}
                    color={isLiked ? '#ff3040' : 'currentColor'}
                  />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* 3. Replying indicator banner */}
      {replyingTo && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 16px',
            backgroundColor: 'var(--bg-secondary, #f8f9fa)',
            borderTop: '1px solid var(--border-color, #efefef)',
            fontSize: '12px',
            color: 'var(--text-secondary, #8e8e8e)',
          }}
        >
          <span>
            <strong>@{replyingTo.username}</strong> 님에게 답글 남기는 중
          </span>
          <button
            onClick={() => {
              setReplyingTo(null);
              setCommentText('');
            }}
            style={{
              background: 'none',
              border: 'none',
              padding: '2px',
              cursor: 'pointer',
              color: 'var(--text-secondary, #8e8e8e)',
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 4. Quick Emoji Picker Bar (shown when smile icon is clicked) */}
      {showEmojiPicker && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            padding: '8px 12px',
            backgroundColor: 'var(--bg-secondary, #f8f9fa)',
            borderTop: '1px solid var(--border-color, #efefef)',
          }}
        >
          {quickEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleInsertEmoji(emoji)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                padding: '2px',
                transition: 'transform 0.1s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.25)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* 5. Sticky Bottom Input Form (Exact Pill Shape from Screenshot) */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border-color, #efefef)',
          backgroundColor: 'var(--bg-elevated, #ffffff)',
          flexShrink: 0,
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            width: '100%',
          }}
        >
          {/* Current User Avatar */}
          <div style={{ flexShrink: 0 }}>
            {user?.profile_image_url ? (
              <img
                src={user.profile_image_url}
                alt={user.username || 'My avatar'}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '1px solid var(--border-color, #efefef)',
                }}
              />
            ) : (
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#dbdbdb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                }}
              >
                <User size={18} fill="#ffffff" color="#dbdbdb" />
              </div>
            )}
          </div>

          {/* Capsule / Pill Input Container */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--bg-secondary, #f1f2f4)',
              borderRadius: '22px',
              padding: '7px 14px',
              gap: '8px',
            }}
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="댓글 달기..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                fontSize: '13px',
                color: 'var(--text-primary, #000000)',
                padding: 0,
              }}
            />

            {/* Smile Emoji Icon Button */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              aria-label="이모티콘 선택"
              style={{
                background: 'none',
                border: 'none',
                padding: '2px',
                cursor: 'pointer',
                color: showEmojiPicker
                  ? 'var(--ig-primary-button, #0095f6)'
                  : 'var(--text-secondary, #8e8e8e)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Smile size={18} />
            </button>
          </div>

          {/* "게시" Submit Button (Visible when text entered) */}
          {commentText.trim().length > 0 && (
            <button
              type="submit"
              style={{
                background: 'none',
                border: 'none',
                padding: '0 4px',
                fontWeight: 700,
                fontSize: '13.5px',
                color: 'var(--ig-primary-button, #0095f6)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              게시
            </button>
          )}
        </form>
      </div>
    </div>
  );

  // If mobile view, render bottom sheet with dark overlay
  if (isMobile) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          animation: 'fadeIn 0.2s ease-out',
        }}
        onClick={onClose}
      >
        {boxContent}
      </div>
    );
  }

  // Desktop floating card
  return boxContent;
}
