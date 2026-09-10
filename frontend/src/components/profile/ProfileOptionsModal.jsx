import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../common/Modal';
import { useAuth } from '../../contexts/AuthContext';

export const ProfileOptionsModal = ({ isOpen, onClose, onOpenQRCode }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleNavigate = (path) => {
    onClose();
    navigate(path);
  };

  const handleLogout = () => {
    onClose();
    logout();
    navigate('/login');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="400px"
      width="85%"
      showCloseButton={false}
    >
      <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'center' }}>
        <button
          onClick={() => handleNavigate('/accounts/edit')}
          style={{
            padding: '14px',
            color: 'var(--text-primary)',
            fontSize: '14px',
            borderBottom: '1px solid var(--border-color)',
            cursor: 'pointer',
          }}
        >
          설정 및 개인정보
        </button>

        <button
          onClick={() => {
            onClose();
            onOpenQRCode();
          }}
          style={{
            padding: '14px',
            color: 'var(--text-primary)',
            fontSize: '14px',
            borderBottom: '1px solid var(--border-color)',
            cursor: 'pointer',
          }}
        >
          QR 코드
        </button>

        <button
          onClick={() => handleNavigate('/accounts/edit?tab=notifications')}
          style={{
            padding: '14px',
            color: 'var(--text-primary)',
            fontSize: '14px',
            borderBottom: '1px solid var(--border-color)',
            cursor: 'pointer',
          }}
        >
          알림
        </button>

        <button
          onClick={() => handleNavigate('/accounts/edit?tab=privacy')}
          style={{
            padding: '14px',
            color: 'var(--text-primary)',
            fontSize: '14px',
            borderBottom: '1px solid var(--border-color)',
            cursor: 'pointer',
          }}
        >
          계정 공개 범위
        </button>

        <button
          onClick={() => handleNavigate('/accounts/edit?tab=password')}
          style={{
            padding: '14px',
            color: 'var(--text-primary)',
            fontSize: '14px',
            borderBottom: '1px solid var(--border-color)',
            cursor: 'pointer',
          }}
        >
          비밀번호 및 보안
        </button>

        <button
          onClick={handleLogout}
          style={{
            padding: '14px',
            color: 'var(--ig-danger)',
            fontWeight: 700,
            fontSize: '14px',
            borderBottom: '1px solid var(--border-color)',
            cursor: 'pointer',
          }}
        >
          로그아웃
        </button>

        <button
          onClick={onClose}
          style={{
            padding: '14px',
            color: 'var(--text-primary)',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          취소
        </button>
      </div>
    </Modal>
  );
};
