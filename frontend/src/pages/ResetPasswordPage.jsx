import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, CheckCircle2, AlertCircle, KeyRound, Sparkles } from 'lucide-react';
import { Button } from '../components/common/Button';
import { authApi } from '../services';

export const ResetPasswordPage = () => {
  const navigate = useNavigate();

  // Step: 'REQUEST' | 'CONFIRM'
  const [step, setStep] = useState('REQUEST');
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [devCode, setDevCode] = useState('');

  // 1단계: 인증코드 발급 요청
  const handleRequestCode = async (e) => {
    if (e) e.preventDefault();
    if (!identifier.trim()) {
      setError('사용자 이름 또는 이메일을 입력해주세요.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await authApi.requestPasswordReset(identifier.trim());
      if (res.success) {
        setMaskedEmail(res.masked_email || '');
        setDevCode(res.dev_code || '');
        setStep('CONFIRM');
        setError('');
      } else {
        setError(res.detail || res.message || '인증코드 요청에 실패했습니다.');
      }
    } catch (err) {
      console.error('Password reset request error:', err);
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : '계정을 찾을 수 없거나 서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 2단계: 인증코드 검증 및 비밀번호 재설정
  const handleConfirmReset = async (e) => {
    if (e) e.preventDefault();
    setError('');

    if (!code.trim()) {
      setError('6자리 인증 코드를 입력해주세요.');
      return;
    }
    if (!newPassword) {
      setError('새 비밀번호를 입력해주세요.');
      return;
    }
    if (newPassword.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    setLoading(true);

    try {
      const res = await authApi.confirmPasswordReset({
        username_or_email: identifier.trim(),
        code: code.trim(),
        new_password: newPassword,
      });

      if (res.success) {
        setSuccessMsg(res.message || '비밀번호가 성공적으로 변경되었습니다.');
        setTimeout(() => {
          navigate('/login', {
            replace: true,
            state: {
              message: '비밀번호가 성공적으로 재설정되었습니다. 새로운 비밀번호로 로그인해주세요.',
              prefillUsername: identifier.trim(),
            },
          });
        }, 1200);
      } else {
        setError(res.detail || res.message || '비밀번호 재설정에 실패했습니다.');
      }
    } catch (err) {
      console.error('Password reset confirm error:', err);
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : '비밀번호 재설정 중 오류가 발생했습니다.');
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
        backgroundColor: 'var(--bg-primary)',
        padding: '24px 16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '388px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* Main Card Container */}
        <div
          style={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '1px',
            padding: '36px 36px 28px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          {/* Lock Badge Icon */}
          <div
            style={{
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              border: '2px solid var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              color: 'var(--text-primary)',
            }}
          >
            {step === 'REQUEST' ? <Lock size={46} strokeWidth={1.5} /> : <KeyRound size={46} strokeWidth={1.5} />}
          </div>

          <h2
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '10px',
            }}
          >
            {step === 'REQUEST' ? '로그인에 문제가 있나요?' : '새 비밀번호 설정'}
          </h2>

          <p
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              lineHeight: 1.45,
              marginBottom: '18px',
              wordBreak: 'keep-all',
            }}
          >
            {step === 'REQUEST' ? (
              '사용자 이름 또는 이메일을 입력하시면 계정에 다시 로그인할 수 있는 인증 코드를 보내드립니다.'
            ) : (
              <span>
                등록된 이메일(<strong>{maskedEmail || '이메일'}</strong>)로 전송된 6자리 인증 코드를 입력하고 새로운 비밀번호를 설정해주세요.
              </span>
            )}
          </p>

          {/* Error Banner */}
          {error && (
            <div
              style={{
                width: '100%',
                padding: '10px 12px',
                marginBottom: '14px',
                borderRadius: '6px',
                backgroundColor: 'rgba(237, 73, 86, 0.08)',
                border: '1px solid rgba(237, 73, 86, 0.3)',
                color: '#ed4956',
                fontSize: '13px',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                wordBreak: 'keep-all',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div
              style={{
                width: '100%',
                padding: '10px 12px',
                marginBottom: '14px',
                borderRadius: '6px',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                color: '#16a34a',
                fontSize: '13px',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* STEP 1: REQUEST CODE */}
          {step === 'REQUEST' && (
            <form onSubmit={handleRequestCode} style={{ width: '100%' }}>
              <input
                type="text"
                placeholder="사용자 이름 또는 이메일"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  padding: '10px 9px',
                  fontSize: '12px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  color: 'var(--text-primary)',
                  marginBottom: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />

              <Button
                type="submit"
                variant="primary"
                fullWidth={true}
                loading={loading}
                disabled={!identifier.trim() || loading}
                style={{
                  padding: '8px 0',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '14px',
                }}
              >
                로그인 링크/인증 코드 받기
              </Button>

              {/* Dev/Demo Quick Buttons */}
              <div
                style={{
                  marginTop: '16px',
                  paddingTop: '12px',
                  borderTop: '1px dashed var(--border-color)',
                  width: '100%',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                }}
              >
                <div style={{ marginBottom: '6px', fontSize: '11px' }}>⚡ 빠른 테스트용 계정 선택:</div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setIdentifier('alex_creator')}
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                    }}
                  >
                    alex_creator
                  </button>
                  <button
                    type="button"
                    onClick={() => setIdentifier('admin')}
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                    }}
                  >
                    admin
                  </button>
                  <button
                    type="button"
                    onClick={() => setIdentifier('cafe_vibes')}
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                    }}
                  >
                    cafe_vibes
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* STEP 2: CONFIRM CODE & SET NEW PASSWORD */}
          {step === 'CONFIRM' && (
            <form onSubmit={handleConfirmReset} style={{ width: '100%' }}>
              {/* Dev Helper Banner */}
              {devCode && (
                <div
                  style={{
                    backgroundColor: 'rgba(0, 149, 246, 0.08)',
                    border: '1px solid rgba(0, 149, 246, 0.25)',
                    borderRadius: '6px',
                    padding: '10px 12px',
                    marginBottom: '14px',
                    fontSize: '12px',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={16} color="var(--ig-primary-button)" />
                    <span>인증코드: <strong style={{ letterSpacing: '1px', fontSize: '13px' }}>{devCode}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCode(devCode)}
                    style={{
                      padding: '3px 8px',
                      fontSize: '11px',
                      backgroundColor: 'var(--ig-primary-button)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    자동 입력
                  </button>
                </div>
              )}

              <input
                type="text"
                placeholder="6자리 인증 코드"
                value={code}
                maxLength={6}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                autoFocus
                style={{
                  width: '100%',
                  padding: '10px 9px',
                  fontSize: '14px',
                  letterSpacing: '2px',
                  textAlign: 'center',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  color: 'var(--text-primary)',
                  marginBottom: '10px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />

              <input
                type="password"
                placeholder="새 비밀번호 (6자 이상)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 9px',
                  fontSize: '12px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  color: 'var(--text-primary)',
                  marginBottom: '10px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />

              <input
                type="password"
                placeholder="새 비밀번호 확인"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 9px',
                  fontSize: '12px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  color: 'var(--text-primary)',
                  marginBottom: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />

              <Button
                type="submit"
                variant="primary"
                fullWidth={true}
                loading={loading}
                disabled={!code || !newPassword || !confirmPassword || loading}
                style={{
                  padding: '8px 0',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '14px',
                }}
              >
                비밀번호 재설정
              </Button>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '14px',
                  fontSize: '12px',
                }}
              >
                <button
                  type="button"
                  onClick={handleRequestCode}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--ig-primary-button)',
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  인증 코드 다시 받기
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep('REQUEST');
                    setCode('');
                    setError('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: '12px',
                  }}
                >
                  다른 계정으로 시도
                </button>
              </div>
            </form>
          )}

          {/* Divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              margin: '24px 0 16px',
            }}
          >
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
            <span
              style={{
                padding: '0 18px',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
              }}
            >
              또는
            </span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
          </div>

          {/* Link to Signup */}
          <NavLink
            to="/signup"
            style={{
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            새 계정 만들기
          </NavLink>
        </div>

        {/* Back to Login Footer Box */}
        <div
          style={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '1px',
            padding: '16px',
            textAlign: 'center',
          }}
        >
          <NavLink
            to="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={16} />
            <span>로그인으로 돌아가기</span>
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
