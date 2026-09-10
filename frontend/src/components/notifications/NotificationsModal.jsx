import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Check, Heart, MessageCircle, UserPlus, Film, ChevronRight, ArrowLeft } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Avatar } from '../common/Avatar';
import { Button } from '../common/Button';
import { notificationApi, followApi } from '../../services';

export const NotificationsModal = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showRequestsOnly, setShowRequestsOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      setLoading(true);
      const [notifsData, requestsData] = await Promise.allSettled([
        notificationApi.getNotifications(),
        followApi.getFollowRequests(),
      ]);

      if (notifsData.status === 'fulfilled') {
        setNotifications(notifsData.value || []);
      }
      if (requestsData.status === 'fulfilled') {
        setPendingRequests(requestsData.value || []);
      }
    } catch (err) {
      console.warn('Failed to load notifications data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setShowRequestsOnly(false);
      loadData();
    }
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleAcceptRequest = async (e, requesterId, notifId) => {
    e.stopPropagation();
    try {
      // 낙관적 UI 업데이트
      setNotifications(prev =>
        prev.map(n => {
          if ((n.sender_id === requesterId && n.type === 'follow_request') || (notifId && n.id === notifId)) {
            return {
              ...n,
              follow_request_status: 'accepted',
              followRequestStatus: 'accepted',
              is_read: true,
              isRead: true,
            };
          }
          return n;
        })
      );
      setPendingRequests(prev => prev.filter(r => r.id !== requesterId));

      const res = await followApi.acceptFollowRequest(requesterId);

      // 프로필 헤더 및 전역 팔로워 카운트 즉시 갱신 이벤트 트리거
      window.dispatchEvent(
        new CustomEvent('follow_request_accepted', {
          detail: { requesterId, myFollowersCount: res.my_followers_count },
        })
      );
    } catch (err) {
      console.error('Failed to accept follow request:', err);
      loadData();
    }
  };

  const handleRejectRequest = async (e, requesterId, notifId) => {
    e.stopPropagation();
    try {
      // 낙관적 UI 업데이트
      setNotifications(prev =>
        prev.map(n => {
          if ((n.sender_id === requesterId && n.type === 'follow_request') || (notifId && n.id === notifId)) {
            return {
              ...n,
              follow_request_status: 'rejected',
              followRequestStatus: 'rejected',
              is_read: true,
              isRead: true,
            };
          }
          return n;
        })
      );
      setPendingRequests(prev => prev.filter(r => r.id !== requesterId));

      await followApi.rejectFollowRequest(requesterId);

      window.dispatchEvent(
        new CustomEvent('follow_request_rejected', {
          detail: { requesterId },
        })
      );
    } catch (err) {
      console.error('Failed to reject follow request:', err);
      loadData();
    }
  };

  const handleToggleFollowBack = async (e, userId) => {
    e.stopPropagation();
    try {
      const res = await followApi.toggleFollow(userId);
      setNotifications(prev =>
        prev.map(n => {
          if (n.sender_id === userId) {
            return {
              ...n,
              sender: {
                ...n.sender,
                is_following: res.following,
                isFollowing: res.following,
              },
            };
          }
          return n;
        })
      );
      setPendingRequests(prev =>
        prev.map(r => (r.id === userId ? { ...r, is_following: res.following, isFollowing: res.following } : r))
      );
    } catch (err) {
      console.error('Failed to toggle follow back:', err);
    }
  };

  const handleClickItem = async (notif) => {
    try {
      if (!notif.is_read && !notif.isRead) {
        await notificationApi.markRead(notif.id);
        setNotifications(prev =>
          prev.map(n => (n.id === notif.id ? { ...n, is_read: true, isRead: true } : n))
        );
      }
      onClose();
      if (notif.sender?.username) {
        navigate(`/${notif.sender.username}`);
      }
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'like_post':
        return <Heart size={14} fill="#ed4956" color="#ed4956" />;
      case 'like_reel':
        return <Film size={14} color="#ed4956" />;
      case 'comment':
        return <MessageCircle size={14} color="#0095f6" />;
      case 'follow':
        return <UserPlus size={14} color="#10b981" />;
      case 'follow_request':
        return <UserPlus size={14} color="#0095f6" />;
      case 'follow_accept':
        return <Check size={14} color="#10b981" />;
      default:
        return <Heart size={14} color="#ed4956" />;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="480px"
      width="92%"
      showCloseButton={false}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '540px', maxHeight: '82vh' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          {showRequestsOnly ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setShowRequestsOnly(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '4px',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ArrowLeft size={20} />
              </button>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                팔로우 요청
              </h2>
            </div>
          ) : (
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              알림
            </h2>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {!showRequestsOnly && notifications.some(n => !n.is_read && !n.isRead) && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  fontSize: '12px',
                  color: 'var(--ig-primary-button)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                }}
              >
                모두 읽음
              </button>
            )}
            <button
              onClick={onClose}
              style={{ color: 'var(--text-primary)', cursor: 'pointer', background: 'none', border: 'none', padding: '4px' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px' }} className="no-scrollbar">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
              알림을 불러오는 중...
            </div>
          ) : showRequestsOnly ? (
            /* Follow Requests Only View */
            pendingRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
                <UserPlus size={44} strokeWidth={1.5} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
                <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  대기 중인 팔로우 요청이 없습니다
                </p>
                <p style={{ fontSize: '13px' }}>
                  비공개 계정일 때 새로운 팔로우 요청이 여기에 표시됩니다.
                </p>
              </div>
            ) : (
              pendingRequests.map(user => (
                <div
                  key={user.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 8px',
                    borderRadius: '8px',
                    marginBottom: '6px',
                  }}
                >
                  <div
                    onClick={() => {
                      onClose();
                      navigate(`/${user.username}`);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', minWidth: 0, flex: 1 }}
                  >
                    <Avatar src={user.profile_image_url || user.profileImageUrl} size="md" alt={user.username} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                        {user.username}
                      </p>
                      <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0 }}>
                        {user.full_name || user.fullName || '팔로우를 요청했습니다'}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <button
                      onClick={(e) => handleAcceptRequest(e, user.id)}
                      style={{
                        backgroundColor: 'var(--ig-primary-button)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 14px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      확인
                    </button>
                    <button
                      onClick={(e) => handleRejectRequest(e, user.id)}
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '6px 14px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))
            )
          ) : (
            /* Normal Notifications View */
            <>
              {/* Instagram Style Follow Requests Banner at Top */}
              {pendingRequests.length > 0 && (
                <div
                  onClick={() => setShowRequestsOnly(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    margin: '4px 0 10px 0',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s',
                  }}
                  className="hover:opacity-90"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--ig-primary-button)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                      }}
                    >
                      <UserPlus size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        팔로우 요청
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {pendingRequests[0]?.username}님 외 {pendingRequests.length > 1 ? `${pendingRequests.length - 1}명` : ''}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        backgroundColor: 'var(--ig-primary-button)',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 700,
                        borderRadius: '10px',
                        padding: '2px 8px',
                      }}
                    >
                      {pendingRequests.length}
                    </span>
                    <ChevronRight size={18} color="var(--text-secondary)" />
                  </div>
                </div>
              )}

              {/* Empty Notifications */}
              {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <Heart size={44} strokeWidth={1.5} color="var(--text-muted)" />
                  </div>
                  <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    새로운 알림이 없습니다
                  </p>
                  <p style={{ fontSize: '13px' }}>
                    다른 사용자가 회원님의 게시물을 좋아하거나 댓글을 달면 여기에 표시됩니다.
                  </p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const isUnread = !notif.is_read && !notif.isRead;
                  const sender = notif.sender || {};
                  const isFollowRequest = notif.type === 'follow_request';
                  const reqStatus = notif.follow_request_status || notif.followRequestStatus || 'pending';
                  const isFollowAccept = notif.type === 'follow_accept';

                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleClickItem(notif)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 8px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        backgroundColor: isUnread ? 'var(--bg-secondary)' : 'transparent',
                        transition: 'background-color 0.15s',
                        marginBottom: '4px',
                      }}
                      className="notification-item"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0, paddingRight: '8px' }}>
                        <div
                          style={{ position: 'relative', cursor: 'pointer' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (sender.username) {
                              onClose();
                              navigate(`/${sender.username}`);
                            }
                          }}
                        >
                          <Avatar
                            src={sender.profile_image_url || sender.profileImageUrl}
                            size="md"
                            alt={sender.username}
                          />
                          <div
                            style={{
                              position: 'absolute',
                              bottom: '-2px',
                              right: '-2px',
                              backgroundColor: 'var(--bg-elevated)',
                              borderRadius: '50%',
                              padding: '2px',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {getIcon(notif.type)}
                          </div>
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '13.5px', color: 'var(--text-primary)', lineHeight: 1.4, margin: 0 }}>
                            <strong
                              onClick={(e) => {
                                e.stopPropagation();
                                if (sender.username) {
                                  onClose();
                                  navigate(`/${sender.username}`);
                                }
                              }}
                              style={{ fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.15s ease' }}
                              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
                              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                            >
                              {sender.username}
                            </strong>{' '}
                            {notif.text_preview || notif.textPreview || '새로운 알림이 도착했습니다.'}
                          </p>
                        </div>
                      </div>

                      {/* Right Action Area */}
                      {isFollowRequest ? (
                        reqStatus === 'pending' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => handleAcceptRequest(e, notif.sender_id, notif.id)}
                              style={{
                                backgroundColor: 'var(--ig-primary-button)',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '6px 12px',
                                fontSize: '12.5px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              확인
                            </button>
                            <button
                              onClick={(e) => handleRejectRequest(e, notif.sender_id, notif.id)}
                              style={{
                                backgroundColor: 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                padding: '6px 12px',
                                fontSize: '12.5px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              삭제
                            </button>
                          </div>
                        ) : reqStatus === 'accepted' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => handleToggleFollowBack(e, notif.sender_id)}
                              style={{
                                backgroundColor: sender.is_following ? 'var(--bg-secondary)' : 'var(--ig-primary-button)',
                                color: sender.is_following ? 'var(--text-primary)' : '#ffffff',
                                border: sender.is_following ? '1px solid var(--border-color)' : 'none',
                                borderRadius: '8px',
                                padding: '6px 12px',
                                fontSize: '12.5px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              {sender.is_following ? '팔로잉' : '팔로우'}
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', flexShrink: 0 }}>
                            요청 삭제됨
                          </span>
                        )
                      ) : isFollowAccept ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleToggleFollowBack(e, notif.sender_id)}
                            style={{
                              backgroundColor: sender.is_following ? 'var(--bg-secondary)' : 'var(--ig-primary-button)',
                              color: sender.is_following ? 'var(--text-primary)' : '#ffffff',
                              border: sender.is_following ? '1px solid var(--border-color)' : 'none',
                              borderRadius: '8px',
                              padding: '6px 12px',
                              fontSize: '12.5px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            {sender.is_following ? '팔로잉' : '팔로우'}
                          </button>
                        </div>
                      ) : isUnread ? (
                        <div
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--ig-primary-button)',
                            marginLeft: '6px',
                            flexShrink: 0,
                          }}
                        />
                      ) : null}
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};
