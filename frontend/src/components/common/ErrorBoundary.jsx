import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--bg-primary, #ffffff)',
            color: 'var(--text-primary, #262626)',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
            일시적인 문제가 발생했습니다
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary, #737373)', marginBottom: '24px', maxWidth: '400px', lineHeight: 1.5 }}>
            화면을 불러오는 도중 오류가 감지되었습니다. 새로고침하거나 홈으로 이동해주세요.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                backgroundColor: 'var(--ig-primary-button, #0095f6)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              새로고침
            </button>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.href = '/';
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: 'var(--bg-secondary, #efefef)',
                color: 'var(--text-primary, #262626)',
                border: '1px solid var(--border-color, #dbdbdb)',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              홈으로 이동
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
