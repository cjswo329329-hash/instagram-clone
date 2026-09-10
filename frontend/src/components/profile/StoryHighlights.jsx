import React, { useState } from 'react';
import { profileHighlights as defaultHighlights } from '../../data/mockData';
import { Plus } from 'lucide-react';
import { HighlightViewerModal } from './HighlightViewerModal';
import { NewHighlightModal } from './NewHighlightModal';

export const StoryHighlights = ({ isMe = true }) => {
  const [highlights, setHighlights] = useState(() => {
    const saved = localStorage.getItem('ig_profile_highlights');
    return saved ? JSON.parse(saved) : defaultHighlights;
  });

  const [activeHighlight, setActiveHighlight] = useState(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const handleAddHighlight = (newHl) => {
    const updated = [newHl, ...highlights];
    setHighlights(updated);
    localStorage.setItem('ig_profile_highlights', JSON.stringify(updated));
  };

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          padding: '0 20px 40px 20px',
          overflowX: 'auto',
        }}
        className="no-scrollbar"
      >
        {/* Existing highlights */}
        {highlights.map((hl) => (
          <div
            key={hl.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            onClick={() => setActiveHighlight(hl)}
          >
            <div
              style={{
                padding: '3px',
                borderRadius: '50%',
                border: '1px solid var(--border-color)',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
            >
              <img
                src={hl.coverUrl}
                alt={hl.title}
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </div>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                maxWidth: '78px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textAlign: 'center',
              }}
            >
              {hl.title}
            </span>
          </div>
        ))}

        {/* New Highlight addition button (Only for isMe) */}
        {isMe && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            onClick={() => setIsNewModalOpen(true)}
          >
            <div
              style={{
                width: '78px',
                height: '78px',
                borderRadius: '50%',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--bg-secondary)',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
            >
              <Plus size={28} strokeWidth={1.5} color="var(--text-secondary)" />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
              신규
            </span>
          </div>
        )}
      </div>

      {/* Viewer Modal */}
      <HighlightViewerModal
        isOpen={!!activeHighlight}
        onClose={() => setActiveHighlight(null)}
        highlight={activeHighlight}
      />

      {/* New Highlight Creator Modal */}
      <NewHighlightModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onAddHighlight={handleAddHighlight}
      />
    </>
  );
};
