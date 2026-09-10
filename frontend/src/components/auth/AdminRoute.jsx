import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          width: '100%',
          backgroundColor: 'var(--bg-primary)',
        }}
      >
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    // 비로그인 사용자는 로그인 페이지로 리다이렉트 (로그인 후 다시 돌아올 수 있도록 상태 보존)
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isAdmin = Boolean(user.is_admin || user.isAdmin);
  if (!isAdmin) {
    // 로그인되었으나 관리자 권한이 없는 일반 사용자 차단
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '24px',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: 'rgba(237, 73, 86, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--ig-danger)',
            marginBottom: '20px',
          }}
        >
          <ShieldAlert size={44} />
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '12px' }}>
          관리자 전용 페이지 접근 제한
        </h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '440px', lineHeight: 1.6, marginBottom: '28px' }}>
          해당 페이지는 최고 관리자(Admin) 권한을 가진 계정만 접근할 수 있습니다.
          현재 로그인된 계정(<strong>{user.username}</strong>)은 일반 사용자 권한입니다.
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            <ArrowLeft size={16} />
            메인 홈으로 이동
          </button>
          <button
            onClick={() => navigate('/login', { state: { from: location } })}
            style={{
              padding: '10px 20px',
              backgroundColor: 'var(--ig-primary-button)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            관리자 계정으로 로그인
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default AdminRoute;
