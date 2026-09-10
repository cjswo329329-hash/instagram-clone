import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../common/Button';

export const GuestStickyBar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Show only for unauthenticated guest users
  if (user) return null;

  const handleLogin = () => {
    const returnUrl = location.pathname + location.search;
    navigate('/login', { state: { from: { pathname: returnUrl } } });
  };

  const handleSignup = () => {
    const returnUrl = location.pathname + location.search;
    navigate('/signup', { state: { from: { pathname: returnUrl } } });
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'var(--bg-primary, #ffffff)',
        borderTop: '1px solid var(--border-color, #dbdbdb)',
        boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.08)',
        zIndex: 8000,
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'transform 0.3s ease',
      }}
      className="guest-sticky-bar"
    >
      {/* Left Message */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span
          style={{
            fontSize: '14px',
            fontWeight: 700,
            color: 'var(--text-primary, #262626)',
          }}
        >
          Instagram으로 좋아하는 사람 및 관심사와 연결해보세요.
        </span>
        <span
          style={{
            fontSize: '12px',
            color: 'var(--text-secondary, #8e8e8e)',
          }}
        >
          로그인하여 친구들의 소식을 실시간으로 확인하고 소통하세요.
        </span>
      </div>

      {/* Right CTAs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <Button
          variant="primary"
          onClick={handleLogin}
          style={{
            padding: '7px 18px',
            fontSize: '13px',
            fontWeight: 600,
            borderRadius: '8px',
          }}
        >
          로그인
        </Button>
        <Button
          variant="secondary"
          onClick={handleSignup}
          style={{
            padding: '7px 18px',
            fontSize: '13px',
            fontWeight: 600,
            borderRadius: '8px',
          }}
        >
          가입하기
        </Button>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .guest-sticky-bar {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
            padding: 10px 14px;
            bottom: var(--bottom-bar-height-mobile, 48px);
          }
          .guest-sticky-bar > div:first-child {
            display: none;
          }
          .guest-sticky-bar > div:last-child {
            width: 100%;
            display: flex;
          }
          .guest-sticky-bar > div:last-child > button {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
};
