import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Heart,
  Smile,
  Image as ImageIcon,
  Phone,
  Video,
  Info,
  ChevronLeft
} from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { useAuth } from '../../contexts/AuthContext';

const ChatMediaImage = ({ src, alt = "Sent media", isUploading = false }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(!src?.startsWith('blob:'));

  const isInvalidBlob = src && src.startsWith('blob:') && !src.includes(window.location.host);

  if (hasError || isInvalidBlob) {
    return (
      <div
        style={{
          width: '220px',
          padding: '24px 16px',
          backgroundColor: 'var(--bg-secondary)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          color: 'var(--text-secondary)',
          fontSize: '13px',
          textAlign: 'center',
          userSelect: 'none',
        }}
      >
        <ImageIcon size={28} style={{ opacity: 0.5 }} />
        <span>사진을 불러올 수 없습니다</span>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', minWidth: '140px', minHeight: '100px', backgroundColor: 'var(--bg-secondary)' }}>
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '120px',
          }}
        >
          <div
            style={{
              width: '20px',
              height: '20px',
              border: '2px solid var(--border-color)',
              borderTopColor: '#0095f6',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        onLoad={() => setIsLoading(false)}
        onError={() => setHasError(true)}
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
          cursor: 'pointer',
          transition: 'opacity 0.2s ease',
          opacity: isLoading ? 0 : 1,
        }}
        onClick={() => {
          if (src && !src.startsWith('blob:')) {
            window.open(src, '_blank');
          }
        }}
        title="클릭하여 원본 사진 보기"
      />
      {isUploading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          <div
            style={{
              width: '20px',
              height: '20px',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderTopColor: '#ffffff',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <span>업로드 중...</span>
        </div>
      )}
    </div>
  );
};

