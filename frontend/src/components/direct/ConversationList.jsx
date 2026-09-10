import React, { useState, useEffect } from 'react';
import { SquarePen, ChevronDown, Search, BellOff, UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { userApi, followApi } from '../../services';
import { Avatar } from '../common/Avatar';
import { Button } from '../common/Button';

export const ConversationList = ({
  conversations = [],
  activeConversationId,
  onSelectConversation,
  onOpenNewMessage,
  onSelectUser,
}) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [noteText, setNoteText] = useState('지금 빠져 있는 것...');
  const [isEditingNote, setIsEditingNote] = useState(false);

  // Suggested accounts state
  const [suggestions, setSuggestions] = useState([]);
  const [followingMap, setFollowingMap] = useState({});
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Load suggestions from backend
  useEffect(() => {
    const loadSuggestions = async () => {
      setLoadingSuggestions(true);
      try {
        const data = await userApi.getSuggestions(10);
        if (data && Array.isArray(data)) {
          setSuggestions(data);
        }
      } catch (err) {
        console.warn('Failed to load suggestions in conversation list:', err);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    if (user) {
      loadSuggestions();
    }
  }, [user]);

  // Handle follow / unfollow toggle
  const handleToggleFollow = async (e, targetUserId) => {
    e.stopPropagation();
    const current = !!followingMap[targetUserId];
    setFollowingMap((prev) => ({
      ...prev,
      [targetUserId]: !current,
    }));

    try {
      const res = await followApi.toggleFollow(targetUserId);
      setFollowingMap((prev) => ({
        ...prev,
        [targetUserId]: res.following,
      }));
    } catch (err) {
      console.error('Failed to toggle follow in conversation list:', err);
      // Rollback
      setFollowingMap((prev) => ({
        ...prev,
        [targetUserId]: current,
      }));
    }
  };

  // Filter conversations by search input
  const filteredConversations = (conversations || []).filter((conv) => {
    if (!conv) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const partner = conv.partner || {};
    const usernameMatch = (partner.username || '').toLowerCase().includes(q);
    const fullNameMatch = (partner.full_name || partner.fullName || '').toLowerCase().includes(q);
    const messages = conv.messages || [];
    const lastMsg = messages[messages.length - 1];
    const msgMatch = lastMsg?.text?.toLowerCase().includes(q);
    return usernameMatch || fullNameMatch || msgMatch;
  });

  // Filter suggested users by search input
  const filteredSuggestions = (suggestions || []).filter((sUser) => {
    if (!sUser) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const usernameMatch = (sUser.username || '').toLowerCase().includes(q);
    const fullNameMatch = (sUser.full_name || '').toLowerCase().includes(q);
    return usernameMatch || fullNameMatch;
  });

  const usernameToDisplay = user?.username || 'kzee329';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-primary)',
        borderRight: '1px solid var(--border-color)',
        overflow: 'hidden',
      }}
      className="conversation-list-pane"
    >
      {/* 1. Header: Username + ChevronDown, and Compose (SquarePen) Icon */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 20px 12px 20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            userSelect: 'none',
          }}
          title="계정 전환"
        >
          <span
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.3px',
            }}
          >
            {usernameToDisplay}
          </span>
          <ChevronDown size={18} color="var(--text-primary)" strokeWidth={2.5} />
        </div>

        <button
          onClick={onOpenNewMessage}
          style={{
            color: 'var(--text-primary)',
            background: 'transparent',
            border: 'none',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            borderRadius: '50%',
            transition: 'opacity 0.2s',
          }}
          aria-label="New Message"
          className="hover-opacity"
        >
          <SquarePen size={24} strokeWidth={1.8} />
        </button>
      </div>

      {/* 2. Search Input */}
      <div style={{ padding: '0 20px 12px 20px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--border-subtle)',
            borderRadius: '12px',
            padding: '8px 14px',
            gap: '10px',
          }}
        >
          <Search size={16} color="var(--text-muted)" strokeWidth={2.2} />
          <input
            type="text"
            placeholder="검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              backgroundColor: 'transparent',
              outline: 'none',
              fontSize: '14px',
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
            }}
          />
        </div>
      </div>

      {/* 3. Notes Section ("내 메모") */}
      <div
        style={{
          padding: '4px 20px 16px 20px',
          display: 'flex',
          alignItems: 'flex-start',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'pointer',
            width: '84px',
          }}
          onClick={() => setIsEditingNote((prev) => !prev)}
        >
          {/* Thought Bubble */}
          <div
            style={{
              position: 'relative',
              backgroundColor: 'var(--bg-elevated)',
              borderRadius: '16px',
              padding: '6px 12px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              border: '1px solid rgba(0,0,0,0.06)',
              marginBottom: '8px',
              maxWidth: '92px',
              textAlign: 'center',
            }}
          >
            {isEditingNote ? (
              <input
                type="text"
                autoFocus
                defaultValue={noteText}
                onBlur={(e) => {
                  setNoteText(e.target.value || '지금 빠져 있는 것...');
                  setIsEditingNote(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setNoteText(e.target.value || '지금 빠져 있는 것...');
                    setIsEditingNote(false);
                  }
                }}
                style={{
                  width: '70px',
                  border: 'none',
                  outline: 'none',
                  fontSize: '11px',
                  textAlign: 'center',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                }}
              />
            ) : (
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.25,
                  display: 'block',
                  wordBreak: 'keep-all',
                }}
              >
                {noteText}
              </span>
            )}

            {/* Downward Pointer */}
            <div
              style={{
                position: 'absolute',
                bottom: '-5px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderTop: '6px solid var(--bg-elevated)',
              }}
            />
          </div>

          {/* User Avatar */}
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              backgroundColor: '#e4e6eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {user?.profile_image_url ? (
              <img
                src={user.profile_image_url}
                alt="My Note Avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="#8e8e8e"
                style={{ marginTop: '8px' }}
              >
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            )}
          </div>

          {/* Label Below Avatar */}
          <span
            style={{
              fontSize: '12px',
              color: 'var(--text-primary)',
              marginTop: '5px',
              textAlign: 'center',
            }}
          >
            내 메모
          </span>
        </div>
      </div>

      {/* 4. Scrollable Container: Messages (Chat Rooms) + Suggested Accounts */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingBottom: '24px',
        }}
        className="custom-dm-scrollbar"
      >
        {/* Section Header: 메시지 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 20px 10px 20px',
          }}
        >
          <span
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            메시지
          </span>

          <button
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            onClick={() => alert('메시지 요청이 없습니다.')}
          >
            요청
          </button>
        </div>

        {/* Conversation Items List */}
        {filteredConversations.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '24px 20px',
              color: 'var(--text-secondary)',
            }}
          >
            <p style={{ fontSize: '13.5px' }}>
              {searchQuery ? '일치하는 메시지가 없습니다.' : '진행 중인 대화가 없습니다.'}
            </p>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isSelected = conv.id === activeConversationId;
            const partner = conv.partner || {};
            const messages = conv.messages || [];
            const lastMsg = messages[messages.length - 1];
            const isPartner = partner.id != null && String(lastMsg?.sender_id) === String(partner.id);
            const isMine = partner.id != null
              ? !isPartner
              : (user?.id != null ? String(lastMsg?.sender_id) === String(user.id) : false);

            let snippet = '';
            if (messages.length > 0) {
              if (lastMsg?.mediaUrl) {
                snippet = isMine ? '회원님이 사진을 보냈습니다.' : `${partner.username || '상대방'}님이 사진을 보냈습니다.`;
              } else if (isMine) {
                snippet = `회원님: ${lastMsg?.text || ''}`;
              } else {
                snippet = lastMsg?.text || '';
              }
            } else {
              snippet = '새 대화를 시작해보세요.';
            }

            const timeAgo = conv.time_ago || lastMsg?.created_at || '';

            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 20px',
                  gap: '14px',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? 'var(--border-subtle)' : 'transparent',
                  transition: 'background var(--transition-fast)',
                }}
                className="conv-item-row"
              >
                {/* Avatar */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  {partner.has_story ? (
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2px',
                      }}
                    >
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: '50%',
                          border: '2px solid var(--bg-primary)',
                          overflow: 'hidden',
                          backgroundColor: '#efefef',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {partner.profile_image_url ? (
                          <img
                            src={partner.profile_image_url}
                            alt={partner.username}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <svg width="30" height="30" viewBox="0 0 24 24" fill="#8e8e8e">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                          </svg>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        width: '54px',
                        height: '54px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        backgroundColor: '#efefef',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {partner.profile_image_url ? (
                        <img
                          src={partner.profile_image_url}
                          alt={partner.username}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="#8e8e8e" style={{ marginTop: '4px' }}>
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      )}
                    </div>
                  )}
                </div>

                {/* Partner Username & Last Message */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginBottom: '2px',
                    }}
                  >
                    {partner.username}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '12.5px',
                      color: 'var(--text-secondary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {snippet}
                    </span>
                    {timeAgo && (
                      <span style={{ flexShrink: 0, marginLeft: '4px' }}>
                        · {timeAgo}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right side: Mute icon / Unread badge */}
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {partner.is_muted && (
                    <BellOff size={16} color="var(--text-muted)" strokeWidth={1.8} />
                  )}
                  {conv.unread_count > 0 && (
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#0095f6',
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* 5. Section: 팔로우할 만한 계정 (Suggested Accounts to Follow) */}
        <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 20px 12px 20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UserPlus size={16} color="var(--text-primary)" strokeWidth={2.2} />
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                }}
              >
                팔로우할 만한 계정
              </span>
            </div>
            <span
              style={{
                fontSize: '12.5px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
              }}
            >
              추천
            </span>
          </div>

          {loadingSuggestions ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
              추천 계정을 불러오는 중...
            </div>
          ) : filteredSuggestions.length === 0 ? (
            <div style={{ padding: '16px 20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
              {searchQuery ? '일치하는 추천 계정이 없습니다.' : '추천 계정이 없습니다.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredSuggestions.map((sUser) => {
                const isFollowing = !!followingMap[sUser.id];

                return (
                  <div
                    key={sUser.id}
                    onClick={() => onSelectUser && onSelectUser(sUser)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 20px',
                      cursor: 'pointer',
                      transition: 'background var(--transition-fast)',
                    }}
                    className="conv-item-row"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                      <Avatar src={sUser.profile_image_url} size="md" />
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span
                            style={{
                              fontSize: '14px',
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {sUser.username}
                          </span>
                          {sUser.is_verified && (
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
                                flexShrink: 0,
                              }}
                            >
                              ✓
                            </span>
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            marginTop: '1px',
                          }}
                        >
                          {sUser.full_name || '회원님을 위한 추천'}
                        </span>
                      </div>
                    </div>

                    <div style={{ flexShrink: 0, marginLeft: '12px' }}>
                      <Button
                        variant={isFollowing ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={(e) => handleToggleFollow(e, sUser.id)}
                        style={{
                          minWidth: '68px',
                          padding: '5px 12px',
                          fontSize: '12.5px',
                          fontWeight: 600,
                          borderRadius: '8px',
                        }}
                      >
                        {isFollowing ? '팔로잉' : '팔로우'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .conv-item-row:hover {
          background-color: var(--border-subtle) !important;
        }
        .hover-opacity:hover {
          opacity: 0.7;
        }
        .custom-dm-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-dm-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }
        [data-theme='dark'] .custom-dm-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
};
