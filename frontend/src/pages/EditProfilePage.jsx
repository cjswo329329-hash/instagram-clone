import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  User,
  Lock,
  Shield,
  Bell,
  Palette,
  UserX,
  Activity,
  HelpCircle,
  Check,
  ChevronRight,
  ChevronLeft,
  Sun,
  Moon,
  Star,
  MessageSquare,
  Tag,
  EyeOff,
  Heart,
  Archive,
  Clock,
  Briefcase,
  BarChart3,
  Key,
  FileText,
  Smartphone
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useModal } from '../contexts/ModalContext';
import { Avatar } from '../components/common/Avatar';
import { Button } from '../components/common/Button';
import { ChangeAvatarModal } from '../components/profile/ChangeAvatarModal';
import { authApi, userApi } from '../services';

// Subcomponents
import { PersonalDetailsPanel } from '../components/settings/PersonalDetailsPanel';
import { PasswordSecurityPanel } from '../components/settings/PasswordSecurityPanel';
import { TwoFactorPanel } from '../components/settings/TwoFactorPanel';
import { LoginActivityPanel } from '../components/settings/LoginActivityPanel';
import { CloseFriendsPanel } from '../components/settings/CloseFriendsPanel';
import { HiddenWordsPanel } from '../components/settings/HiddenWordsPanel';
import { TagsMentionsPanel } from '../components/settings/TagsMentionsPanel';
import { RestrictedAccountsPanel } from '../components/settings/RestrictedAccountsPanel';
import { LikedPostsPanel } from '../components/settings/LikedPostsPanel';
import { ArchivePanel } from '../components/settings/ArchivePanel';
import { SearchHistoryPanel } from '../components/settings/SearchHistoryPanel';
import { ProfessionalPanel } from '../components/settings/ProfessionalPanel';
import { InsightsPanel } from '../components/settings/InsightsPanel';
import { HelpLegalPanel } from '../components/settings/HelpLegalPanel';

