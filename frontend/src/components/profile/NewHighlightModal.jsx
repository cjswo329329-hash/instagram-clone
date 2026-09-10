import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

export const NewHighlightModal = ({ isOpen, onClose, onAddHighlight }) => {
  const [title, setTitle] = useState('');
  const [selectedCover, setSelectedCover] = useState(
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=150&auto=format&fit=crop&q=80'
  );

  const sampleCovers = [
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=150&auto=format&fit=crop&q=80',
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddHighlight({
      id: Date.now(),
      title: title.trim(),
      coverUrl: selectedCover,
      slides: [
        {
          id: Date.now() + 1,
          mediaUrl: selectedCover,
          timeAgo: '방금 전',
        },
      ],
    });

    setTitle('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="380px"
      width="90%"
      showCloseButton={false}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{ color: 'var(--text-primary)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
            새 하이라이트
          </h3>
          <button
            type="submit"
            disabled={!title.trim()}
            style={{
              color: title.trim() ? 'var(--ig-primary-button)' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '14px',
              cursor: title.trim() ? 'pointer' : 'default',
            }}
          >
            추가
          </button>
        </div>

        {/* Highlight Title Input */}
        <div style={{ padding: '20px 16px 12px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
            하이라이트 이름
          </label>
          <input
            type="text"
            placeholder="하이라이트 이름 (예: 여행, 일상)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={15}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              fontSize: '14px',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
            }}
            autoFocus
          />
        </div>

        {/* Cover selector */}
        <div style={{ padding: '0 16px 24px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
            커버 선택
          </label>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {sampleCovers.map((url, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedCover(url)}
                style={{
                  position: 'relative',
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: selectedCover === url ? '3px solid var(--ig-primary-button)' : '1px solid var(--border-color)',
                  flexShrink: 0,
                }}
              >
                <img
                  src={url}
                  alt="Cover choice"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {selectedCover === url && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: 'rgba(0, 149, 246, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                    }}
                  >
                    <Check size={16} strokeWidth={3} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
};
