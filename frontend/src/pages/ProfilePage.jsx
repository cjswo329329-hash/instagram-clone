import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { StoryHighlights } from '../components/profile/StoryHighlights';
import { ProfileTabs } from '../components/profile/ProfileTabs';
import { PostGrid } from '../components/profile/PostGrid';
import { useAuth } from '../contexts/AuthContext';
import { userApi } from '../services';

export const ProfilePage = () => {
  const { username } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'posts';

  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [profileUser, setProfileUser] = useState(null);
  const [tabPosts, setTabPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  let effectiveUsername = username || user?.username || 'alex_creator';
  try {
    effectiveUsername = decodeURIComponent(effectiveUsername);
  } catch (e) {
    // fallback to original
  }
  const isMe = !username || (user && (username === user.username || effectiveUsername === user.username));

  // Sync tab with URL search parameter if changed externally
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['posts', 'reels', 'saved', 'tagged'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams(tabId === 'posts' ? {} : { tab: tabId });
  };

  // Fetch user profile (supports seamless background refresh without UI flashing)
  const fetchProfile = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const data = await userApi.getUserProfile(effectiveUsername);
      setProfileUser(data);
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      // Fallback
      if (isMe && user) {
        setProfileUser(user);
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [effectiveUsername, isMe, user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Reset state on target username change
  useEffect(() => {
    setProfileUser(null);
    setTabPosts([]);
  }, [effectiveUsername]);

  // Fetch posts for active tab
  useEffect(() => {
    let isCancelled = false;

    const loadTabContent = async () => {
      try {
        if (activeTab === 'saved') {
          const saved = await userApi.getSavedPosts();
          if (!isCancelled) setTabPosts(saved || []);
        } else if (activeTab === 'reels') {
          const reels = await userApi.getUserReels(effectiveUsername);
          if (!isCancelled) {
            const formatted = (reels || []).map(r => ({
              id: r.id,
              mediaUrl: r.posterUrl || r.videoUrl,
              likesCount: r.likesCount || 0,
              commentsCount: r.commentsCount || 0,
              isVideo: true,
            }));
            setTabPosts(formatted);
          }
        } else if (activeTab === 'posts') {
          const posts = await userApi.getUserPosts(effectiveUsername);
          if (!isCancelled) setTabPosts(posts || []);
        } else if (activeTab === 'tagged') {
          // Tagged mock fallback
          if (!isCancelled) setTabPosts([]);
        }
      } catch (err) {
        console.error(`Failed to load ${activeTab}:`, err);
      }
    };

    loadTabContent();
    return () => {
      isCancelled = true;
    };
  }, [activeTab, effectiveUsername]);

  const displayedUser = profileUser
    ? (isMe && user ? { ...user, ...profileUser } : profileUser)
    : (isMe && user
        ? {
            ...user,
            posts_count: user.posts_count || 0,
            followers_count: user.followers_count || 0,
            following_count: user.following_count || 0,
          }
        : {
            username: effectiveUsername,
            full_name: effectiveUsername,
            bio: '',
            profile_image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
            posts_count: 0,
            followers_count: 0,
            following_count: 0,
          });

  const isPrivateLocked = displayedUser?.is_private && !isMe && !displayedUser?.is_following;

  return (
    <div
      style={{
        maxWidth: '960px',
        margin: '0 auto',
        padding: '30px 16px 60px 16px',
        width: '100%',
      }}
      className="profile-page-container"
    >
      <ProfileHeader profileUser={displayedUser} isMe={isMe} onProfileRefresh={fetchProfile} />

      {isPrivateLocked ? (
        <div
          style={{
            borderTop: '1px solid var(--border-color)',
            marginTop: '32px',
            padding: '70px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            color: 'var(--text-primary)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              border: '2px solid var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <Lock size={32} />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
            비공개 계정입니다
          </h3>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', maxWidth: '320px', lineHeight: 1.4 }}>
            사진과 동영상을 보려면 팔로우하세요.
          </p>
        </div>
      ) : (
        <>
          <StoryHighlights isMe={isMe} />
          <ProfileTabs activeTab={activeTab} onChangeTab={handleTabChange} isMe={isMe} />
          <div style={{ marginTop: '20px' }}>
            <PostGrid posts={tabPosts} tab={activeTab} isMe={isMe} />
          </div>
        </>
      )}

      <style>{`
        @media (max-width: 768px) {
          .profile-page-container {
            padding: 14px 16px 40px 16px !important;
          }
        }
      `}</style>
    </div>
  );
};
