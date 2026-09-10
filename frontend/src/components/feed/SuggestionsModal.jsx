import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Avatar } from '../common/Avatar';
import { Button } from '../common/Button';
import { NavLink } from 'react-router-dom';
import { userApi, followApi } from '../../services';
import { useModal } from '../../contexts/ModalContext';
import { useAuthGuard } from '../../hooks/useAuthGuard';

export const SuggestionsModal = ({ isOpen, onClose }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [followingMap, setFollowingMap] = useState({});

  const { fetchFeed, fetchStories } = useModal();
  const { requireAuth } = useAuthGuard();

  useEffect(() => {
    if (!isOpen) return;

    const loadMoreSuggestions = async () => {
      setLoading(true);
      try {
        // limit=30 으로 팔로우하지 않은 더 많은 사용자 조회
        const data = await userApi.getSuggestions(30);
        setSuggestions(data || []);
      } catch (err) {
        console.error('Failed to load suggestions:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMoreSuggestions();
  }, [isOpen]);

  const handleToggleFollow = async (userId) => {
    requireAuth(async () => {
      const current = !!followingMap[userId];
      setFollowingMap(prev => ({
        ...prev,
        [userId]: !current
      }));

      try {
        const res = await followApi.toggleFollow(userId);
        setFollowingMap(prev => ({
          ...prev,
          [userId]: res.following
        }));

        // 팔로우 즉시 홈 피드와 스토리 실시간 새로고침!
        await fetchFeed();
        await fetchStories();
      } catch (err) {
        console.error('Failed to toggle follow:', err);
        setFollowingMap(prev => ({
          ...prev,
          [userId]: current
        }));
      }
    }, { actionType: 'follow' });
  };

  const filteredSuggestions = suggestions.filter(u => {
    const q = searchQuery.toLowerCase();
    return (
      u.username?.toLowerCase().includes(q) ||
      u.full_name?.toLowerCase().includes(q)
    );
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="추천" maxWidth="440px">
      <div style={{ display: 'flex', flexDirection: 'column', height: '480px' }}>
        {/* Search Bar */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '8px',
              padding: '8px 12px',
              gap: '8px',
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
                background: 'transparent',
                outline: 'none',
                fontSize: '14px',
                color: 'var(--text-primary)',
                width: '100%',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <X size={14} color="var(--text-secondary)" />
              </button>
            )}
          </div>
        </div>

        {/* User List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {loading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
              추천 사용자를 불러오는 중...
            </div>
          ) : filteredSuggestions.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
              {searchQuery ? '검색 결과가 없습니다.' : '추천할 사용자가 없습니다.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredSuggestions.map((user) => {
                const isFollowing = !!followingMap[user.id];

                return (
                  <div
                    key={user.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <NavLink to={`/${user.username}`} onClick={onClose}>
                        <Avatar src={user.profile_image_url} size="md" />
                      </NavLink>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <NavLink
                          to={`/${user.username}`}
                          onClick={onClose}
                          style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            textDecoration: 'none',
                            lineHeight: 1.2,
                          }}
                        >
                          {user.username}
                        </NavLink>
                        <span
                          style={{
                            fontSize: '13px',
                            color: 'var(--text-secondary)',
                            marginTop: '2px',
                          }}
                        >
                          {user.full_name || '회원님을 위한 추천'}
                        </span>
                      </div>
                    </div>

                    <Button
                      variant={isFollowing ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={() => handleToggleFollow(user.id)}
                      style={{
                        minWidth: '76px',
                        padding: '6px 12px',
                        fontSize: '13px',
                        fontWeight: 600,
                      }}
                    >
                      {isFollowing ? '팔로잉' : '팔로우'}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default SuggestionsModal;
