import React, { useState } from 'react';
import {
  Shield,
  Eye,
  EyeOff,
  Check,
  X,
  AlertCircle,
  HelpCircle,
  Lock,
  Smartphone,
  Info
} from 'lucide-react';
import { Button } from '../common/Button';
import { authApi } from '../../services';
import { useAuth } from '../../contexts/AuthContext';

export const PasswordSecurityPanel = ({ showToast }) => {
  const { user } = useAuth();

  // Form states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility toggles
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // "Forgot Password" Modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  // Criteria calculations for new password
  const hasMinLength = newPassword.length >= 6;
  const hasLetter = /[a-zA-Z가-힣]/.test(newPassword);
  const hasNumberOrSymbol = /[\d\W_]/.test(newPassword);
  const isDifferentFromOld = oldPassword ? newPassword !== oldPassword : true;

  // Strength calculation
  const getPasswordStrength = () => {
    if (!newPassword) return 0;
    let score = 0;
    if (hasMinLength) score += 25;
    if (newPassword.length >= 10) score += 15;
    if (hasLetter) score += 20;
    if (hasNumberOrSymbol) score += 20;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) && /\d/.test(newPassword)) score += 20;
    return Math.min(score, 100);
  };

  const strength = getPasswordStrength();
  const getStrengthLabel = () => {
    if (strength === 0) return '';
    if (strength < 40) return '취약함';
    if (strength < 75) return '보통';
    return '안전함';
  };

  const getStrengthColor = () => {
    if (strength < 40) return '#ed4956'; // red
    if (strength < 75) return '#f59e0b'; // amber
    return '#10b981'; // emerald green
  };

  const isMatching = confirmPassword.length > 0 && newPassword === confirmPassword;
  const isMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  // Submit password change
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setFieldErrors({});

    const trimmedOld = oldPassword.trim();
    const trimmedNew = newPassword.trim();

    if (!trimmedOld) {
      setFieldErrors({ old: '이전 비밀번호를 입력해주세요.' });
      return;
    }
    if (trimmedNew.length < 6) {
      setFieldErrors({ new: '새 비밀번호는 6자 이상이어야 합니다.' });
      return;
    }
    if (trimmedNew === trimmedOld) {
      setFieldErrors({ new: '새 비밀번호는 이전 비밀번호와 달라야 합니다.' });
      return;
    }
    if (trimmedNew !== confirmPassword) {
      setFieldErrors({ confirm: '새 비밀번호가 일치하지 않습니다.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.changePassword(trimmedOld, trimmedNew);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrorMessage('');
      setFieldErrors({});
      showToast('비밀번호가 안전하게 변경되었습니다.');
    } catch (err) {
      console.error('Password change error:', err);
      let detailMsg = '비밀번호 변경에 실패했습니다. 이전 비밀번호를 다시 확인해주세요.';

      const data = err.response?.data;
      if (typeof data?.detail === 'string') {
        detailMsg = data.detail;
      } else if (Array.isArray(data?.detail) && data.detail.length > 0) {
        detailMsg = data.detail[0].msg || detailMsg;
      } else if (data?.message) {
        detailMsg = data.message;
      }

      setErrorMessage(detailMsg);
      if (detailMsg.includes('이전 비밀번호')) {
        setFieldErrors({ old: detailMsg });
      } else if (detailMsg.includes('새 비밀번호')) {
        setFieldErrors({ new: detailMsg });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle simulate reset link
  const handleSendResetEmail = () => {
    setIsSendingReset(true);
    setTimeout(() => {
      setIsSendingReset(false);
      setIsForgotModalOpen(false);
      showToast(`'${user?.email || '등록된 이메일'}'로 비밀번호 재설정 링크가 전송되었습니다.`);
    }, 1200);
  };

  return (
    <div style={{ maxWidth: '540px' }}>
      {/* Title & Description */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
          비밀번호 및 보안
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          계정을 안전하게 보호하기 위해 다른 사이트에서 사용하지 않는 고유한 비밀번호를 권장합니다.
        </p>
      </div>

      {/* Error Banner if any */}
      {errorMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            backgroundColor: 'rgba(237, 73, 86, 0.1)',
            border: '1px solid rgba(237, 73, 86, 0.3)',
            borderRadius: '10px',
            color: '#ed4956',
            fontSize: '13px',
            marginBottom: '20px',
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Password Change Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* 1. Current Password */}
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
            이전 비밀번호
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showOldPassword ? 'text' : 'password'}
              placeholder="현재 사용 중인 비밀번호"
              value={oldPassword}
              onChange={(e) => {
                setOldPassword(e.target.value);
                if (fieldErrors.old) setFieldErrors(prev => ({ ...prev, old: null }));
              }}
              style={{
                width: '100%',
                padding: '12px 42px 12px 14px',
                border: `1px solid ${fieldErrors.old ? '#ed4956' : 'var(--border-color)'}`,
                borderRadius: '10px',
                fontSize: '14px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
            />
            <button
              type="button"
              onClick={() => setShowOldPassword(!showOldPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
              }}
              title={showOldPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
              aria-label="Toggle password visibility"
            >
              {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {fieldErrors.old && (
            <span style={{ display: 'block', color: '#ed4956', fontSize: '12px', marginTop: '6px' }}>
              {fieldErrors.old}
            </span>
          )}

          {/* Forgot Password Link */}
          <div style={{ marginTop: '8px', textAlign: 'right' }}>
            <button
              type="button"
              onClick={() => setIsForgotModalOpen(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--ig-primary-button)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              비밀번호를 잊으셨나요?
            </button>
          </div>
        </div>

        {/* 2. New Password */}
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
            새 비밀번호
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showNewPassword ? 'text' : 'password'}
              placeholder="새 비밀번호 (6자 이상)"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (fieldErrors.new) setFieldErrors(prev => ({ ...prev, new: null }));
              }}
              style={{
                width: '100%',
                padding: '12px 42px 12px 14px',
                border: `1px solid ${fieldErrors.new ? '#ed4956' : 'var(--border-color)'}`,
                borderRadius: '10px',
                fontSize: '14px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
              }}
              title={showNewPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
              aria-label="Toggle password visibility"
            >
              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {fieldErrors.new && (
            <span style={{ display: 'block', color: '#ed4956', fontSize: '12px', marginTop: '6px' }}>
              {fieldErrors.new}
            </span>
          )}

          {/* Password Strength Indicator */}
          {newPassword && (
            <div style={{ marginTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>비밀번호 안전도</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: getStrengthColor() }}>
                  {getStrengthLabel()}
                </span>
              </div>
              <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${strength}%`,
                    height: '100%',
                    backgroundColor: getStrengthColor(),
                    transition: 'width 0.3s ease, background-color 0.3s ease',
                  }}
                />
              </div>

              {/* Requirement Checklist */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '10px', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasMinLength ? '#10b981' : 'var(--text-muted)' }}>
                  {hasMinLength ? <Check size={14} /> : <X size={14} />}
                  <span>6자 이상으로 구성</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasLetter ? '#10b981' : 'var(--text-muted)' }}>
                  {hasLetter ? <Check size={14} /> : <X size={14} />}
                  <span>문자(영문/한글) 포함</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasNumberOrSymbol ? '#10b981' : 'var(--text-muted)' }}>
                  {hasNumberOrSymbol ? <Check size={14} /> : <X size={14} />}
                  <span>숫자 또는 특수문자 포함</span>
                </div>
                {oldPassword && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isDifferentFromOld ? '#10b981' : '#ed4956' }}>
                    {isDifferentFromOld ? <Check size={14} /> : <X size={14} />}
                    <span>이전 비밀번호와 다른 새로운 조합</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 3. Confirm New Password */}
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
            새 비밀번호 확인
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="새 비밀번호 다시 입력"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (fieldErrors.confirm) setFieldErrors(prev => ({ ...prev, confirm: null }));
              }}
              style={{
                width: '100%',
                padding: '12px 42px 12px 14px',
                border: `1px solid ${
                  fieldErrors.confirm || isMismatch
                    ? '#ed4956'
                    : isMatching
                    ? '#10b981'
                    : 'var(--border-color)'
                }`,
                borderRadius: '10px',
                fontSize: '14px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
              }}
              title={showConfirmPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
              aria-label="Toggle password visibility"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {fieldErrors.confirm && (
            <span style={{ display: 'block', color: '#ed4956', fontSize: '12px', marginTop: '6px' }}>
              {fieldErrors.confirm}
            </span>
          )}
          {!fieldErrors.confirm && isMismatch && (
            <span style={{ display: 'block', color: '#ed4956', fontSize: '12px', marginTop: '6px' }}>
              비밀번호가 일치하지 않습니다.
            </span>
          )}
          {!fieldErrors.confirm && isMatching && (
            <span style={{ display: 'block', color: '#10b981', fontSize: '12px', marginTop: '6px' }}>
              비밀번호가 일치합니다.
            </span>
          )}
        </div>

        {/* Submit Button */}
        <div style={{ marginTop: '12px' }}>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isSubmitting || !oldPassword || !newPassword || !confirmPassword || isMismatch || newPassword.length < 6}
            style={{
              padding: '11px 28px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              minWidth: '130px',
              justifyContent: 'center',
            }}
          >
            {isSubmitting ? (
              <>
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#ffffff',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                <span>변경 중...</span>
              </>
            ) : (
              '비밀번호 변경'
            )}
          </Button>
        </div>
      </form>

      {/* Security Tips Card */}
      <div
        style={{
          marginTop: '40px',
          padding: '20px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '14px',
          border: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <Shield size={20} color="#0095f6" />
          <h4 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            계정 보안 팁
          </h4>
        </div>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <li>생년월일, 연속된 숫자, 이름 등 유추하기 쉬운 비밀번호는 피하세요.</li>
          <li>의심스러운 로그인 시도가 감지되면 즉시 비밀번호를 변경하세요.</li>
          <li>더 강력한 보안을 위해 <strong>2단계 인증 (2FA)</strong>을 함께 활성화하는 것을 권장합니다.</li>
        </ul>
      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setIsForgotModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderRadius: '16px',
              maxWidth: '420px',
              width: '100%',
              padding: '28px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
              border: '1px solid var(--border-color)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 149, 246, 0.1)',
                color: '#0095f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <Lock size={28} />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
              비밀번호 재설정
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '22px' }}>
              계정에 연결된 이메일(<strong>{user?.email || '등록된 이메일'}</strong>)로 로그인 링크를 보내 다시 로그인하실 수 있도록 도와드립니다.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
              <Button
                variant="primary"
                size="md"
                onClick={handleSendResetEmail}
                disabled={isSendingReset}
                style={{ width: '100%', fontWeight: 600, padding: '10px 0' }}
              >
                {isSendingReset ? '링크 전송 중...' : '로그인 링크 보내기'}
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setIsForgotModalOpen(false)}
                disabled={isSendingReset}
                style={{ width: '100%', padding: '10px 0' }}
              >
                닫기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordSecurityPanel;
