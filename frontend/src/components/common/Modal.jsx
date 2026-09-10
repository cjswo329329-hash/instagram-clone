import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({
  isOpen,
  onClose,
  children,
  showCloseButton = true,
  maxWidth = '500px',
  width = '90%',
  style = {}
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'var(--overlay-backdrop)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {showCloseButton && (
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            color: '#ffffff',
            cursor: 'pointer',
            zIndex: 10000,
            padding: '4px'
          }}
          aria-label="Close modal"
        >
          <X size={28} />
        </button>
      )}

      <div
        className="modal-enter"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          borderRadius: '16px',
          overflow: 'hidden',
          width: width,
          maxWidth: maxWidth,
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.4)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          ...style,
        }}
      >
        {children}
      </div>
    </div>
  );
};
