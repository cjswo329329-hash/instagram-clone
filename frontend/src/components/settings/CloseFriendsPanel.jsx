import React, { useState, useMemo } from 'react';
import { Star, Search, X, Check } from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { Button } from '../common/Button';
import { useAuth } from '../../contexts/AuthContext';

export const CloseFriendsPanel = ({ showToast }) => {
  const { allUsers, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Close friends user IDs set
  const [closeFriends, setCloseFriends] = useState(() => {
    const saved = localStorage.getItem('ig_close_friends');
    return saved ? JSON.parse(saved) : [2, 3]; // Default mock close friends
  });

  const followers = useMemo(() => {
    return allUsers.filter(u => u.username !== user?.username);
  }, [allUsers, user]);

  const filteredUsers = followers.filter(u => {
    const q = searchQuery.toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      (u.full_name && u.full_name.toLowerCase().includes(q))
    );
  });

  const handleToggle = (userId) => {
    setCloseFriends(prev => {
      const next = prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId];
      return next;
    });
  };

  const handleClearAll = () => {
    setCloseFriends([]);
  };

  const handleSave = () => {
    localStorage.setItem('ig_close_friends', JSON.stringify(closeFriends));
    showToast(`친한 친구 ${closeFriends.length}명이 저장되었습니다.`);
  };

  return (
    <div style={{ maxWidth: '600px' }}>
      {/* Signature Close Friends Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#00ba34',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
            boxShadow: '0 4px 16px rgba(0, 186, 52, 0.3)',
            color: '#ffffff',
          }}
        >
          <Star size={30} fill="#ffffff" />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>
          친한 친구
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: '440px', margin: '0 auto' }}>
          스토리를 공유할 때 친한 친구로 지정된 사람들에게만 공개할 수 있습니다. 친한 친구 목록은 회원님만 볼 수 있으며 누구에게도 알림이 가지 않습니다.
        </p>
      </div>

      {/* Action Subbar: Search & Selected count */}
      <div style={{ marginBottom: '16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--bg-secondary)',
            padding: '10px 14px',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            marginBottom: '12px',
          }}
        >
          <Search size={16} color="var(--text-secondary)" />
          <input
            type="text"
            placeholder="친구 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: 'none',
              backgroundColor: 'transparent',
              fontSize: '14px',
              width: '100%',
              color: 'var(--text-primary)',
            }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <X size={14} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {closeFriends.length}명 선택됨
          </span>
          {closeFriends.length > 0 && (
            <button
              onClick={handleClearAll}
              style={{ color: 'var(--ig-primary-button)', fontWeight: 600, cursor: 'pointer' }}
            >
              모두 선택 해제
            </button>
          )}
        </div>
      </div>

      {/* Followers Checklist */}
      <div
        style={{
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          maxHeight: '380px',
          overflowY: 'auto',
          padding: '8px 12px',
          backgroundColor: 'var(--bg-primary)',
          marginBottom: '20px',
        }}
        className="no-scrollbar"
      >
        {filteredUsers.map((u) => {
          const isSelected = closeFriends.includes(u.id);

          return (
            <div
              key={u.id}
              onClick={() => handleToggle(u.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 8px',
                cursor: 'pointer',
                borderRadius: '8px',
                transition: 'background 0.15s ease',
              }}
              className="nav-item-hover"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Avatar src={u.profile_image_url} size="md" alt={u.username} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                    {u.username}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {u.full_name}
                  </div>
                </div>
              </div>

              {/* Green Circle Checkbox */}
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: isSelected ? 'none' : '2px solid var(--border-color)',
                  backgroundColor: isSelected ? '#00ba34' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  transition: 'all 0.15s ease',
                }}
              >
                {isSelected && <Check size={16} strokeWidth={3} />}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="primary" size="md" onClick={handleSave} style={{ minWidth: '100px', fontWeight: 600 }}>
          완료
        </Button>
      </div>
    </div>
  );
};
