import React, { useState } from 'react';
import { Monitor, Smartphone, Tablet, MapPin, LogOut, ShieldCheck, Check } from 'lucide-react';
import { Button } from '../common/Button';

export const LoginActivityPanel = ({ showToast }) => {
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('ig_login_sessions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [
      {
        id: 1,
        device: 'iPhone 15 Pro',
        type: 'mobile',
        browser: 'Instagram App v320.0',
        location: '대한민국 서울특별시 강남구',
        timeAgo: '어제 19:42',
        isCurrent: false,
      },
      {
        id: 2,
        device: 'iPad Pro 11"',
        type: 'tablet',
        browser: 'Safari Mobile',
        location: '대한민국 부산광역시 해운대구',
        timeAgo: '3일 전',
        isCurrent: false,
      },
      {
        id: 3,
        device: 'MacBook Air M2',
        type: 'desktop',
        browser: 'Chrome 122.0',
        location: '일본 도쿄도 시부야구',
        timeAgo: '2026년 8월 28일',
        isCurrent: false,
      },
    ];
  });

  const handleLogoutSession = (sessionId) => {
    setSessions(prev => {
      const updated = prev.filter(s => s.id !== sessionId);
      localStorage.setItem('ig_login_sessions', JSON.stringify(updated));
      return updated;
    });
    showToast('해당 기기의 세션이 원격 로그아웃되었습니다.');
  };

  const handleLogoutAllOther = () => {
    setSessions([]);
    localStorage.setItem('ig_login_sessions', JSON.stringify([]));
    showToast('현재 기기를 제외한 모든 기기에서 안전하게 로그아웃되었습니다.');
  };

  const getDeviceIcon = (type) => {
    if (type === 'mobile') return <Smartphone size={20} color="var(--ig-primary-button)" />;
    if (type === 'tablet') return <Tablet size={20} color="var(--ig-primary-button)" />;
    return <Monitor size={20} color="var(--ig-primary-button)" />;
  };

  return (
    <div style={{ maxWidth: '640px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>
          로그인 활동
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          회원님의 Instagram 계정에 현재 로그인되어 있는 위치와 기기를 관리합니다.
        </p>
      </div>

      {/* Current Active Device Card */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px' }}>현재 기기</div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 20px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '14px',
            border: '2px solid rgba(0, 149, 246, 0.4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 149, 246, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Monitor size={22} color="var(--ig-primary-button)" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '15px' }}>Windows 11 • Chrome</span>
                <span
                  style={{
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '10px',
                  }}
                >
                  현재 활동 중
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                <MapPin size={14} />
                <span>대한민국 서울특별시 • 현재 세션</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Other Active Sessions List */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700 }}>
            다른 로그인 위치 ({sessions.length})
          </div>
          {sessions.length > 0 && (
            <button
              onClick={handleLogoutAllOther}
              style={{
                color: 'var(--ig-danger)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              모든 기기에서 로그아웃
            </button>
          )}
        </div>

        {sessions.length === 0 ? (
          <div
            style={{
              padding: '36px',
              textAlign: 'center',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '12px',
              color: 'var(--text-secondary)',
            }}
          >
            <ShieldCheck size={36} style={{ margin: '0 auto 8px', color: '#10b981' }} />
            <p style={{ fontSize: '14px', fontWeight: 600 }}>다른 활성 세션이 없습니다.</p>
            <p style={{ fontSize: '12px', marginTop: '4px' }}>현재 기기에서만 안전하게 로그인되어 있습니다.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sessions.map((sess) => (
              <div
                key={sess.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--bg-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {getDeviceIcon(sess.type)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>
                      {sess.device} • {sess.browser}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                      <MapPin size={13} />
                      <span>{sess.location} • {sess.timeAgo}</span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleLogoutSession(sess.id)}
                  style={{ color: 'var(--ig-danger)', borderColor: 'var(--border-color)', fontSize: '12px', padding: '6px 14px' }}
                >
                  로그아웃
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
