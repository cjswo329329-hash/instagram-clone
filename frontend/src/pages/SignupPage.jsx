import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/common/Button';

export const SignupPage = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await signup({ username, email, full_name: fullName, password });
      if (res.success) {
        const from = location.state?.from?.pathname || searchParams.get('returnUrl') || '/';
        navigate(from, { replace: true });
      } else {
        setError(res.error || '회원가입에 실패했습니다.');
      }
    } catch (err) {
      setError('서버 연결 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '24px 16px',
        backgroundColor: 'var(--bg-secondary)',
      }}
    >
      <div style={{ width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div
          style={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '1px',
            padding: '40px 36px 24px 36px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <span className="brand-logo" style={{ color: 'var(--text-primary)', marginBottom: '14px' }}>
            Instagram
          </span>

          <p
            style={{
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              textAlign: 'center',
              lineHeight: 1.4,
              marginBottom: '20px',
            }}
          >
            친구들의 사진과 동영상을 보려면 가입하세요.
          </p>

          <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
              type="text"
              placeholder="휴대폰 번호 또는 이메일 주소"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 8px',
                fontSize: '12px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '3px',
                color: 'var(--text-primary)',
              }}
            />

            <input
              type="text"
              placeholder="성명"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 8px',
                fontSize: '12px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '3px',
                color: 'var(--text-primary)',
              }}
            />

            <input
              type="text"
              placeholder="사용자 이름"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 8px',
                fontSize: '12px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '3px',
                color: 'var(--text-primary)',
              }}
            />

            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 8px',
                fontSize: '12px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '3px',
                color: 'var(--text-primary)',
              }}
            />

            {error && (
              <div style={{ color: '#ed4956', fontSize: '13px', textAlign: 'center', margin: '4px 0' }}>
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              fullWidth={true}
              loading={loading}
              disabled={!username || !password || loading}
              style={{ marginTop: '12px', padding: '7px 0', borderRadius: '8px' }}
            >
              가입
            </Button>
          </form>
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '1px',
            padding: '20px',
            textAlign: 'center',
            fontSize: '14px',
          }}
        >
          계정이 있으신가요?{' '}
          <NavLink to="/login" style={{ color: 'var(--ig-primary-button)', fontWeight: 600 }}>
            로그인
          </NavLink>
        </div>
      </div>
    </div>
  );
};
