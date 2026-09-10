import React, { useState } from 'react';
import { Archive, Calendar, Eye, RefreshCw } from 'lucide-react';
import { Button } from '../common/Button';

export const ArchivePanel = ({ showToast }) => {
  const [archiveTab, setArchiveTab] = useState(() => {
    return localStorage.getItem('ig_archive_tab') || 'posts';
  });

  const [archivedPosts, setArchivedPosts] = useState(() => {
    const saved = localStorage.getItem('ig_archived_posts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [
      {
        id: 801,
        mediaUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80',
        date: '2026. 07. 12',
        caption: '미니멀 인테리어 기록 🌿',
      },
      {
        id: 802,
        mediaUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
        date: '2026. 06. 04',
        caption: '지난 여름 해변 산책 🏖️',
      },
    ];
  });

  const [archivedStories] = useState([
    { id: 901, mediaUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80', date: '8월 14일' },
    { id: 902, mediaUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop&q=80', date: '8월 10일' },
    { id: 903, mediaUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=600&auto=format&fit=crop&q=80', date: '7월 28일' },
  ]);

  const handleRestoreToProfile = (postId) => {
    setArchivedPosts(prev => {
      const updated = prev.filter(p => p.id !== postId);
      localStorage.setItem('ig_archived_posts', JSON.stringify(updated));
      return updated;
    });
    showToast('게시물이 프로필에 다시 표시됩니다.');
  };

  return (
    <div style={{ maxWidth: '640px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>
          보관함
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          회원님만 볼 수 있도록 안전하게 보관된 과거의 게시물과 스토리입니다.
        </p>
      </div>

      {/* Tab Switcher */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '20px',
        }}
      >
        <button
          onClick={() => {
            setArchiveTab('posts');
            localStorage.setItem('ig_archive_tab', 'posts');
          }}
          style={{
            flex: 1,
            padding: '12px 0',
            fontSize: '14px',
            fontWeight: archiveTab === 'posts' ? 700 : 500,
            color: archiveTab === 'posts' ? 'var(--text-primary)' : 'var(--text-secondary)',
            borderBottom: archiveTab === 'posts' ? '2px solid var(--text-primary)' : '2px solid transparent',
            marginBottom: '-1px',
            cursor: 'pointer',
          }}
        >
          게시물 보관함 ({archivedPosts.length})
        </button>
        <button
          onClick={() => {
            setArchiveTab('stories');
            localStorage.setItem('ig_archive_tab', 'stories');
          }}
          style={{
            flex: 1,
            padding: '12px 0',
            fontSize: '14px',
            fontWeight: archiveTab === 'stories' ? 700 : 500,
            color: archiveTab === 'stories' ? 'var(--text-primary)' : 'var(--text-secondary)',
            borderBottom: archiveTab === 'stories' ? '2px solid var(--text-primary)' : '2px solid transparent',
            marginBottom: '-1px',
            cursor: 'pointer',
          }}
        >
          스토리 보관함 ({archivedStories.length})
        </button>
      </div>

      {/* Posts Archive Tab */}
      {archiveTab === 'posts' && (
        <div>
          {archivedPosts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
              <Archive size={40} style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: '15px', fontWeight: 600 }}>보관된 게시물이 없습니다.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {archivedPosts.map(p => (
                <div
                  key={p.id}
                  style={{
                    position: 'relative',
                    aspectRatio: '1 / 1',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: '#1a1a1a',
                  }}
                  className="grid-item-card"
                >
                  <img src={p.mediaUrl} alt="Archived" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      opacity: 0,
                      transition: 'opacity 0.2s ease',
                      padding: '12px',
                      color: '#ffffff',
                    }}
                    className="grid-hover-overlay"
                  >
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>{p.date}</span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleRestoreToProfile(p.id)}
                      style={{ fontSize: '11px', padding: '4px 10px', backgroundColor: '#ffffff', color: '#262626' }}
                    >
                      프로필에 표시
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stories Archive Tab */}
      {archiveTab === 'stories' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {archivedStories.map(s => (
            <div
              key={s.id}
              style={{
                position: 'relative',
                aspectRatio: '9 / 16',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: '#1a1a1a',
              }}
            >
              <img src={s.mediaUrl} alt="Story archive" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div
                style={{
                  position: 'absolute',
                  bottom: '8px',
                  left: '8px',
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: '6px',
                }}
              >
                {s.date}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
