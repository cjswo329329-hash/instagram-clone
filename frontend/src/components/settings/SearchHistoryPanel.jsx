import React, { useState } from 'react';
import { Search, X, Hash, MapPin, Clock } from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { Button } from '../common/Button';

export const SearchHistoryPanel = ({ showToast }) => {
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('ig_search_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [
      { id: 1, type: 'user', title: 'cafe_vibes', subtitle: '성수동 카페 가이드', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150' },
      { id: 2, type: 'tag', title: '#성수동카페', subtitle: '게시물 12.8만개' },
      { id: 3, type: 'user', title: 'fashion_curator', subtitle: 'Sora Park', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
      { id: 4, type: 'place', title: '설악산 국립공원', subtitle: '강원도 속초시' },
      { id: 5, type: 'tag', title: '#미니멀인테리어', subtitle: '게시물 4.5만개' },
    ];
  });

  const handleRemoveItem = (id) => {
    setHistory(prev => {
      const updated = prev.filter(item => item.id !== id);
      localStorage.setItem('ig_search_history', JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearAll = () => {
    if (window.confirm('검색 내역을 모두 삭제하시겠습니까?')) {
      setHistory([]);
      localStorage.setItem('ig_search_history', JSON.stringify([]));
      showToast('검색 내역이 모두 삭제되었습니다.');
    }
  };

  return (
    <div style={{ maxWidth: '600px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>
            검색 내역
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            회원님이 검색 탭에서 검색한 계정, 태그 및 장소 기록입니다.
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={handleClearAll}
            style={{
              color: 'var(--ig-primary-button)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            모두 지우기
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          <Search size={40} style={{ margin: '0 auto 12px' }} />
          <p style={{ fontSize: '15px', fontWeight: 600 }}>검색 내역이 없습니다.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {history.map(item => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {item.type === 'user' ? (
                  <Avatar src={item.avatar} size="md" alt={item.title} />
                ) : (
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {item.type === 'tag' ? <Hash size={18} /> : <MapPin size={18} />}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {item.subtitle}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleRemoveItem(item.id)}
                style={{
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '6px',
                }}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
