import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  FileText, 
  ShieldCheck, 
  ArrowLeft, 
  LogOut, 
  RefreshCw,
  Sun,
  Moon,
  Film,
  AlertOctagon,
  FileCheck2,
  Activity
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Avatar } from '../../components/common/Avatar';
import { adminApi } from '../../services';

import { AdminStatsDashboard } from './AdminStatsDashboard';
import { AdminUserManagement } from './AdminUserManagement';
import { AdminPostManagement } from './AdminPostManagement';
import { AdminReelManagement } from './AdminReelManagement';
import { AdminReportManagement } from './AdminReportManagement';
import { AdminAuditLogViewer } from './AdminAuditLogViewer';

export const AdminPage = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // 현재 활성화된 탭 (dashboard | users | posts | reels | reports | logs)
  const currentTab = searchParams.get('tab') || 'dashboard';

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const data = await adminApi.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
      setStatsError(err.response?.data?.detail || '통계 대시보드 데이터를 불러오지 못했습니다.');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // 대시보드 탭이거나 최초 로드 시에만 통계 데이터 동기화
  useEffect(() => {
    if (currentTab === 'dashboard' || !stats) {
      fetchStats();
    }
  }, [fetchStats, currentTab]);

  const handleTabChange = (tab) => {
    setSearchParams({ tab });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const pendingReportsCount = stats?.summary?.pending_reports || 0;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 1. 상단 관리자 전용 네비게이션 헤더 */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: 'var(--bg-elevated)',
          borderBottom: '1px solid var(--border-color)',
          padding: '0 24px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}
      >
        {/* 좌측 로고 및 어드민 뱃지 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            onClick={() => navigate('/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
            }}
          >
            <span
              className="brand-logo"
              style={{
                fontSize: '26px',
                lineHeight: 1,
                color: 'var(--text-primary)',
              }}
            >
              Instagram
            </span>
            <span
              style={{
                backgroundColor: 'rgba(237, 73, 86, 0.12)',
                color: 'var(--ig-danger)',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <ShieldCheck size={13} />
              ADMIN CONSOLE
            </span>
          </div>

          {/* 탭 네비게이션 */}
          <nav style={{ display: 'flex', gap: '4px', marginLeft: '20px' }} className="admin-nav-tabs">
            <button
              onClick={() => handleTabChange('dashboard')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: currentTab === 'dashboard' ? 'var(--border-subtle)' : 'transparent',
                color: currentTab === 'dashboard' ? 'var(--ig-primary-button)' : 'var(--text-secondary)',
                fontWeight: currentTab === 'dashboard' ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <BarChart3 size={17} />
              <span>통계 & 헬스</span>
            </button>

            <button
              onClick={() => handleTabChange('users')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: currentTab === 'users' ? 'var(--border-subtle)' : 'transparent',
                color: currentTab === 'users' ? 'var(--ig-primary-button)' : 'var(--text-secondary)',
                fontWeight: currentTab === 'users' ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Users size={17} />
              <span>회원 관리</span>
            </button>

            <button
              onClick={() => handleTabChange('posts')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: currentTab === 'posts' ? 'var(--border-subtle)' : 'transparent',
                color: currentTab === 'posts' ? 'var(--ig-primary-button)' : 'var(--text-secondary)',
                fontWeight: currentTab === 'posts' ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <FileText size={17} />
              <span>게시물 관리</span>
            </button>

            <button
              onClick={() => handleTabChange('reels')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: currentTab === 'reels' ? 'var(--border-subtle)' : 'transparent',
                color: currentTab === 'reels' ? 'var(--ig-primary-button)' : 'var(--text-secondary)',
                fontWeight: currentTab === 'reels' ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Film size={17} />
              <span>릴스 관리</span>
            </button>

            <button
              onClick={() => handleTabChange('reports')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: currentTab === 'reports' ? 'var(--border-subtle)' : 'transparent',
                color: currentTab === 'reports' ? 'var(--ig-primary-button)' : 'var(--text-secondary)',
                fontWeight: currentTab === 'reports' ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                position: 'relative',
              }}
            >
              <AlertOctagon size={17} color={pendingReportsCount > 0 ? '#ef4444' : undefined} />
              <span>신고 심사</span>
              {pendingReportsCount > 0 && (
                <span
                  style={{
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    borderRadius: '10px',
                    padding: '1px 6px',
                    fontSize: '11px',
                    fontWeight: 800,
                  }}
                >
                  {pendingReportsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabChange('logs')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: currentTab === 'logs' ? 'var(--border-subtle)' : 'transparent',
                color: currentTab === 'logs' ? 'var(--ig-primary-button)' : 'var(--text-secondary)',
                fontWeight: currentTab === 'logs' ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <FileCheck2 size={17} />
              <span>감사 로그</span>
            </button>
          </nav>
        </div>

        {/* 우측 시스템 상태 및 관리자 정보 버튼들 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* 시스템 정상 상태 뱃지 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '20px',
              color: '#10b981',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            <Activity size={13} />
            <span className="hide-mobile">DB & 시스템 정상</span>
          </div>

          {/* 새로고침 버튼 */}
          <button
            onClick={fetchStats}
            title="데이터 새로고침"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            className="hover-bg"
          >
            <RefreshCw size={17} className={statsLoading ? 'spin-icon' : ''} />
          </button>

          {/* 테마 토글 버튼 */}
          <button
            onClick={toggleTheme}
            title={isDark ? '라이트 모드' : '다크 모드'}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            className="hover-bg"
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* 인스타그램 앱으로 복귀 */}
          <button
            onClick={() => navigate('/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            className="hover-bg"
          >
            <ArrowLeft size={14} />
            <span className="hide-mobile">앱 복귀</span>
          </button>

          {/* 관리자 프로필 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 10px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
            }}
          >
            <Avatar src={user?.profile_image_url} size="xs" />
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {user?.username}
            </span>
          </div>

          {/* 로그아웃 버튼 */}
          <button
            onClick={handleLogout}
            title="로그아웃"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--ig-danger)',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            className="hover-bg"
          >
            <LogOut size={17} />
          </button>
        </div>
      </header>

      {/* 2. 메인 컨텐츠 영역 */}
      <main
        style={{
          flex: 1,
          maxWidth: '1260px',
          width: '100%',
          margin: '0 auto',
          padding: '24px 20px 60px 20px',
          boxSizing: 'border-box',
        }}
      >
        {currentTab === 'dashboard' && (
          <AdminStatsDashboard
            stats={stats}
            loading={statsLoading}
            error={statsError}
            onRefresh={fetchStats}
          />
        )}

        {currentTab === 'users' && <AdminUserManagement onDataChange={fetchStats} />}

        {currentTab === 'posts' && <AdminPostManagement onDataChange={fetchStats} />}

        {currentTab === 'reels' && <AdminReelManagement onDataChange={fetchStats} />}

        {currentTab === 'reports' && <AdminReportManagement onDataChange={fetchStats} />}

        {currentTab === 'logs' && <AdminAuditLogViewer />}
      </main>

      <style>{`
        .hover-bg:hover {
          background-color: var(--border-subtle) !important;
        }
        .spin-icon {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 900px) {
          .admin-nav-tabs {
            margin-left: 8px !important;
          }
          .admin-nav-tabs button span {
            display: none;
          }
          .hide-mobile {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminPage;
