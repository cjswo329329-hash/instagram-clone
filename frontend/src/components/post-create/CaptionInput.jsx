import React, { useState } from 'react';
import { MapPin, Smile } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../common/Avatar';

export const CaptionInput = ({
  images,
  aspectRatio,
  caption,
  onChangeCaption,
  location,
  onChangeLocation
}) => {
  const { user } = useAuth();
  const [showEmojis, setShowEmojis] = useState(false);

  const emojis = ['😊', '☕️', '✨', '📸', '✈️', '🥐', '❤️', '🔥', '🌿', '🎨'];

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '440px',
        maxHeight: '540px',
        width: '100%',
      }}
      className="caption-modal-body"
    >
      {/* Left Media Preview */}
      <div
        style={{
          flex: '1.2',
          backgroundColor: '#000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <img
          src={images[0]}
          alt="Post preview"
          style={{
            width: '100%',
            height: '100%',
            aspectRatio: aspectRatio,
            objectFit: 'cover',
          }}
        />
      </div>

      {/* Right Metadata Editor */}
      <div
        style={{
          flex: '1',
          display: 'flex',
          flexDirection: 'column',
          padding: '16px',
          borderLeft: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-primary)',
        }}
      >
        {/* User header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <Avatar src={user?.profile_image_url} size="sm" />
          <span style={{ fontSize: '14px', fontWeight: 600 }}>{user?.username}</span>
        </div>

        {/* Caption Textarea */}
        <textarea
          placeholder="문구를 입력하세요..."
          value={caption}
          onChange={(e) => onChangeCaption(e.target.value)}
          rows={6}
          maxLength={2200}
          style={{
            width: '100%',
            resize: 'none',
            fontSize: '14px',
            lineHeight: 1.5,
            color: 'var(--text-primary)',
            flex: 1,
          }}
        />

        {/* Emojis and Character count */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 0',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <button
            type="button"
            onClick={() => setShowEmojis(!showEmojis)}
            style={{ color: 'var(--text-secondary)' }}
          >
            <Smile size={20} />
          </button>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {caption.length}/2,200
          </span>
        </div>

        {showEmojis && (
          <div style={{ display: 'flex', gap: '6px', padding: '6px 0', flexWrap: 'wrap' }}>
            {emojis.map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => onChangeCaption(caption + em)}
                style={{ fontSize: '16px' }}
              >
                {em}
              </button>
            ))}
          </div>
        )}

        {/* Location Input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 0',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <input
            type="text"
            placeholder="위치 추가"
            value={location}
            onChange={(e) => onChangeLocation(e.target.value)}
            style={{ flex: 1, fontSize: '14px', color: 'var(--text-primary)' }}
          />
          <MapPin size={18} color="var(--text-secondary)" />
        </div>
      </div>

      <style>{`
        @media (max-width: 680px) {
          .caption-modal-body {
            flex-direction: column !important;
            max-height: 80vh !important;
            overflow-y: auto !important;
          }
        }
      `}</style>
    </div>
  );
};
