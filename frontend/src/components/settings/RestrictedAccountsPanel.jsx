import React, { useState } from 'react';
import { ShieldAlert, Search, X, Check, EyeOff, MessageSquare } from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { Button } from '../common/Button';
import { useAuth } from '../../contexts/AuthContext';

export const RestrictedAccountsPanel = ({ showToast }) => {
  const { allUsers, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const [restrictedUsers, setRestrictedUsers] = useState(() => {
    const saved = localStorage.getItem('ig_restricted_users');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [
      { id: 981, username: 'loud_critic', full_name: '비판 계정', profile_image_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150' },
    ];
  });

  const handleUnrestrict = (userId) => {
    setRestrictedUsers(prev => {
      const updated = prev.filter(u => u.id !== userId);
      localStorage.setItem('ig_restricted_users', JSON.stringify(updated));
      return updated;
    });
    showToast('해당 계정의 제한이 해제되었습니다.');
  };

  const handleRestrictUser = (targetUser) => {
    if (!restrictedUsers.some(u => u.id === targetUser.id)) {
      setRestrictedUsers(prev => {
        const updated = [...prev, targetUser];
        localStorage.setItem('ig_restricted_users', JSON.stringify(updated));
        return updated;
      });
      setSearchQuery('');
      showToast(`${targetUser.username}님이 제한되었습니다.`);
    }
  };

  const searchResults = searchQuery.trim()
    ? allUsers.filter(u =>
        u.username !== user?.username &&
        !restrictedUsers.some(ru => ru.id === u.id) &&
        (u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
         (u.full_name && u.full_name.toLowerCase().includes(searchQuery.toLowerCase())))
      )
    : [];

  return (
    <div style={{ maxWidth: '600px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>
          제한된 계정
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          차단하지 않고 원치 않는 상호작용으로부터 자신을 조용하게 보호할 수 있습니다.
        </p>
      </div>

      {/* Guide Info Card */}
      <div
        style={{
          padding: '18px 20px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '14px',
          border: '1px solid var(--border-subtle)',
          marginBottom: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <EyeOff size={18} color="var(--ig-primary-button)" style={{ marginTop: '2px', flexShrink: 0 }} />
          <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
            상대방이 남긴 새로운 댓글은 본인과 상대방에게만 보입니다. 회원님이 승인할 때만 다른 사람에게 공개됩니다.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <MessageSquare size={18} color="var(--ig-primary-button)" style={{ marginTop: '2px', flexShrink: 0 }} />
          <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
            상대방의 Direct 메시지는 메시지 요청함으로 이동하며, 회원님이 메시지를 읽었거나 온라인 상태인지를 볼 수 없습니다.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <ShieldAlert size={18} color="var(--ig-primary-button)" style={{ marginTop: '2px', flexShrink: 0 }} />
          <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
            상대방은 자신이 제한되었다는 사실을 전혀 알 수 없습니다.
          </div>
        </div>
      </div>

      {/* Search to Restrict */}
      <div style={{ marginBottom: '20px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--bg-secondary)',
            padding: '10px 14px',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
          }}
        >
          <Search size={16} color="var(--text-secondary)" />
          <input
            type="text"
            placeholder="제한할 계정 검색"
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

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div
            style={{
              marginTop: '6px',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              maxHeight: '200px',
              overflowY: 'auto',
              padding: '6px',
            }}
          >
            {searchResults.map(su => (
              <div
                key={su.id}
                onClick={() => handleRestrictUser(su)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
                className="nav-item-hover"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Avatar src={su.profile_image_url} size="sm" />
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{su.username}</span>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--ig-primary-button)', fontWeight: 600 }}>
                  제한
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Restricted Accounts List */}
      <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>
        제한된 사용자 ({restrictedUsers.length})
      </div>

      {restrictedUsers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
          <p style={{ fontSize: '14px' }}>제한된 계정이 없습니다.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {restrictedUsers.map(ru => (
            <div
              key={ru.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Avatar src={ru.profile_image_url} size="md" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{ru.username}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{ru.full_name}</div>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleUnrestrict(ru.id)}
                style={{ padding: '6px 14px', fontSize: '13px' }}
              >
                제한 해제
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
