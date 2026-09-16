import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  FileText, 
  Film, 
  Heart, 
  MessageCircle, 
  TrendingUp, 
  UserPlus, 
  Award,
  Sparkles,
  Server,
  HardDrive,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Ban,
  Radio,
  RefreshCw
} from 'lucide-react';
import { Avatar } from '../../components/common/Avatar';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../services';

export const AdminStatsDashboard = ({ stats, loading, error, onRefresh }) => {
  const navigate = useNavigate();
  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);

  const loadHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const data = await adminApi.getSystemHealth();
      setHealth(data);
    } catch (e) {
      console.error('Failed to load system health:', e);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHealth();
  }, [loadHealth]);

  if (loading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <RefreshCw size={28} className="spin-icon" style={{ margin: '0 auto 12px auto', display: 'block', color: 'var(--ig-primary-button)' }} />
        <div style={{ fontSize: '15px', fontWeight: 600 }}>대시보드 통계 데이터를 불러오는 중입니다...</div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <AlertTriangle size={36} color="#ef4444" style={{ margin: '0 auto 12px auto', display: 'block' }} />
        <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
          대시보드 데이터를 불러오지 못했습니다
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          {error || '서버와의 통신에 실패했습니다. 관리자 권한 및 네트워크 연결을 확인해주세요.'}
        </div>
        {onRefresh && (
          <button
            onClick={() => {
              onRefresh();
              loadHealth();
            }}
            style={{
              padding: '8px 18px',
              backgroundColor: 'var(--ig-primary-button)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw size={14} />
            다시 시도
          </button>
        )}
      </div>
    );
  }

  const { summary, user_registration_trend = [], post_creation_trend = [], top_users = [] } = stats;

  const maxUserCount = Math.max(...user_registration_trend.map(d => d.count), 5);
  const maxPostCount = Math.max(...post_creation_trend.map(d => d.count), 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 0. 긴급 심사 필요 신고 알림 배너 (있을 경우) */}
      {summary.pending_reports > 0 && (
        <div
          onClick={() => navigate('/admin?tab=reports')}
          style={{
            padding: '14px 20px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
              }}
            >
              <ShieldAlert size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>
                심사 대기 중인 유해 콘텐츠 신고가 {summary.pending_reports}건 있습니다!
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                클릭하여 신고 모더레이션 센터로 이동하고 즉시 검토 및 조치하세요.
              </div>
            </div>
          </div>
          <button
            style={{
              padding: '6px 14px',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            심사하기 &rarr;
          </button>
        </div>
      )}

      {/* 1. 요약 지표 카드 그리드 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        {/* 회원 수 카드 */}
        <div className="admin-stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>총 회원수</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                {summary.total_users.toLocaleString()}
                <span style={{ fontSize: '14px', fontWeight: 500, marginLeft: '4px' }}>명</span>
              </div>
            </div>
            <div className="admin-icon-pill" style={{ backgroundColor: 'rgba(0, 149, 246, 0.12)', color: '#0095f6' }}>
              <Users size={22} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', fontSize: '12px' }}>
            <span style={{ color: '#10b981', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
              <UserPlus size={13} /> +{summary.new_users_this_week}명 (7일)
            </span>
            {summary.banned_users > 0 && (
              <span style={{ color: '#ef4444', fontWeight: 600 }}>
                • 정지 {summary.banned_users}명
              </span>
            )}
          </div>
        </div>

        {/* 게시물 수 카드 */}
        <div className="admin-stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>총 피드 게시물</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                {summary.total_posts.toLocaleString()}
                <span style={{ fontSize: '14px', fontWeight: 500, marginLeft: '4px' }}>개</span>
              </div>
            </div>
            <div className="admin-icon-pill" style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <FileText size={22} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span style={{ color: '#10b981', fontWeight: 700 }}>오늘 신규</span>
            <span>{summary.new_posts_today}개 등록됨</span>
          </div>
        </div>

        {/* 릴스 동영상 수 카드 */}
        <div className="admin-stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>총 릴스 영상</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                {summary.total_reels.toLocaleString()}
                <span style={{ fontSize: '14px', fontWeight: 500, marginLeft: '4px' }}>개</span>
              </div>
            </div>
            <div className="admin-icon-pill" style={{ backgroundColor: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }}>
              <Film size={22} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span style={{ color: '#8b5cf6', fontWeight: 700 }}>비디오 콘텐츠</span>
            <span>숏폼 영상 라이브러리</span>
          </div>
        </div>

        {/* 인터랙션 (좋아요/댓글) 카드 */}
        <div className="admin-stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>총 인터랙션 활동</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                {(summary.total_likes + summary.total_comments).toLocaleString()}
                <span style={{ fontSize: '14px', fontWeight: 500, marginLeft: '4px' }}>건</span>
              </div>
            </div>
            <div className="admin-icon-pill" style={{ backgroundColor: 'rgba(237, 73, 86, 0.12)', color: '#ed4956' }}>
              <Heart size={22} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <Heart size={12} color="#ed4956" /> {summary.total_likes.toLocaleString()}
            </span>
            <span>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <MessageCircle size={12} color="#0095f6" /> {summary.total_comments.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* 2. 시스템 인프라 및 스토리지 헬스체크 카드 */}
      <div
        style={{
          backgroundColor: 'var(--bg-elevated)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Server size={18} color="var(--ig-primary-button)" />
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              실시간 시스템 리소스 & 스토리지 상태
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#10b981', fontWeight: 600 }}>
            <Radio size={14} className="spin-icon" />
            <span>서비스 정상 가동 중</span>
          </div>
        </div>

        {healthLoading || !health ? (
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>시스템 상태 진단 중...</div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
            }}
          >
            {/* DB 상태 */}
            <div style={{ padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>데이터베이스</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '14px' }}>
                <CheckCircle2 size={16} color="#10b981" />
                <span>{health.database_engine}</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                DB 크기: {health.database_size_formatted}
              </div>
            </div>

            {/* 업로드 스토리지 */}
            <div style={{ padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>미디어 스토리지</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '14px' }}>
                <HardDrive size={16} color="#0095f6" />
                <span>{health.uploads_total_size_formatted}</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                총 업로드 파일: {health.uploads_file_count.toLocaleString()}개
              </div>
            </div>

            {/* 플랫폼 환경 */}
            <div style={{ padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>런타임 환경</div>
              <div style={{ fontWeight: 700, fontSize: '13px' }}>
                Python {health.python_version}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {health.os_platform}
              </div>
            </div>

            {/* 서버 업타임 */}
            <div style={{ padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>관리자 세션/가동</div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--ig-primary-button)' }}>
                {Math.floor(health.server_uptime_seconds / 60)}분 가동
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                감사 로그 보호 가동 중
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. 인터랙티브 트렌드 차트 섹션 (최근 14일) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: '20px',
        }}
      >
        {/* 회원 가입 추이 차트 */}
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} color="#0095f6" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                최근 14일 신규 회원 가입 추이
              </h3>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>일별 등록수</span>
          </div>

          <div style={{ height: '180px', display: 'flex', alignItems: 'flex-end', gap: '8px', paddingBottom: '24px', position: 'relative' }}>
            {user_registration_trend.map((item, idx) => {
              const heightPercent = Math.max(8, (item.count / maxUserCount) * 100);
              return (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '100%',
                    justifyContent: 'flex-end',
                    position: 'relative',
                  }}
                  className="chart-bar-container"
                >
                  <div className="chart-tooltip">
                    {item.date}: {item.count}명
                  </div>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '24px',
                      height: `${heightPercent}%`,
                      backgroundColor: item.count > 0 ? '#0095f6' : 'var(--border-subtle)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s ease',
                    }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      fontSize: '10px',
                      color: 'var(--text-secondary)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.date}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 게시물 등록 추이 차트 */}
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} color="#10b981" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                최근 14일 피드 게시물 작성 추이
              </h3>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>일별 작성건수</span>
          </div>

          <div style={{ height: '180px', display: 'flex', alignItems: 'flex-end', gap: '8px', paddingBottom: '24px', position: 'relative' }}>
            {post_creation_trend.map((item, idx) => {
              const heightPercent = Math.max(8, (item.count / maxPostCount) * 100);
              return (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '100%',
                    justifyContent: 'flex-end',
                    position: 'relative',
                  }}
                  className="chart-bar-container"
                >
                  <div className="chart-tooltip">
                    {item.date}: {item.count}개
                  </div>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '24px',
                      height: `${heightPercent}%`,
                      backgroundColor: item.count > 0 ? '#10b981' : 'var(--border-subtle)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s ease',
                    }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      fontSize: '10px',
                      color: 'var(--text-secondary)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.date}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. 활동 우수 크리에이터 랭킹 */}
      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={20} color="#f59e0b" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              활동 우수 크리에이터 Top 5
            </h3>
          </div>
          <button
            onClick={() => navigate('/admin?tab=users')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--ig-primary-button)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            전체 회원 보기 &rarr;
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {top_users.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
              활동 중인 크리에이터 데이터가 없습니다.
            </div>
          ) : (
            top_users.map((u, idx) => (
              <div
                key={u.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : 'var(--border-subtle)',
                      color: idx < 3 ? '#ffffff' : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 800,
                    }}
                  >
                    {idx + 1}
                  </div>
                  <Avatar src={u.profile_image_url} size="sm" />
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px' }}>
                      @{u.username}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {u.full_name || '이름 미설정'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px' }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>게시물 </span>
                    <strong style={{ color: '#0095f6' }}>{u.posts_count}</strong>개
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>팔로워 </span>
                    <strong style={{ color: 'var(--text-primary)' }}>{u.followers_count}</strong>명
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminStatsDashboard;
