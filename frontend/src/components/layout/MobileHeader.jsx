import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Heart, MessageCircle, Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';

export const MobileHeader = () => {
  const { user } = useAuth();
  const { openNotifications } = useModal();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  const currentPath = decodeURIComponent(location.pathname);
  const isProfile = Boolean(
    user && (
      currentPath === `/${user.username}` ||
      currentPath === `/${user.username}/` ||
      currentPath === '/profile'
    )
  );

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        height: 'var(--nav-height-mobile)',
        borderBottom: isHome ? 'none' : '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        zIndex: 90,
      }}
      className="mobile-only-header"
    >
      <NavLink to="/">
        <span className="brand-logo" style={{ fontSize: '1.8rem', color: 'var(--text-primary)' }}>
          Instagram
        </span>
      </NavLink>

      {user ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {isProfile ? (
            <button
              onClick={() => navigate('/accounts/edit?tab=menu')}
              style={{
                color: 'var(--text-primary)',
                background: 'none',
                border: 'none',
                padding: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Settings"
            >
              <Menu size={26} strokeWidth={2} />
            </button>
          ) : (
            <>
              <button
                onClick={openNotifications}
                style={{ color: 'var(--text-primary)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}
                aria-label="Notifications"
              >
                <Heart size={24} />
              </button>
              <NavLink to="/direct" style={{ color: 'var(--text-primary)' }} aria-label="Direct Messages">
                <MessageCircle size={24} />
              </NavLink>
            </>
          )}
        </div>
      ) : (
        <button
          onClick={() => navigate('/login')}
          style={{
            padding: '6px 14px',
            backgroundColor: 'var(--ig-primary-button)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          로그인
        </button>
      )}

      <style>{`
        @media (min-width: 769px) {
          .mobile-only-header {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
};
