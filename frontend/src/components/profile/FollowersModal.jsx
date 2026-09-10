import React, { useState, useEffect, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Avatar } from '../common/Avatar';
import { Button } from '../common/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { followApi } from '../../services';

export const FollowersModal = ({
  isOpen,
  onClose,
  initialTab = 'followers', // 'followers' or 'following'
  profileUser,
  isMe = false,
  onFollowChange,
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const { allUsers } = useAuth();
  const navigate = useNavigate();

  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [followersCount, setFollowersCount] = useState(profileUser?.followers_count || 0);
  const [followingCount, setFollowingCount] = useState(profileUser?.following_count || 0);
  const [followingMap, setFollowingMap] = useState({});
  const [pendingRequests, setPendingRequests] = useState([]);
  const [processingIds, setProcessingIds] = useState(new Set());
  const [hasChanged, setHasChanged] = useState(false);

  // Sync tab when initialTab changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setSearchQuery('');
      setHasChanged(false);
      if (profileUser) {
        if (typeof profileUser.followers_count === 'number') {
          setFollowersCount(profileUser.followers_count);
        }
        if (typeof profileUser.following_count === 'number') {
          setFollowingCount(profileUser.following_count);
        }
      }
    }
  }, [isOpen, initialTab, profileUser?.id]);

  // Load followers and following data when modal opens
  useEffect(() => {
    if (!isOpen || !profileUser?.id) return;

    let isCancelled = false;

    const loadFollowData = async () => {
      try {
        const [fllwers, fllwing] = await Promise.all([
          followApi.getFollowers(profileUser.id),
          followApi.getFollowing(profileUser.id)
        ]);
        if (isCancelled) return;

        const followers = fllwers || [];
        const following = fllwing || [];
        setFollowersList(followers);
        setFollowingList(following);

        // Load real follow requests if own account and private
        if (isMe && profileUser?.is_private) {
          try {
            const reqs = await followApi.getFollowRequests();
            if (!isCancelled) setPendingRequests(reqs || []);
          } catch (err) {
            console.warn('Failed to load pending follow requests:', err);
            if (!isCancelled) setPendingRequests([]);
          }
        } else {
          setPendingRequests([]);
        }

        // 동기화된 카운트 설정
        setFollowersCount(followers.length);
        setFollowingCount(following.length);

        // 초기 팔로우 상태 맵 구성
        const initialMap = {};
        following.forEach(u => {
          initialMap[u.id] = isMe ? true : !!(u.is_following ?? u.isFollowing);
        });
        followers.forEach(u => {
          if (initialMap[u.id] === undefined) {
            initialMap[u.id] = !!(u.is_following ?? u.isFollowing);
          }
        });
        setFollowingMap(initialMap);
      } catch (err) {
        if (isCancelled) return;
        console.error('Failed to load followers/following from backend, fallback to mock:', err);
        const fallbackFollowers = allUsers.filter(u => u.username !== profileUser?.username).slice(0, 10);
        const fallbackFollowing = allUsers.filter(u => u.username !== profileUser?.username).slice(0, 8);
        setFollowersList(fallbackFollowers);
        setFollowingList(fallbackFollowing);
        setFollowersCount(fallbackFollowers.length);
        setFollowingCount(fallbackFollowing.length);
      }
    };

    loadFollowData();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, profileUser?.id, isMe, profileUser?.is_private]);

  const handleAcceptRequest = async (reqId) => {
    if (processingIds.has(reqId)) return;
    setProcessingIds(prev => new Set(prev).add(reqId));

    const acceptedUser = pendingRequests.find(r => r.id === reqId);
    setPendingRequests(prev => prev.filter(r => r.id !== reqId));
    const nextFollowers = followersCount + 1;
    setFollowersCount(nextFollowers);
    setHasChanged(true);

    if (acceptedUser) {
      setFollowersList(prev => [acceptedUser, ...prev]);
    }

    if (onFollowChange) {
      onFollowChange({ type: 'accept_request', userId: reqId, followersCount: nextFollowers });
    }

    try {
      const res = await followApi.acceptFollowRequest(reqId);
      if (typeof res?.my_followers_count === 'number') {
        setFollowersCount(res.my_followers_count);
        if (onFollowChange) {
          onFollowChange({ type: 'accept_request', userId: reqId, followersCount: res.my_followers_count });
        }
      }
    } catch (err) {
      console.error('Failed to accept follow request on server:', err);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(reqId);
        return next;
      });
    }
  };

  const handleRejectRequest = async (reqId) => {
    if (processingIds.has(reqId)) return;
    setProcessingIds(prev => new Set(prev).add(reqId));

    setPendingRequests(prev => prev.filter(r => r.id !== reqId));
    try {
      await followApi.rejectFollowRequest(reqId);
    } catch (err) {
      console.error('Failed to reject follow request on server:', err);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(reqId);
        return next;
      });
    }
  };

  const handleToggleFollow = async (userId) => {
    if (processingIds.has(userId)) return;

    const current = followingMap[userId] !== undefined
      ? followingMap[userId]
      : (activeTab === 'following' && isMe ? true : false);

    const nextState = !current;

    // 1. 즉각적인 낙관적 UI 업데이트
    setFollowingMap(prev => ({
      ...prev,
      [userId]: nextState
    }));
    setHasChanged(true);

    let optFollowingCount = followingCount;
    let optFollowersCount = followersCount;

    if (isMe) {
      optFollowingCount = Math.max(0, followingCount + (nextState ? 1 : -1));
      setFollowingCount(optFollowingCount);
    } else if (userId === profileUser?.id) {
      optFollowersCount = Math.max(0, followersCount + (nextState ? 1 : -1));
      setFollowersCount(optFollowersCount);
    }

    // 2. 부모(ProfileHeader)에 즉각 수치 전달 (네트워크 지연/버벅임 제로)
    if (onFollowChange) {
      onFollowChange({
        type: 'toggle_follow',
        userId,
        following: nextState,
        followingCount: isMe ? optFollowingCount : undefined,
        followersCount: (userId === profileUser?.id && !isMe) ? optFollowersCount : undefined,
      });
    }

    // 3. 중복 클릭 방지 락
    setProcessingIds(prev => new Set(prev).add(userId));

    try {
      const res = await followApi.toggleFollow(userId);
      const serverFollowing = res.following;
      setFollowingMap(prev => ({
        ...prev,
        [userId]: serverFollowing
      }));

      // 서버 응답 수치가 있으면 정확히 동기화
      if (typeof res.current_following_count === 'number' && isMe) {
        setFollowingCount(res.current_following_count);
        if (onFollowChange) {
          onFollowChange({
            type: 'toggle_follow',
            userId,
            following: serverFollowing,
            followingCount: res.current_following_count,
          });
        }
      }
      if (typeof res.target_followers_count === 'number' && userId === profileUser?.id && !isMe) {
        setFollowersCount(res.target_followers_count);
        if (onFollowChange) {
          onFollowChange({
            type: 'toggle_follow',
            userId,
            following: serverFollowing,
            followersCount: res.target_followers_count,
          });
        }
      }
    } catch (err) {
      console.error('Follow toggle error:', err);
      // 롤백
      setFollowingMap(prev => ({
        ...prev,
        [userId]: current
      }));
      if (isMe) {
        setFollowingCount(followingCount);
      } else if (userId === profileUser?.id) {
        setFollowersCount(followersCount);
      }
      if (onFollowChange) {
        onFollowChange({
          type: 'toggle_follow',
          userId,
          following: current,
          followingCount: isMe ? followingCount : undefined,
          followersCount: (userId === profileUser?.id && !isMe) ? followersCount : undefined,
        });
      }
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const handleRemoveFollower = async (userId) => {
    if (processingIds.has(userId)) return;

    // 1. 낙관적 UI 즉각 삭제 및 카운트 차감 (0ms 반응)
    const removedUser = followersList.find(u => u.id === userId);
    setFollowersList(prev => prev.filter(u => u.id !== userId));
    const nextCount = Math.max(0, followersCount - 1);
    setFollowersCount(nextCount);
    setHasChanged(true);

    // 2. 부모(ProfileHeader)에 즉각 수치 전달
    if (onFollowChange) {
      onFollowChange({
        type: 'remove_follower',
        userId,
        followersCount: nextCount
      });
    }

    // 3. 중복 클릭 방지 락
    setProcessingIds(prev => new Set(prev).add(userId));

    // 4. 백엔드 API 호출
    try {
      const res = await followApi.removeFollower(userId);
      if (typeof res?.my_followers_count === 'number') {
        setFollowersCount(res.my_followers_count);
        if (onFollowChange) {
          onFollowChange({
            type: 'remove_follower',
            userId,
            followersCount: res.my_followers_count
          });
        }
      }
    } catch (err) {
      console.error('Failed to remove follower:', err);
      // 서버에서 이미 삭제된 경우(404)를 제외한 에러 시에만 롤백
      if (err.response?.status !== 404) {
        if (removedUser) {
          setFollowersList(prev => [removedUser, ...prev]);
        }
        setFollowersCount(prev => prev + 1);
        if (onFollowChange) {
          onFollowChange({
            type: 'remove_follower_revert',
            userId,
            followersCount: followersCount
          });
        }
      }
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const handleClose = () => {
    onClose();
    if (hasChanged && onFollowChange) {
      onFollowChange({ type: 'modal_closed' });
    }
  };

  const handleUserClick = (targetUsername) => {
    handleClose();
    navigate(`/${targetUsername}`);
  };

  // Memoized current and filtered list
  const currentList = useMemo(() => {
    if (activeTab === 'followers') return followersList;
    if (activeTab === 'following') return followingList;
    return pendingRequests;
  }, [activeTab, followersList, followingList, pendingRequests]);

  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return currentList;
    const q = searchQuery.toLowerCase().trim();
    return currentList.filter(u =>
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.full_name && u.full_name.toLowerCase().includes(q))
    );
  }, [currentList, searchQuery]);

  const isPrivateAccount = Boolean(profileUser?.is_private);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="420px"
      width="90%"
      showCloseButton={false}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '480px', maxHeight: '80vh' }}>
        {/* Header Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid var(--border-color)',
            padding: '0 8px',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', flex: 1, justifyContent: 'center' }}>
            <button
              onClick={() => setActiveTab('followers')}
              style={{
                flex: 1,
                padding: '14px 0',
                fontSize: '15px',
                fontWeight: activeTab === 'followers' ? 700 : 500,
                color: activeTab === 'followers' ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'followers' ? '2px solid var(--text-primary)' : '2px solid transparent',
                marginBottom: '-1px',
                cursor: 'pointer',
                transition: 'color 0.15s ease',
              }}
            >
              팔로워 {followersCount}
            </button>
            <button
              onClick={() => setActiveTab('following')}
              style={{
                flex: 1,
                padding: '14px 0',
                fontSize: '15px',
                fontWeight: activeTab === 'following' ? 700 : 500,
                color: activeTab === 'following' ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'following' ? '2px solid var(--text-primary)' : '2px solid transparent',
                marginBottom: '-1px',
                cursor: 'pointer',
                transition: 'color 0.15s ease',
              }}
            >
              팔로잉 {followingCount}
            </button>
            {isMe && isPrivateAccount && (
              <button
                onClick={() => setActiveTab('requests')}
                style={{
                  flex: 1,
                  padding: '14px 0',
                  fontSize: '15px',
                  fontWeight: activeTab === 'requests' ? 700 : 500,
                  color: activeTab === 'requests' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  borderBottom: activeTab === 'requests' ? '2px solid var(--text-primary)' : '2px solid transparent',
                  marginBottom: '-1px',
                  cursor: 'pointer',
                  transition: 'color 0.15s ease',
                }}
              >
                요청 {pendingRequests.length}
              </button>
            )}
          </div>
          <button
            onClick={handleClose}
            style={{
              position: 'absolute',
              right: '12px',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--bg-secondary)',
              padding: '8px 12px',
              borderRadius: '8px',
            }}
          >
            <Search size={16} color="var(--text-secondary)" />
            <input
              type="text"
              placeholder="검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                backgroundColor: 'transparent',
                fontSize: '14px',
                width: '100%',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Users List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px' }} className="no-scrollbar">
          {filteredList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
              <p style={{ fontSize: '14px' }}>검색 결과가 없습니다.</p>
            </div>
          ) : (
            filteredList.map((u) => {
              const isFollowing = followingMap[u.id] !== undefined
                ? followingMap[u.id]
                : (activeTab === 'following' && isMe ? true : !!(u.is_following ?? u.isFollowing));
              const isProcessing = processingIds.has(u.id);

              return (
                <div
                  key={u.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    gap: '12px',
                    opacity: isProcessing ? 0.7 : 1,
                    transition: 'opacity 0.15s ease',
                  }}
                >
                  {/* User info */}
                  <div
                    onClick={() => handleUserClick(u.username)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer',
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <Avatar src={u.profile_image_url} size="md" alt={u.username} />
                    <div style={{ overflow: 'hidden' }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: '14px',
                          color: 'var(--text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        <span>{u.username}</span>
                        {u.is_verified && (
                          <span style={{ color: 'var(--ig-primary-button)', fontSize: '12px' }}>●</span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: '13px',
                          color: 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {u.full_name}
                      </div>
                    </div>
                  </div>

                  {/* Action button */}
                  {activeTab === 'requests' ? (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={isProcessing}
                        onClick={() => handleAcceptRequest(u.id)}
                        style={{ padding: '6px 12px', fontSize: '13px' }}
                      >
                        수락
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={isProcessing}
                        onClick={() => handleRejectRequest(u.id)}
                        style={{ padding: '6px 12px', fontSize: '13px' }}
                      >
                        삭제
                      </Button>
                    </div>
                  ) : isMe && activeTab === 'followers' ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={isProcessing}
                      onClick={() => handleRemoveFollower(u.id)}
                      style={{ padding: '6px 14px', fontSize: '13px' }}
                    >
                      삭제
                    </Button>
                  ) : (
                    <Button
                      variant={isFollowing ? 'secondary' : 'primary'}
                      size="sm"
                      disabled={isProcessing}
                      onClick={() => handleToggleFollow(u.id)}
                      style={{ minWidth: '76px', padding: '6px 12px', fontSize: '13px' }}
                    >
                      {isFollowing ? '팔로잉' : '팔로우'}
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
};