export const ChatThread = ({
  conversation,
  onSendMessage,
  onToggleReaction,
  onOpenNewMessage,
  onBackToConversations,
  isPartnerTyping = false
}) => {
  const { user } = useAuth();
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const quickEmojis = ['❤️', '🙌', '🔥', '👏', '😍', '😂', '✨', '☕️', '👍', '🎉'];

  // Scroll to bottom whenever messages change or partner typing starts
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages, isPartnerTyping]);

  if (!conversation) {
    // Empty State matching Instagram DM screenshot exactly
    return (
      <div
        style={{
          flex: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          textAlign: 'center',
          backgroundColor: 'var(--bg-primary)',
        }}
      >
        {/* Instagram Direct Circular Icon */}
        <div
          style={{
            width: '96px',
            height: '96px',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}
        >
          <svg
            width="96"
            height="96"
            viewBox="0 0 96 96"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Outer Circle */}
            <circle cx="48" cy="48" r="46" />
            {/* Direct Paper Airplane Emblem */}
            <path
              d="M34 40.5 C34 38.5 35.5 37 37.5 37 L58.5 37 C60.5 37 62 38.5 62 40.5 C62 41.2 61.7 41.9 61.2 42.4 L50.2 55.4 C49.1 56.7 46.9 56.7 45.8 55.4 L34.8 42.4 C34.3 41.9 34 41.2 34 40.5 Z"
              strokeWidth="2"
            />
            <line x1="48" y1="37" x2="48" y2="56" strokeWidth="2" />
            <path d="M34.8 42.4 L48 48 L61.2 42.4" strokeWidth="2" />
          </svg>
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: '20px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '8px',
          }}
        >
          내 메시지
        </h2>

        {/* Subtitle */}
        <p
          style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            maxWidth: '340px',
            lineHeight: 1.4,
            marginBottom: '22px',
          }}
        >
          친구나 그룹에 비공개 사진과 메시지를 보내보세요
        </p>

        {/* Blue Action Button */}
        <button
          onClick={onOpenNewMessage}
          style={{
            backgroundColor: '#0095f6',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '7px 16px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1877f2')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0095f6')}
        >
          메시지 보내기
        </button>
      </div>
    );
  }

  const partner = conversation?.partner || {};
  const messages = conversation?.messages || [];

  const handleSend = (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(conversation.id, {
      text: inputText.trim(),
      type: 'text'
    });
    setInputText('');
    setShowEmojiPicker(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (e.nativeEvent?.isComposing) return;
      e.preventDefault();
      handleSend(e);
    }
  };

  const handleSendHeart = () => {
    onSendMessage(conversation.id, {
      text: '❤️',
      type: 'heart'
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      onSendMessage(conversation.id, {
        text: '',
        mediaUrl: previewUrl,
        file: file,
        type: 'image'
      });
      e.target.value = '';
    }
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const previewUrl = URL.createObjectURL(file);
          onSendMessage(conversation.id, {
            text: '',
            mediaUrl: previewUrl,
            file: file,
            type: 'image'
          });
          e.preventDefault();
          break;
        }
      }
    }
  };

  return (
    <div
      style={{
        flex: 1,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-primary)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Thread Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: '1px solid var(--border-color)',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Mobile back button */}
          <button
            onClick={onBackToConversations}
            style={{
              display: 'none',
              color: 'var(--text-primary)',
              background: 'transparent',
              border: 'none',
              padding: '4px',
              cursor: 'pointer',
            }}
            className="mobile-back-btn"
            aria-label="Back to conversations"
          >
            <ChevronLeft size={26} />
          </button>

          <NavLink to={partner.username ? `/${partner.username}` : '#'} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Avatar src={partner.profile_image_url} size="md" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {partner.username || '사용자'}
                </span>
                {partner.is_verified && (
                  <span
                    style={{
                      width: '12px',
                      height: '12px',
                      backgroundColor: '#0095f6',
                      borderRadius: '50%',
                      color: '#fff',
                      fontSize: '8px',
                      textAlign: 'center',
                      lineHeight: '12px',
                      display: 'inline-block',
                    }}
                  >
                    ✓
                  </span>
                )}
              </div>
              <span style={{ fontSize: '12px', color: partner.is_online ? '#10b981' : 'var(--text-secondary)' }}>
                {partner.last_active || (partner.is_online ? '현재 활동 중' : '오프라인')}
              </span>
            </div>
          </NavLink>
        </div>

        {/* Action icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--text-primary)' }}>
          <button
            onClick={() => alert(`${partner.username || '상대방'}님과의 음성 통화 기능 준비 중입니다.`)}
            style={{ color: 'var(--text-primary)', background: 'transparent', border: 'none', padding: '4px', cursor: 'pointer' }}
            aria-label="Audio Call"
          >
            <Phone size={22} />
          </button>
          <button
            onClick={() => alert(`${partner.username || '상대방'}님과의 영상 통화 기능 준비 중입니다.`)}
            style={{ color: 'var(--text-primary)', background: 'transparent', border: 'none', padding: '4px', cursor: 'pointer' }}
            aria-label="Video Call"
          >
            <Video size={24} />
          </button>
          <button
            onClick={() => alert(`상세 정보: ${partner.full_name || partner.username || '상대방'}`)}
            style={{ color: 'var(--text-primary)', background: 'transparent', border: 'none', padding: '4px', cursor: 'pointer' }}
            aria-label="Info"
          >
            <Info size={22} />
          </button>
        </div>
      </div>

      {/* Messages Stream Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
        className="custom-dm-scrollbar"
      >
        {/* Top Profile Card Header in chat */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '24px 0 20px 0',
            textAlign: 'center',
          }}
        >
          <Avatar src={partner.profile_image_url} size="xl" />
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '12px' }}>
            {partner.username || '사용자'}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {partner.full_name || partner.username || ''} • Instagram
          </div>
          <NavLink
            to={partner.username ? `/${partner.username}` : '#'}
            style={{
              marginTop: '16px',
              padding: '6px 16px',
              backgroundColor: 'var(--border-subtle)',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            프로필 보기
          </NavLink>
        </div>

        {/* Date Divider */}
        <div style={{ textAlign: 'center', margin: '14px 0' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>오늘</span>
        </div>

        {/* Message Bubbles */}
        {messages.map((msg, index) => {
          const isPartner = conversation?.partner?.id != null && String(msg.sender_id) === String(conversation.partner.id);
          const isMine = conversation?.partner?.id != null
            ? !isPartner
            : (user?.id != null ? String(msg.sender_id) === String(user.id) : false);
          const isHeart = msg.text === '❤️' && !msg.mediaUrl;
          const hasReaction = msg.reactions && msg.reactions.length > 0;

          // Grouping check: avatar is shown on the last message of a consecutive group from the partner
          const nextMsg = messages[index + 1];
          const isLastInGroup = !nextMsg || (conversation?.partner?.id != null
            ? (String(nextMsg.sender_id) === String(conversation.partner.id)) !== isPartner
            : String(nextMsg.sender_id) !== String(msg.sender_id));

          return (
            <div
              key={msg.id || index}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isMine ? 'flex-end' : 'flex-start',
                marginBottom: isLastInGroup ? '8px' : '3px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '8px',
                  maxWidth: '70%',
                }}
              >
                {/* Partner avatar beside message if received */}
                {!isMine && (
                  isLastInGroup ? (
                    <Avatar src={partner.profile_image_url} size="xs" />
                  ) : (
                    <div style={{ width: '24px', height: '24px', flexShrink: 0 }} />
                  )
                )}

                <div
                  onDoubleClick={() => onToggleReaction(conversation.id, msg.id)}
                  style={{
                    position: 'relative',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                  title="더블 클릭하여 하트 반응 남기기"
                >
                  {isHeart ? (
                    <div style={{ fontSize: '48px', padding: '0 4px', lineHeight: 1 }}>
                      ❤️
                    </div>
                  ) : msg.mediaUrl ? (
                    <div
                      style={{
                        borderRadius: '18px',
                        overflow: 'hidden',
                        border: '1px solid var(--border-color)',
                        maxWidth: '280px',
                        backgroundColor: 'var(--bg-secondary)',
                      }}
                    >
                      <ChatMediaImage
                        src={msg.mediaUrl}
                        alt="Sent media"
                        isUploading={msg.isUploading}
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: '10px 16px',
                        borderRadius: '22px',
                        fontSize: '14.5px',
                        lineHeight: 1.4,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        color: isMine ? '#ffffff' : 'var(--text-primary)',
                        background: isMine
                          ? '#0095f6'
                          : 'var(--border-subtle)',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                      }}
                    >
                      {msg.text}
                    </div>
                  )}

                  {/* Reaction badge */}
                  {hasReaction && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '-8px',
                        right: isMine ? '4px' : '-8px',
                        backgroundColor: 'var(--bg-elevated)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        padding: '1px 6px',
                        fontSize: '11px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                      }}
                    >
                      {msg.reactions.join('')}
                    </span>
                  )}
                </div>
              </div>

              {/* Status / time under the last message */}
              {index === messages.length - 1 && isMine && (
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', marginRight: '4px' }}>
                  {msg.is_read ? '읽음' : '전송됨'}
                </span>
              )}
            </div>
          );
        })}

        {/* Simulated Typing Indicator */}
        {isPartnerTyping && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', alignSelf: 'flex-start', marginTop: '4px' }}>
            <Avatar src={partner.profile_image_url} size="xs" />
            <div
              style={{
                backgroundColor: 'var(--border-subtle)',
                padding: '10px 16px',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <div className="typing-dot" style={{ animationDelay: '0ms' }} />
              <div className="typing-dot" style={{ animationDelay: '180ms' }} />
              <div className="typing-dot" style={{ animationDelay: '360ms' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Emoji Picker Bar if open */}
      {showEmojiPicker && (
        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: 'var(--bg-elevated)',
            borderTop: '1px solid var(--border-color)',
            overflowX: 'auto',
          }}
          className="no-scrollbar"
        >
          {quickEmojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                setInputText(prev => prev + emoji);
              }}
              style={{ fontSize: '20px', padding: '4px 6px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Input Message Bar */}
      <div style={{ padding: '14px 16px' }}>
        {/* Hidden File Input outside form */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          style={{ display: 'none' }}
          accept="image/*"
        />

        <form
          onSubmit={handleSend}
          autoComplete="off"
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '24px',
            padding: '4px 12px',
            gap: '8px',
          }}
        >
          {/* Emoji Toggle */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(prev => !prev)}
            style={{ color: 'var(--text-primary)', background: 'transparent', border: 'none', padding: '6px', cursor: 'pointer' }}
            aria-label="Insert Emoji"
          >
            <Smile size={24} />
          </button>

          {/* Text Input */}
          <input
            type="text"
            name="dm_message_text"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            data-lpignore="true"
            data-form-type="other"
            placeholder="메시지 보내기..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '14.5px',
              color: 'var(--text-primary)',
              outline: 'none',
              padding: '8px 0',
              fontFamily: 'inherit',
            }}
          />

          {/* Image Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{ color: 'var(--text-primary)', background: 'transparent', border: 'none', padding: '6px', cursor: 'pointer' }}
            aria-label="Attach Photo"
          >
            <ImageIcon size={22} />
          </button>

          {/* Right Action: Heart or Send */}
          {inputText.trim() ? (
            <button
              type="submit"
              style={{
                color: '#0095f6',
                background: 'transparent',
                border: 'none',
                fontWeight: 700,
                fontSize: '14px',
                padding: '6px 8px',
                cursor: 'pointer',
              }}
            >
              보내기
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSendHeart}
              style={{ color: 'var(--text-primary)', background: 'transparent', border: 'none', padding: '6px', cursor: 'pointer' }}
              aria-label="Send Heart"
            >
              <Heart size={22} />
            </button>
          )}
        </form>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .typing-dot {
          width: 6px;
          height: 6px;
          background-color: var(--text-secondary);
          border-radius: 50%;
          animation: typingPulse 1.2s infinite ease-in-out;
        }
        @keyframes typingPulse {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
        @media (max-width: 768px) {
          .mobile-back-btn {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
};
