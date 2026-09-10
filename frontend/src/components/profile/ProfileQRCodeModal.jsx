import React, { useState } from 'react';
import { X, Copy, Check, Download } from 'lucide-react';
import { Modal } from '../common/Modal';

export const ProfileQRCodeModal = ({ isOpen, onClose, username }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const profileUrl = `${window.location.origin}/${username}`;
    navigator.clipboard?.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="380px"
      width="90%"
      showCloseButton={false}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)',
          borderRadius: '16px',
          padding: '32px 24px 28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          color: '#ffffff',
        }}
      >
        {/* Close icon */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            color: '#ffffff',
            cursor: 'pointer',
            padding: '6px',
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={18} />
        </button>

        {/* QR Card Container */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            maxWidth: '260px',
          }}
        >
          {/* Instagram Camera Vector */}
          <div style={{ marginBottom: '16px', color: '#262626' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </div>

          {/* SVG QR Code Simulation */}
          <div
            style={{
              width: '180px',
              height: '180px',
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <svg width="180" height="180" viewBox="0 0 120 120">
              {/* Corner 1 */}
              <rect x="10" y="10" width="30" height="30" fill="#262626" rx="4" />
              <rect x="15" y="15" width="20" height="20" fill="#ffffff" rx="2" />
              <rect x="19" y="19" width="12" height="12" fill="#262626" rx="1" />

              {/* Corner 2 */}
              <rect x="80" y="10" width="30" height="30" fill="#262626" rx="4" />
              <rect x="85" y="15" width="20" height="20" fill="#ffffff" rx="2" />
              <rect x="89" y="19" width="12" height="12" fill="#262626" rx="1" />

              {/* Corner 3 */}
              <rect x="10" y="80" width="30" height="30" fill="#262626" rx="4" />
              <rect x="15" y="85" width="20" height="20" fill="#ffffff" rx="2" />
              <rect x="19" y="89" width="12" height="12" fill="#262626" rx="1" />

              {/* Data Blocks */}
              <rect x="48" y="12" width="6" height="6" fill="#262626" />
              <rect x="62" y="16" width="8" height="6" fill="#262626" />
              <rect x="52" y="26" width="14" height="6" fill="#262626" />
              <rect x="12" y="48" width="6" height="8" fill="#262626" />
              <rect x="24" y="56" width="12" height="6" fill="#262626" />
              <rect x="48" y="48" width="24" height="24" fill="#262626" rx="4" />
              <circle cx="60" cy="60" r="6" fill="#ffffff" />
              <rect x="80" y="48" width="8" height="14" fill="#262626" />
              <rect x="96" y="56" width="10" height="8" fill="#262626" />
              <rect x="48" y="84" width="8" height="12" fill="#262626" />
              <rect x="64" y="80" width="12" height="8" fill="#262626" />
              <rect x="84" y="84" width="14" height="8" fill="#262626" />
              <rect x="74" y="98" width="18" height="8" fill="#262626" />
              <rect x="100" y="100" width="8" height="8" fill="#262626" />
            </svg>
          </div>

          <div
            style={{
              marginTop: '14px',
              fontWeight: 700,
              fontSize: '15px',
              color: '#262626',
              letterSpacing: '0.2px',
            }}
          >
            @{username}
          </div>
        </div>

        {/* Scan instruction */}
        <p
          style={{
            marginTop: '16px',
            fontSize: '13px',
            fontWeight: 500,
            textAlign: 'center',
            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
          }}
        >
          Instagram에서 이 QR 코드를 스캔하여 바로 프로필을 확인하세요.
        </p>

        {/* Action Button */}
        <button
          onClick={handleCopyLink}
          style={{
            marginTop: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#ffffff',
            color: '#262626',
            padding: '10px 20px',
            borderRadius: '24px',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {copied ? <Check size={16} color="#0095f6" /> : <Copy size={16} />}
          <span>{copied ? '링크가 복사되었습니다!' : '프로필 링크 복사'}</span>
        </button>
      </div>
    </Modal>
  );
};
