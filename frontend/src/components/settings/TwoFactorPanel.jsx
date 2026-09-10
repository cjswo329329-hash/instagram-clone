import React, { useState } from 'react';
import { Shield, Smartphone, Key, Copy, Check, AlertCircle } from 'lucide-react';
import { Button } from '../common/Button';

export const TwoFactorPanel = ({ showToast }) => {
  const [is2FAEnabled, setIs2FAEnabled] = useState(() => {
    const saved = localStorage.getItem('ig_2fa_enabled');
    return saved !== null ? saved === 'true' : true;
  });
  const [method, setMethod] = useState('app'); // 'app' or 'sms'
  const [copied, setCopied] = useState(false);

  const [backupCodes] = useState([
    '4921-8302',
    '1940-5821',
    '7392-1049',
    '8832-6019',
    '3391-4402',
  ]);

  const handleCopyCodes = () => {
    navigator.clipboard?.writeText(backupCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('백업 코드가 클립보드에 복사되었습니다.');
  };

  const handleToggle = () => {
    const nextState = !is2FAEnabled;
    setIs2FAEnabled(nextState);
    localStorage.setItem('ig_2fa_enabled', String(nextState));
    showToast(nextState ? '2단계 인증이 활성화되었습니다.' : '2단계 인증이 비활성화되었습니다.');
  };

  return (
    <div style={{ maxWidth: '600px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>
          2단계 인증 (2FA)
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          인식할 수 없는 기기나 브라우저에서 로그인할 때 로그인 코드를 요구하여 계정 보안을 대폭 강화합니다.
        </p>
      </div>

      {/* Main Status Toggle Card */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 20px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '14px',
          border: '1px solid var(--border-color)',
          marginBottom: '28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: is2FAEnabled ? 'rgba(0, 149, 246, 0.12)' : 'var(--bg-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: is2FAEnabled ? 'var(--ig-primary-button)' : 'var(--text-secondary)',
            }}
          >
            <Shield size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px' }}>
              2단계 인증 {is2FAEnabled ? '사용 중' : '사용 안 함'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {is2FAEnabled ? '로그인 시 추가 보안 코드가 요청됩니다.' : '계정이 비밀번호만으로 보호되고 있습니다.'}
            </div>
          </div>
        </div>

        {/* Toggle Switch */}
        <div
          onClick={handleToggle}
          style={{
            width: '44px',
            height: '24px',
            borderRadius: '12px',
            backgroundColor: is2FAEnabled ? 'var(--ig-primary-button)' : 'var(--border-color)',
            padding: '2px',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
              transform: is2FAEnabled ? 'translateX(20px)' : 'translateX(0px)',
              transition: 'transform 0.2s ease',
            }}
          />
        </div>
      </div>

      {/* Verification Methods Section */}
      {is2FAEnabled && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700 }}>보안 인증 수단</h3>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '12px',
              border: method === 'app' ? '2px solid var(--ig-primary-button)' : '1px solid var(--border-color)',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Key size={20} color="var(--ig-primary-button)" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>인증 앱 (권장)</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Google Authenticator, Duo Mobile 등에서 생성된 코드
                </div>
              </div>
            </div>
            <input
              type="radio"
              name="2fa_method"
              checked={method === 'app'}
              onChange={() => setMethod('app')}
              style={{ accentColor: 'var(--ig-primary-button)', width: '18px', height: '18px' }}
            />
          </label>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '12px',
              border: method === 'sms' ? '2px solid var(--ig-primary-button)' : '1px solid var(--border-color)',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Smartphone size={20} color="var(--ig-primary-button)" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>문자 메시지 (SMS)</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  등록된 휴대전화 번호로 인증 번호 전송
                </div>
              </div>
            </div>
            <input
              type="radio"
              name="2fa_method"
              checked={method === 'sms'}
              onChange={() => setMethod('sms')}
              style={{ accentColor: 'var(--ig-primary-button)', width: '18px', height: '18px' }}
            />
          </label>
        </div>
      )}

      {/* Backup Recovery Codes Section */}
      {is2FAEnabled && (
        <div
          style={{
            padding: '20px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '14px',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700 }}>백업 복구 코드</h3>
            <button
              onClick={handleCopyCodes}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--ig-primary-button)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? '복사됨!' : '코드 모두 복사'}</span>
            </button>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
            휴대전화를 분실하거나 인증 앱을 사용할 수 없는 경우 아래 일회용 복구 코드를 사용하여 로그인할 수 있습니다. 안전한 장소에 보관하세요.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '10px',
              padding: '12px',
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              fontFamily: 'monospace',
              fontSize: '14px',
              textAlign: 'center',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            {backupCodes.map((code, idx) => (
              <div key={idx} style={{ padding: '6px' }}>
                {code}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
