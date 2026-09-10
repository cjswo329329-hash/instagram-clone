import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { userApi } from '../../services';

export const NewMessageModal = ({ isOpen, onClose, onSelectUser }) => {
  const { user, allUsers } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const results = await userApi.searchUsers(searchQuery.trim());
        setSearchResults(results || []);
      } catch (err) {
        console.warn('Backend user search failed, using local filter:', err);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (!isOpen) return null;

  // Combine searchResults with local allUsers
  const sourceUsers = searchResults.length > 0 ? searchResults : allUsers;
  const candidateUsers = sourceUsers.filter(u => {
    if (u.id === user?.id || u.username === user?.username) return false;
    if (searchResults.length > 0) return true;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.username?.toLowerCase().includes(q) ||
      u.full_name?.toLowerCase().includes(q)
    );
  });

  const handleStartChat = () => {
    if (!selectedUser) return;
    onSelectUser(selectedUser);
    onClose();
    setSelectedUser(null);
    setSearchQuery('');
  };

  const handleToggleUser = (candidate) => {
    if (selectedUser?.id === candidate.id) {
      setSelectedUser(null);
    } else {
      setSelectedUser(candidate);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '548px',
          backgroundColor: 'var(--bg-elevated)',
          borderRadius: '16px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25)',
          maxHeight: '580px',
          height: '520px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header: Centered "New message" and right "X" icon */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '46px',
            borderBottom: '1px solid var(--border-color)',
            flexShrink: 0,
          }}
        >
          <h3
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
              textAlign: 'center',
              letterSpacing: '-0.2px',
            }}
          >
            New message
          </h3>

          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              right: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-primary)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
            }}
            aria-label="Close"
          >
            <X size={20} strokeWidth={2.2} />
          </button>
        </div>

        {/* 2. Recipient / Search row: "받는 사람: 검색..." */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 18px',
            borderBottom: '1px solid var(--border-color)',
            gap: '8px',
            flexShrink: 0,
            flexWrap: 'wrap',
            minHeight: '48px',
          }}
        >
          <span
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
            }}
          >
            받는 사람:
          </span>

          {/* Selected user pill tag */}
          {selectedUser && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#e0f1ff',
                color: '#0095f6',
                padding: '3px 10px',
                borderRadius: '16px',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              <span>{selectedUser.full_name || selectedUser.username}</span>
              <button
                onClick={() => setSelectedUser(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#0095f6',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0,
                }}
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            </div>
          )}

          <input
            type="text"
            placeholder="검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            style={{
              flex: 1,
              minWidth: '80px',
              border: 'none',
              backgroundColor: 'transparent',
              fontSize: '14px',
              color: 'var(--text-primary)',
              outline: 'none',
              fontFamily: 'inherit',
              caretColor: 'var(--text-primary)',
            }}
          />
        </div>

        {/* 3. User Candidate List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px 12px',
          }}
          className="ig-modal-scroll"
        >
          {candidateUsers.length === 0 ? (
            <div
              style={{
                padding: '48px 16px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '14px',
              }}
            >
              계정을 찾을 수 없습니다.
            </div>
          ) : (
            candidateUsers.map((u) => {
              const isSelected = selectedUser?.id === u.id;

              return (
                <div
                  key={u.id}
                  onClick={() => handleToggleUser(u)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 14px',
                    margin: '2px 0',
                    cursor: 'pointer',
                    borderRadius: '10px',
                    backgroundColor: isSelected ? '#f3f3f3' : 'transparent',
                    transition: 'background-color var(--transition-fast)',
                  }}
                  className="new-message-user-row"
                >
                  {/* Left: Avatar + Name / Username */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        backgroundColor: '#efefef',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {u.profile_image_url ? (
                        <img
                          src={u.profile_image_url}
                          alt={u.username}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="#8e8e8e">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {/* Line 1: Full Name / Display Name (Bold) */}
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          letterSpacing: '-0.1px',
                        }}
                      >
                        {u.full_name || u.username}
                      </span>

                      {/* Line 2: Username / Handle (Gray) */}
                      <span
                        style={{
                          fontSize: '13px',
                          color: 'var(--text-secondary)',
                          marginTop: '2px',
                        }}
                      >
                        {u.username}
                      </span>
                    </div>
                  </div>

                  {/* Right: Round Radio Circle Outline / Checked */}
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      border: isSelected ? 'none' : '1.5px solid #c7c7c7',
                      backgroundColor: isSelected ? '#0095f6' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      flexShrink: 0,
                      transition: 'all 0.15s ease-in-out',
                    }}
                  >
                    {isSelected && <Check size={16} strokeWidth={3} />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 4. Bottom Button: "채팅" */}
        <div style={{ padding: '16px 18px 18px 18px', flexShrink: 0 }}>
          <button
            disabled={!selectedUser}
            onClick={handleStartChat}
            style={{
              width: '100%',
              padding: '12px 0',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 700,
              border: 'none',
              backgroundColor: selectedUser ? '#0095f6' : '#b8cdff',
              color: '#ffffff',
              cursor: selectedUser ? 'pointer' : 'default',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              if (selectedUser) e.currentTarget.style.backgroundColor = '#1877f2';
            }}
            onMouseLeave={(e) => {
              if (selectedUser) e.currentTarget.style.backgroundColor = '#0095f6';
            }}
          >
            채팅
          </button>
        </div>
      </div>

      <style>{`
        .new-message-user-row:hover {
          background-color: #f3f3f3 !important;
        }
        [data-theme='dark'] .new-message-user-row:hover {
          background-color: #262626 !important;
        }
        .ig-modal-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .ig-modal-scroll::-webkit-scrollbar-thumb {
          background-color: #c7c7c7;
          border-radius: 4px;
        }
        .ig-modal-scroll::-webkit-scrollbar-track {
          background-color: transparent;
        }
      `}</style>
    </div>
  );
};
