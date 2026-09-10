import React, { useState } from 'react';
import { Mail, Phone, Calendar, Trash2, AlertTriangle, ShieldCheck, ChevronRight } from 'lucide-react';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const PersonalDetailsPanel = ({ showToast }) => {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState(() => {
    const saved = localStorage.getItem('ig_personal_details');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.email) return parsed.email;
      } catch {}
    }
    return user?.email || 'alex@example.com';
  });
  const [phone, setPhone] = useState(() => {
    const saved = localStorage.getItem('ig_personal_details');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.phone) return parsed.phone;
      } catch {}
    }
    return user?.phone || '010-8234-5678';
  });
  const [birthday, setBirthday] = useState(() => {
    const saved = localStorage.getItem('ig_personal_details');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.birthday) return parsed.birthday;
      } catch {}
    }
    return user?.birthday || '1998-05-14';
  });

  React.useEffect(() => {
    if (user?.email && !localStorage.getItem('ig_personal_details')) {
      setEmail(user.email);
    }
  }, [user]);

  // Deactivation / Deletion Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionType, setActionType] = useState('deactivate'); // 'deactivate' or 'delete'
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('ig_personal_details', JSON.stringify({ email, phone, birthday }));
    updateProfile({ email, phone, birthday });
    showToast('개인정보가 성공적으로 업데이트되었습니다.');
  };

  const handleConfirmAccountAction = () => {
    if (!confirmPassword) {
      alert('비밀번호를 입력해주세요.');
      return;
    }
    setIsModalOpen(false);
    if (actionType === 'delete') {
      alert('계정이 영구 삭제 처리되었습니다. 이용해 주셔서 감사합니다.');
    } else {
      alert('계정이 비활성화되었습니다. 다시 로그인하면 언제든지 활성화됩니다.');
    }
    logout();
    navigate('/login');
  };

  return (
    <div style={{ maxWidth: '600px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>
          개인정보
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Meta는 이 정보를 사용하여 회원님의 신원을 확인하고 계정을 안전하게 보호합니다.
        </p>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Email Field */}
        <div
          style={{
            padding: '16px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Mail size={18} color="var(--ig-primary-button)" />
            <label style={{ fontSize: '14px', fontWeight: 600 }}>연락처 이메일</label>
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              fontSize: '14px',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        {/* Phone Field */}
        <div
          style={{
            padding: '16px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Phone size={18} color="var(--ig-primary-button)" />
            <label style={{ fontSize: '14px', fontWeight: 600 }}>전화번호</label>
          </div>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              fontSize: '14px',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        {/* Birthday Field */}
        <div
          style={{
            padding: '16px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Calendar size={18} color="var(--ig-primary-button)" />
            <label style={{ fontSize: '14px', fontWeight: 600 }}>생년월일</label>
          </div>
          <input
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              fontSize: '14px',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
            }}
          />
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
            생년월일은 공개 프로필에 표시되지 않으며 맞춤형 환경과 연령 확인을 위해 사용됩니다.
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <Button type="submit" variant="primary" size="md">
            변경 사항 저장
          </Button>
        </div>
      </form>

      {/* Account Deactivation or Deletion Trigger Section */}
      <div
        style={{
          marginTop: '36px',
          paddingTop: '28px',
          borderTop: '1px solid var(--border-color)',
        }}
      >
        <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
          계정 소유권 및 관리
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
          계정을 잠시 비활성화하거나 계정과 관련된 모든 데이터를 영구 삭제할 수 있습니다.
        </p>

        <div
          onClick={() => setIsModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={18} color="var(--ig-danger)" />
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ig-danger)' }}>
              계정 비활성화 또는 삭제
            </span>
          </div>
          <ChevronRight size={18} color="var(--text-secondary)" />
        </div>
      </div>

      {/* Deactivation / Deletion Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="460px"
        width="90%"
        showCloseButton={true}
      >
        <div style={{ padding: '24px 20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>
            계정 비활성화 또는 삭제
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
            Instagram 이용을 잠시 쉬고 싶다면 계정을 비활성화할 수 있습니다. 영구 삭제할 경우 복구가 불가능합니다.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '14px',
                borderRadius: '10px',
                border: actionType === 'deactivate' ? '2px solid var(--ig-primary-button)' : '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="account_action"
                checked={actionType === 'deactivate'}
                onChange={() => setActionType('deactivate')}
                style={{ marginTop: '2px', accentColor: 'var(--ig-primary-button)' }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>계정 비활성화 (권장)</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  프로필, 사진, 댓글 및 좋아요가 다시 로그인하여 활성화할 때까지 숨겨집니다.
                </div>
              </div>
            </label>

            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '14px',
                borderRadius: '10px',
                border: actionType === 'delete' ? '2px solid var(--ig-danger)' : '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="account_action"
                checked={actionType === 'delete'}
                onChange={() => setActionType('delete')}
                style={{ marginTop: '2px', accentColor: 'var(--ig-danger)' }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--ig-danger)' }}>계정 영구 삭제</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  프로필, 사진, 동영상, 댓글, 팔로워가 모두 영구적으로 삭제되며 다시 되돌릴 수 없습니다.
                </div>
              </div>
            </label>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              보안을 위해 비밀번호를 입력해주세요
            </label>
            <input
              type="password"
              placeholder="현재 비밀번호 입력"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button variant="secondary" size="md" onClick={() => setIsModalOpen(false)}>
              취소
            </Button>
            <Button
              variant={actionType === 'delete' ? 'primary' : 'primary'}
              size="md"
              onClick={handleConfirmAccountAction}
              style={{
                backgroundColor: actionType === 'delete' ? 'var(--ig-danger)' : 'var(--ig-primary-button)',
                borderColor: actionType === 'delete' ? 'var(--ig-danger)' : 'var(--ig-primary-button)'
              }}
            >
              {actionType === 'delete' ? '계정 영구 삭제' : '계정 비활성화'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
