import React from 'react';

export const Button = ({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'follow' | 'following' | 'text'
  size = 'md', // 'sm' | 'md' | 'lg'
  onClick,
  disabled = false,
  loading = false,
  fullWidth = false,
  type = 'button',
  style = {},
  className = ''
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: 'var(--ig-primary-button)',
          color: '#ffffff',
          fontWeight: 600,
        };
      case 'secondary':
        return {
          backgroundColor: 'var(--border-color)',
          color: 'var(--text-primary)',
          fontWeight: 600,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)',
          fontWeight: 600,
        };
      case 'follow':
        return {
          backgroundColor: 'var(--ig-primary-button)',
          color: '#ffffff',
          fontWeight: 600,
        };
      case 'following':
        return {
          backgroundColor: 'var(--badge-bg)',
          color: 'var(--text-primary)',
          fontWeight: 600,
        };
      case 'text':
        return {
          backgroundColor: 'transparent',
          color: 'var(--ig-primary-button)',
          fontWeight: 600,
          padding: 0,
        };
      default:
        return {};
    }
  };

  const getSizeStyles = () => {
    if (variant === 'text') return {};
    switch (size) {
      case 'sm':
        return { padding: '5px 12px', fontSize: '13px', borderRadius: '8px' };
      case 'lg':
        return { padding: '9px 24px', fontSize: '15px', borderRadius: '8px' };
      case 'md':
      default:
        return { padding: '7px 16px', fontSize: '14px', borderRadius: '8px' };
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        width: fullWidth ? '100%' : 'auto',
        transition: 'all 0.15s ease-in-out',
        ...getVariantStyles(),
        ...getSizeStyles(),
        ...style,
      }}
    >
      {loading ? (
        <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
      ) : (
        children
      )}
    </button>
  );
};
