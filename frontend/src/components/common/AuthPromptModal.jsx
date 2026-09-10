import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Heart, MessageCircle, Bookmark, UserPlus, LogIn, X, Sparkles } from 'lucide-react';
import { useModal } from '../../contexts/ModalContext';
import { Button } from './Button';

export const AuthPromptModal = () => {
  const { isAuthPromptOpen, authPromptConfig, closeAuthPromptModal } = useModal();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isAuthPromptOpen) return null;

  const {
    title = '로그인이 필요한 서비스입니다',
    description = '로그인하면 피드에 반응하고 친구들과 소통할 수 있습니다.',
    actionType = 'default'
  } = authPromptConfig || {};

  const getActionIcon = () => {
    switch (actionType) {
      case 'like':
        return (
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 48, 64, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--ig-danger, #ed4956)',
            }}
          >
            <Heart size={32} fill="var(--ig-danger, #ed4956)" />
          </div>
        );
      case 'comment':
        return (
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 149, 246, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--ig-primary, #0095f6)',
            }}
          >
            <MessageCircle size={32} />
          </div>
        );
      case 'bookmark':
        return (
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 184, 0, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f59e0b',
            }}
          >
            <Bookmark size={32} fill="#f59e0b" />
          </div>
        );
      case 'follow':
        return (
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 149, 246, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--ig-primary, #0095f6)',
            }}
          >
            <UserPlus size={32} />
          </div>
        );
      case 'create':
        return (
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(168, 85, 247, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#a855f7',
            }}
          >
            <Sparkles size={32} />
          </div>
        );
      default:
        return (
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 149, 246, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--ig-primary, #0095f6)',
            }}
          >
            <LogIn size={32} />
          </div>
        );
    }
  };

  const handleLoginClick = () => {
    closeAuthPromptModal();
    const returnUrl = location.pathname + location.search;
    navigate('/login', { state: { from: { pathname: returnUrl } } });
  };

  const handleSignupClick = () => {
    closeAuthPromptModal();
    const returnUrl = location.pathname + location.search;
    navigate('/signup', { state: { from: { pathname: returnUrl } } });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={closeAuthPromptModal}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: 'var(--bg-primary, #ffffff)',
          borderRadius: '16px',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.28)',
          border: '1px solid var(--border-color, #dbdbdb)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '32px 24px 24px 24px',
          position: 'relative',
          animation: 'scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closeAuthPromptModal}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-secondary, #8e8e8e)',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
          }}
          aria-label="닫기"
        >
          <X size={20} />
        </button>

        {/* Dynamic Icon */}
        <div style={{ marginBottom: '18px' }}>
          {getActionIcon()}
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--text-primary, #262626)',
            marginBottom: '8px',
            textAlign: 'center',
            lineHeight: 1.35,
          }}
        >
          {title}
        </h3>

        {/* Description */}
        <p
          style={{
            fontSize: '14px',
            color: 'var(--text-secondary, #8e8e8e)',
            marginBottom: '24px',
            textAlign: 'center',
            lineHeight: 1.5,
            padding: '0 8px',
          }}
        >
          {description}
        </p>

        {/* Action Buttons */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Button
            variant="primary"
            onClick={handleLoginClick}
            style={{
              width: '100%',
              height: '42px',
              fontSize: '14px',
              fontWeight: 600,
              borderRadius: '8px',
            }}
          >
            로그인
          </Button>

          <button
            onClick={handleSignupClick}
            style={{
              width: '100%',
              height: '38px',
              background: 'transparent',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--ig-primary, #0095f6)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            계정이 없으신가요? 가입하기
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};