export const EditProfilePage = () => {
  const { user, updateProfile, updateAvatar } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { posts } = useModal();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab') || 'edit-profile';
  const [activeTab, setActiveTab] = useState(tabParam);
  const isMobileMenu = activeTab === 'menu';

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    setSearchParams(tabId === 'edit-profile' ? {} : { tab: tabId });
  };

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Avatar Modal State
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  // Form State: Profile Edit
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [website, setWebsite] = useState(user?.website || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [gender, setGender] = useState(user?.gender || 'not_specified');
  const [showSuggestions, setShowSuggestions] = useState(() => {
    const saved = localStorage.getItem('ig_show_suggestions');
    return saved !== null ? saved === 'true' : (user?.show_suggestions ?? true);
  });
  const [avatarUrl, setAvatarUrl] = useState(user?.profile_image_url || user?.profileImageUrl || '');

  // Privacy Settings State
  const [isPrivate, setIsPrivate] = useState(() => {
    if (user && user.is_private !== undefined) return !!user.is_private;
    const saved = localStorage.getItem('ig_is_private');
    return saved !== null ? saved === 'true' : false;
  });
  const [showActivityStatus, setShowActivityStatus] = useState(() => {
    const saved = localStorage.getItem('ig_activity_status');
    return saved !== null ? saved === 'true' : true;
  });
  const [allowStorySharing, setAllowStorySharing] = useState(() => {
    const saved = localStorage.getItem('ig_story_sharing');
    return saved !== null ? saved === 'true' : true;
  });


  // Notification Settings State
  const [pauseAllNotifications, setPauseAllNotifications] = useState(() => {
    const saved = localStorage.getItem('ig_pause_notifications');
    return saved !== null ? saved === 'true' : false;
  });
  const [likesNotif, setLikesNotif] = useState(() => {
    return localStorage.getItem('ig_likes_notif') || 'everyone';
  });
  const [directNotif, setDirectNotif] = useState(() => {
    const saved = localStorage.getItem('ig_direct_notif');
    return saved !== null ? saved === 'true' : true;
  });

  // Media & Display State
  const [highQualityUpload, setHighQualityUpload] = useState(() => {
    const saved = localStorage.getItem('ig_high_quality_upload');
    return saved !== null ? saved === 'true' : true;
  });
  const [autoplayVideos, setAutoplayVideos] = useState(() => {
    const saved = localStorage.getItem('ig_autoplay_videos');
    return saved !== null ? saved === 'true' : true;
  });

  // user 변경 시 폼 상태 및 프로필 사진 동기화
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setUsername(user.username || '');
      setWebsite(user.website || '');
      setBio(user.bio || '');
      setGender(user.gender || 'not_specified');
      setAvatarUrl(user.profile_image_url || user.profileImageUrl || '');
      if (user.is_private !== undefined) {
        setIsPrivate(!!user.is_private);
        localStorage.setItem('ig_is_private', String(user.is_private));
      }
      if (user.show_suggestions !== undefined) {
        setShowSuggestions(user.show_suggestions);
        localStorage.setItem('ig_show_suggestions', String(user.show_suggestions));
      }
    }
  }, [user]);

  // Blocked users list
  const [blockedUsers, setBlockedUsers] = useState(() => {
    const saved = localStorage.getItem('ig_blocked_users');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return [
      { id: 991, username: 'spammer_bot_1', full_name: '무료 이벤트 봇', profile_image_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150' },
      { id: 992, username: 'ad_promoter_kr', full_name: '홍보 계정', profile_image_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150' }
    ];
  });

  const handleUnblock = (userId) => {
    setBlockedUsers(prev => {
      const updated = prev.filter(u => u.id !== userId);
      localStorage.setItem('ig_blocked_users', JSON.stringify(updated));
      return updated;
    });
    showToast('차단이 해제되었습니다.');
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await updateProfile({
        full_name: fullName,
        username,
        website,
        bio,
        gender,
        show_suggestions: showSuggestions,
        is_private: isPrivate,
        profile_image_url: avatarUrl,
      });
      if (res.success) {
        showToast('프로필이 저장되었습니다.');
      } else {
        alert(res.error || '프로필 저장 중 오류가 발생했습니다.');
      }
    } catch (err) {
      alert('프로필 저장 중 오류가 발생했습니다.');
    }
  };


  const navSections = [
    {
      title: 'Meta 계정 센터',
      items: [
        { id: 'edit-profile', label: '프로필 편집', icon: User },
        { id: 'personal-details', label: '개인정보', icon: FileText },
        { id: 'password', label: '비밀번호 및 보안', icon: Shield },
        { id: 'two-factor', label: '2단계 인증', icon: Key },
        { id: 'login-activity', label: '로그인 활동', icon: Smartphone },
      ]
    },
    {
      title: '상호작용 및 개인정보',
      items: [
        { id: 'privacy', label: '계정 공개 범위', icon: Lock },
        { id: 'close-friends', label: '친한 친구', icon: Star },
        { id: 'hidden-words', label: '댓글 및 숨긴 단어', icon: MessageSquare },
        { id: 'tags-mentions', label: '태그 및 언급', icon: Tag },
        { id: 'blocked', label: '차단된 계정', icon: UserX },
        { id: 'restricted', label: '제한된 계정', icon: EyeOff },
      ]
    },
    {
      title: '내 활동 및 보관함',
      items: [
        { id: 'activity', label: '내 활동 개요', icon: Activity },
        { id: 'liked-posts', label: '좋아요한 콘텐츠', icon: Heart },
        { id: 'archive', label: '보관함', icon: Archive },
        { id: 'search-history', label: '검색 내역', icon: Clock },
      ]
    },
    {
      title: '프로페셔널 & 크리에이터',
      items: [
        { id: 'professional', label: '프로페셔널 전환', icon: Briefcase },
        { id: 'insights', label: '계정 인사이트', icon: BarChart3 },
      ]
    },
    {
      title: '앱 환경설정 및 지원',
      items: [
        { id: 'notifications', label: '알림', icon: Bell },
        { id: 'display', label: '디스플레이 및 미디어', icon: Palette },
        { id: 'help', label: '고객 센터 및 정보', icon: HelpCircle },
      ]
    }
  ];

  const ToggleSwitch = ({ checked, onChange }) => (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: '44px',
        height: '24px',
        borderRadius: '12px',
        backgroundColor: checked ? 'var(--ig-primary-button)' : 'var(--border-color)',
        padding: '2px',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease',
        display: 'inline-flex',
        alignItems: 'center',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
          transform: checked ? 'translateX(20px)' : 'translateX(0px)',
          transition: 'transform 0.2s ease',
        }}
      />
    </div>
  );

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        backgroundColor: 'var(--bg-primary)',
        overflow: 'hidden',
      }}
      className="settings-page-root"
    >
      {/* Toast notification banner */}
      {toastMessage && (
        <div
          className="modal-enter"
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--text-primary)',
            color: 'var(--bg-primary)',
            padding: '12px 24px',
            borderRadius: '24px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          <Check size={18} color="var(--ig-primary-button)" strokeWidth={3} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Settings Container (Full Screen Dual-Pane) */}
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          backgroundColor: 'var(--bg-primary)',
          overflow: 'hidden',
        }}
        className="settings-card-wrapper"
      >
        {/* Left Navigation Sidebar */}
        <aside
          style={{
            width: '320px',
            minWidth: '290px',
            borderRight: '1px solid var(--border-color)',
            padding: '28px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            backgroundColor: 'var(--bg-primary)',
            flexShrink: 0,
            overflowY: 'auto',
            height: '100%',
          }}
          className={`settings-sidebar no-scrollbar ${isMobileMenu ? 'mobile-visible' : 'mobile-hidden'}`}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '4px' }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                background: 'none',
                border: 'none',
                padding: '4px',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              className="settings-mobile-back-btn"
              aria-label="Back to Profile"
            >
              <ChevronLeft size={26} strokeWidth={2.2} />
            </button>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              설정
            </h2>
          </div>

          {/* Meta Accounts Center Banner Box */}
          <div
            style={{
              padding: '14px 16px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ig-primary-button)', fontWeight: 700, fontSize: '13px' }}>
              <span>∞ Meta</span>
              <span style={{ color: 'var(--text-primary)' }}>계정 센터</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              비밀번호, 보안, 개인정보 등 환경을 통합 관리하세요.
            </p>
          </div>

          {/* Grouped Navigation Menu */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {navSections.map((sec, secIdx) => (
              <div key={secIdx}>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    padding: '0 10px 8px 10px',
                  }}
                >
                  {sec.title}
                </div>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {sec.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectTab(item.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          backgroundColor: isActive ? 'var(--bg-secondary)' : 'transparent',
                          color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                          fontWeight: isActive ? 700 : 500,
                          fontSize: '13.5px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease',
                        }}
                        className="settings-menu-item"
                      >
                        <Icon size={17} strokeWidth={isActive ? 2.5 : 2} />
                        <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.label}
                        </span>
                        {isActive && <ChevronRight size={14} color="var(--text-secondary)" />}
                      </button>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>
        </aside>

        {/* Right Content Area */}
        <main
          style={{
            flex: 1,
            padding: '36px 56px 80px 56px',
            overflowY: 'auto',
            height: '100%',
            display: 'flex',
            justifyContent: 'flex-start',
          }}
          className={`settings-content-area ${isMobileMenu ? 'mobile-hidden' : 'mobile-visible'}`}
        >
          <div style={{ width: '100%', maxWidth: '800px' }}>
            {/* Mobile Header Bar for Content Area */}
            <div className="settings-mobile-content-header">
              <button
                type="button"
                onClick={() => {
                  if (activeTab !== 'edit-profile' && searchParams.get('tab')) {
                    navigate('/accounts/edit?tab=menu');
                  } else {
                    navigate(-1);
                  }
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '4px',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="뒤로가기"
              >
                <ChevronLeft size={26} strokeWidth={2.2} />
              </button>
              <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {activeTab === 'edit-profile' || activeTab === 'menu'
                  ? '프로필 편집'
                  : (navSections.flatMap(s => s.items).find(i => i.id === activeTab)?.label || '설정')}
              </h3>
              <div style={{ width: '26px' }} />
            </div>

            {/* TAB: EDIT PROFILE */}
            {(activeTab === 'edit-profile' || activeTab === 'menu') && (
              <div>
              <h2 className="settings-desktop-title" style={{ fontSize: '20px', fontWeight: 700, marginBottom: '28px' }}>
                프로필 편집
              </h2>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  padding: '16px 20px',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '16px',
                  marginBottom: '28px',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <Avatar src={avatarUrl || user?.profile_image_url} size="lg" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '15px' }}>{username || user?.username}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{fullName || user?.full_name}</div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsAvatarModalOpen(true)}
                  style={{ fontWeight: 600, padding: '8px 16px', borderRadius: '8px' }}
                >
                  사진 바꾸기
                </Button>
              </div>

              <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>
                    웹사이트
                  </label>
                  <input
                    type="url"
                    placeholder="https://yourwebsite.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      fontSize: '14px',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                    프로필에 링크를 추가하여 방문자들을 외부 사이트로 안내하세요.
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>
                    이름
                  </label>
                  <input
                    type="text"
                    placeholder="이름"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      fontSize: '14px',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                    사람들이 회원님의 계정을 찾을 수 있도록 널리 알려진 이름을 사용하세요.
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>
                    사용자 이름
                  </label>
                  <input
                    type="text"
                    placeholder="사용자 이름"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      fontSize: '14px',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>
                    소개
                  </label>
                  <textarea
                    rows={4}
                    placeholder="자신을 표현해보세요 ✨"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={150}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      fontSize: '14px',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      resize: 'none',
                      lineHeight: 1.5,
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {bio.length} / 150
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>
                    성별
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      fontSize: '14px',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="female">여성</option>
                    <option value="male">남성</option>
                    <option value="custom">직접 지정</option>
                    <option value="not_specified">밝히고 싶지 않음</option>
                  </select>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 0',
                    borderTop: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ paddingRight: '16px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>프로필에 계정 추천 표시</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      사람들이 회원님의 프로필을 볼 때 유사한 추천 계정을 표시합니다.
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={showSuggestions}
                    onChange={(val) => {
                      setShowSuggestions(val);
                      localStorage.setItem('ig_show_suggestions', String(val));
                    }}
                  />
                </div>

                <div style={{ marginTop: '12px' }}>
                  <Button type="submit" variant="primary" size="md" style={{ padding: '10px 32px', fontWeight: 600 }}>
                    제출
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* TAB: PERSONAL DETAILS */}
          {activeTab === 'personal-details' && (
            <PersonalDetailsPanel showToast={showToast} />
          )}

          {/* TAB: PASSWORD & SECURITY */}
          {activeTab === 'password' && (
            <PasswordSecurityPanel showToast={showToast} />
          )}

          {/* TAB: TWO FACTOR AUTH */}
          {activeTab === 'two-factor' && (
            <TwoFactorPanel showToast={showToast} />
          )}

          {/* TAB: LOGIN ACTIVITY */}
          {activeTab === 'login-activity' && (
            <LoginActivityPanel showToast={showToast} />
          )}

          {/* TAB: ACCOUNT PRIVACY */}
          {activeTab === 'privacy' && (
            <div style={{ maxWidth: '600px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '28px' }}>
                계정 공개 범위
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ paddingRight: '20px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>비공개 계정</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      계정이 비공개 상태인 경우 승인한 사람만 회원님의 사진과 동영상을 볼 수 있습니다.
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={isPrivate}
                    onChange={(val) => {
                      setIsPrivate(val);
                      localStorage.setItem('ig_is_private', String(val));
                      updateProfile({ is_private: val });
                      showToast(val ? '비공개 계정으로 전환되었습니다.' : '공개 계정으로 전환되었습니다.');
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ paddingRight: '20px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>활동 상태 표시</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      마지막으로 활동한 시간을 메시지를 주고받은 사람들에게 표시합니다.
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={showActivityStatus}
                    onChange={(val) => {
                      setShowActivityStatus(val);
                      localStorage.setItem('ig_activity_status', String(val));
                      showToast(val ? '활동 상태 표시가 활성화되었습니다.' : '활동 상태 표시가 비활성화되었습니다.');
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ paddingRight: '20px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>스토리 메시지 공유 허용</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      다른 사람이 회원님의 스토리를 Direct 메시지로 공유할 수 있습니다.
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={allowStorySharing}
                    onChange={(val) => {
                      setAllowStorySharing(val);
                      localStorage.setItem('ig_story_sharing', String(val));
                      showToast(val ? '스토리 메시지 공유가 허용되었습니다.' : '스토리 메시지 공유가 비허용되었습니다.');
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB: CLOSE FRIENDS */}
          {activeTab === 'close-friends' && (
            <CloseFriendsPanel showToast={showToast} />
          )}

          {/* TAB: HIDDEN WORDS */}
          {activeTab === 'hidden-words' && (
            <HiddenWordsPanel showToast={showToast} />
          )}

          {/* TAB: TAGS & MENTIONS */}
          {activeTab === 'tags-mentions' && (
            <TagsMentionsPanel showToast={showToast} />
          )}

          {/* TAB: BLOCKED ACCOUNTS */}
          {activeTab === 'blocked' && (
            <div style={{ maxWidth: '600px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>
                차단된 계정
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                차단한 사용자는 회원님의 프로필이나 게시물을 볼 수 없습니다.
              </p>

              {blockedUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
                  <UserX size={40} style={{ margin: '0 auto 12px' }} />
                  <p style={{ fontSize: '15px' }}>차단된 계정이 없습니다.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {blockedUsers.map(bUser => (
                    <div
                      key={bUser.id}
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
                        <Avatar src={bUser.profile_image_url} size="md" />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '14px' }}>{bUser.username}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{bUser.full_name}</div>
                        </div>
                      </div>
                      <Button variant="secondary" size="sm" onClick={() => handleUnblock(bUser.id)}>
                        차단 해제
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: RESTRICTED ACCOUNTS */}
          {activeTab === 'restricted' && (
            <RestrictedAccountsPanel showToast={showToast} />
          )}

          {/* TAB: YOUR ACTIVITY OVERVIEW */}
          {activeTab === 'activity' && (
            <div style={{ maxWidth: '640px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>
                내 활동
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <div
                  onClick={() => handleSelectTab('saved')}
                  style={{
                    padding: '20px',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '14px',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔖</div>
                  <div style={{ fontWeight: 700, fontSize: '16px' }}>저장된 게시물</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    회원님이 컬렉션에 보관한 {posts.filter(p => p.isBookmarked).length}개의 콘텐츠
                  </div>
                </div>

                <div
                  onClick={() => handleSelectTab('liked-posts')}
                  style={{
                    padding: '20px',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '14px',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>❤️</div>
                  <div style={{ fontWeight: 700, fontSize: '16px' }}>좋아요한 콘텐츠</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    회원님이 공감한 {posts.filter(p => p.isLiked).length}개의 게시물
                  </div>
                </div>

                <div
                  onClick={() => handleSelectTab('search-history')}
                  style={{
                    padding: '20px',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '14px',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔍</div>
                  <div style={{ fontWeight: 700, fontSize: '16px' }}>최근 검색 내역</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    과거 검색 기록 및 지우기
                  </div>
                </div>

                <div
                  style={{
                    padding: '20px',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '14px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏱️</div>
                  <div style={{ fontWeight: 700, fontSize: '16px' }}>일일 평균 이용 시간</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    지난 7일간 평균 42분 이용
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: LIKED POSTS */}
          {activeTab === 'liked-posts' && (
            <LikedPostsPanel showToast={showToast} />
          )}

          {/* TAB: ARCHIVE */}
          {activeTab === 'archive' && (
            <ArchivePanel showToast={showToast} />
          )}

          {/* TAB: SEARCH HISTORY */}
          {activeTab === 'search-history' && (
            <SearchHistoryPanel showToast={showToast} />
          )}

          {/* TAB: PROFESSIONAL CONVERSION */}
          {activeTab === 'professional' && (
            <ProfessionalPanel showToast={showToast} />
          )}

          {/* TAB: INSIGHTS */}
          {activeTab === 'insights' && (
            <InsightsPanel />
          )}

          {/* TAB: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div style={{ maxWidth: '600px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '28px' }}>
                알림 설정
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700 }}>모두 일시 중단</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      푸시 알림을 일시적으로 수신하지 않습니다.
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={pauseAllNotifications}
                    onChange={(val) => {
                      setPauseAllNotifications(val);
                      localStorage.setItem('ig_pause_notifications', String(val));
                      showToast(val ? '모든 알림이 일시 중단되었습니다.' : '알림 수신이 재개되었습니다.');
                    }}
                  />
                </div>

                <div style={{ paddingBottom: '20px', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>좋아요 알림</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      { id: 'off', label: '해제' },
                      { id: 'following', label: '내가 팔로우하는 사람' },
                      { id: 'everyone', label: '모든 사람' }
                    ].map(opt => (
                      <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="likes_notif"
                          checked={likesNotif === opt.id}
                          onChange={() => {
                            setLikesNotif(opt.id);
                            localStorage.setItem('ig_likes_notif', opt.id);
                          }}
                          style={{ accentColor: 'var(--ig-primary-button)', width: '18px', height: '18px' }}
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700 }}>메시지 알림</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      새로운 Direct 메시지가 오면 알림을 받습니다.
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={directNotif}
                    onChange={(val) => {
                      setDirectNotif(val);
                      localStorage.setItem('ig_direct_notif', String(val));
                      showToast(val ? '메시지 알림이 켜졌습니다.' : '메시지 알림이 꺼졌습니다.');
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB: DISPLAY & THEME */}
          {activeTab === 'display' && (
            <div style={{ maxWidth: '600px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '28px' }}>
                디스플레이 및 미디어
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                <div style={{ paddingBottom: '24px', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>화면 모드 테마</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div
                      onClick={() => {
                        if (isDark) toggleTheme();
                      }}
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        border: !isDark ? '2px solid var(--ig-primary-button)' : '1px solid var(--border-color)',
                        backgroundColor: '#ffffff',
                        color: '#262626',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      <Sun size={24} color="#f59e0b" />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px' }}>라이트 모드</div>
                        <div style={{ fontSize: '12px', color: '#737373' }}>밝고 선명한 테마</div>
                      </div>
                    </div>

                    <div
                      onClick={() => {
                        if (!isDark) toggleTheme();
                      }}
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        border: isDark ? '2px solid var(--ig-primary-button)' : '1px solid var(--border-color)',
                        backgroundColor: '#121212',
                        color: '#f5f5f5',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      <Moon size={24} color="#3b82f6" />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px' }}>다크 모드</div>
                        <div style={{ fontSize: '12px', color: '#a8a8a8' }}>눈이 편안한 테마</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700 }}>항상 최고 화질로 업로드</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      네트워크 연결이 느려도 고화질 미디어를 업로드합니다.
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={highQualityUpload}
                    onChange={(val) => {
                      setHighQualityUpload(val);
                      localStorage.setItem('ig_high_quality_upload', String(val));
                      showToast(val ? '고화질 업로드가 설정되었습니다.' : '일반 화질 업로드가 설정되었습니다.');
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700 }}>동영상 자동 재생</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      피드 및 릴스에서 동영상을 자동으로 재생합니다.
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={autoplayVideos}
                    onChange={(val) => {
                      setAutoplayVideos(val);
                      localStorage.setItem('ig_autoplay_videos', String(val));
                      showToast(val ? '동영상 자동 재생이 켜졌습니다.' : '동영상 자동 재생이 꺼졌습니다.');
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB: HELP, FAQ & LEGAL */}
          {activeTab === 'help' && (
            <HelpLegalPanel showToast={showToast} />
          )}
          </div>
        </main>
      </div>

      {/* Change Avatar Modal */}
      <ChangeAvatarModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentAvatar={avatarUrl || user?.profile_image_url || user?.profileImageUrl}
        onAvatarChange={async (newUrl) => {
          try {
            setAvatarUrl(newUrl);
            if (updateAvatar) {
              await updateAvatar(newUrl);
            } else {
              await updateProfile({ profile_image_url: newUrl });
            }
            showToast('프로필 사진이 성공적으로 변경되었습니다.');
          } catch (err) {
            console.error('Failed to change avatar:', err);
            showToast('프로필 사진 변경 중 오류가 발생했습니다.');
          }
        }}
      />

      <style>{`
        @keyframes slideInFromRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        @media (max-width: 768px) {
          .settings-page-root {
            height: auto !important;
            min-height: 100vh !important;
            overflow: visible !important;
            animation: slideInFromRight 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            will-change: transform;
          }
          .settings-mobile-back-btn {
            display: flex !important;
          }
          .settings-card-wrapper {
            flex-direction: column !important;
            height: auto !important;
            overflow: visible !important;
          }
          .settings-sidebar.mobile-hidden {
            display: none !important;
          }
          .settings-sidebar.mobile-visible {
            display: flex !important;
            width: 100% !important;
            min-width: 0 !important;
            height: auto !important;
            border-right: none !important;
            border-bottom: 1px solid var(--border-color) !important;
            padding: 16px !important;
          }
          .settings-content-area.mobile-hidden {
            display: none !important;
          }
          .settings-content-area.mobile-visible {
            display: flex !important;
            padding: 16px 16px 80px 16px !important;
            height: auto !important;
            overflow: visible !important;
          }
          .settings-mobile-content-header {
            display: flex !important;
            align-items: center;
            justifyContent: space-between;
            padding: 0 0 16px 0;
            margin-bottom: 16px;
            border-bottom: 1px solid var(--border-color);
          }
          .settings-desktop-title {
            display: none !important;
          }
        }
        @media (min-width: 769px) {
          .settings-mobile-content-header {
            display: none !important;
          }
          .settings-sidebar {
            display: flex !important;
          }
          .settings-content-area {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
};
