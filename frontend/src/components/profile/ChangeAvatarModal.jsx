import React, { useRef, useState } from 'react';
import { Modal } from '../common/Modal';
import { uploadApi } from '../../services';

export const ChangeAvatarModal = ({ isOpen, onClose, currentAvatar, onAvatarChange }) => {
  const fileInputRef = useRef(null);
  const [showPresets, setShowPresets] = useState(false);
  const [uploading, setUploading] = useState(false);

  const sampleAvatars = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80"
  ];

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setUploading(true);
        const res = await uploadApi.uploadMedia(file, 'profiles');
        if (res && res.url) {
          await onAvatarChange(res.url);
          onClose();
        } else {
          throw new Error('업로드 결과에 파일 URL이 없습니다.');
        }
      } catch (err) {
        console.error('Failed to upload avatar to backend, fallback to local preview:', err);
        const reader = new FileReader();
        reader.onload = async (loadEvent) => {
          const dataUrl = loadEvent.target?.result;
          if (dataUrl) {
            await onAvatarChange(dataUrl);
            onClose();
          }
        };
        reader.readAsDataURL(file);
      } finally {
        setUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const handleSelectPreset = (url) => {
    onAvatarChange(url);
    setShowPresets(false);
    onClose();
  };

  const handleRemovePhoto = () => {
    onAvatarChange('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="400px"
      width="90%"
      showCloseButton={false}
    >
      <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'center' }}>
        <div style={{ padding: '24px 16px 20px', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
            프로필 사진 바꾸기
          </h3>
        </div>

        {/* Hidden file input for native upload */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />

        <button
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: '14px',
            color: uploading ? 'var(--text-muted)' : 'var(--ig-primary-button)',
            fontWeight: 700,
            fontSize: '14px',
            borderBottom: '1px solid var(--border-color)',
            cursor: uploading ? 'not-allowed' : 'pointer',
          }}
        >
          {uploading ? '사진 업로드 중...' : '사진 업로드'}
        </button>

        <button
          onClick={() => setShowPresets(!showPresets)}
          style={{
            padding: '14px',
            color: 'var(--text-primary)',
            fontWeight: 600,
            fontSize: '14px',
            borderBottom: '1px solid var(--border-color)',
            cursor: 'pointer',
          }}
        >
          추천 아바타에서 선택
        </button>

        {showPresets && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              justifyContent: 'center',
              padding: '16px',
              backgroundColor: 'var(--bg-secondary)',
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            {sampleAvatars.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt={`Preset ${idx + 1}`}
                onClick={() => handleSelectPreset(url)}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  cursor: 'pointer',
                  border: currentAvatar === url ? '3px solid var(--ig-primary-button)' : '2px solid transparent',
                  transition: 'transform 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
              />
            ))}
          </div>
        )}

        <button
          onClick={handleRemovePhoto}
          style={{
            padding: '14px',
            color: 'var(--ig-danger)',
            fontWeight: 700,
            fontSize: '14px',
            borderBottom: '1px solid var(--border-color)',
            cursor: 'pointer',
          }}
        >
          현재 사진 삭제
        </button>

        <button
          onClick={onClose}
          style={{
            padding: '14px',
            color: 'var(--text-primary)',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          취소
        </button>
      </div>
    </Modal>
  );
};
