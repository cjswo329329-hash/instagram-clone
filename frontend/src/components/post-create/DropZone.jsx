import React, { useRef } from 'react';
import { Image as ImageIcon, UploadCloud } from 'lucide-react';
import { Button } from '../common/Button';

export const DropZone = ({ onSelectImages }) => {
  const fileInputRef = useRef(null);

  const sampleImages = [
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=900&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=900&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&auto=format&fit=crop&q=80"
  ];

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const urls = files.map(file => URL.createObjectURL(file));
    onSelectImages(urls, files);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const urls = files.map(file => URL.createObjectURL(file));
      onSelectImages(urls, files);
    }
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 24px',
        minHeight: '400px',
        textAlign: 'center',
      }}
    >
      <div style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>
        <ImageIcon size={72} strokeWidth={1} />
      </div>

      <h3 style={{ fontSize: '20px', fontWeight: 400, marginBottom: '16px' }}>
        사진과 동영상을 여기에 끌어다 놓으세요
      </h3>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <Button
        variant="primary"
        onClick={() => fileInputRef.current?.click()}
        style={{ marginBottom: '24px' }}
      >
        컴퓨터에서 선택
      </Button>

      {/* Quick Sample Selector for immediate delight */}
      <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', width: '100%' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
          또는 추천 샘플 사진으로 즉시 작성해 보세요:
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
          {sampleImages.map((url, idx) => (
            <img
              key={idx}
              src={url}
              alt="sample"
              onClick={() => onSelectImages([url])}
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '8px',
                objectFit: 'cover',
                cursor: 'pointer',
                border: '2px solid transparent',
                transition: 'transform 0.15s ease, border-color 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.08)';
                e.currentTarget.style.borderColor = 'var(--ig-primary-button)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.borderColor = 'transparent';
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
