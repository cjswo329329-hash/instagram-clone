import React, { useState } from 'react';
import { Tag, AtSign, CheckCircle } from 'lucide-react';
import { Button } from '../common/Button';

export const TagsMentionsPanel = ({ showToast }) => {
  const [tagPermission, setTagPermission] = useState(() => {
    return localStorage.getItem('ig_tag_perm') || 'everyone';
  });
  const [mentionPermission, setMentionPermission] = useState(() => {
    return localStorage.getItem('ig_mention_perm') || 'everyone';
  });
  const [manualApproval, setManualApproval] = useState(() => {
    const saved = localStorage.getItem('ig_manual_approval');
    return saved !== null ? saved === 'true' : false;
  });

  const handleSave = () => {
    localStorage.setItem('ig_tag_perm', tagPermission);
    localStorage.setItem('ig_mention_perm', mentionPermission);
    localStorage.setItem('ig_manual_approval', String(manualApproval));
    showToast('태그 및 언급 설정이 저장되었습니다.');
  };

  const ToggleSwitch = ({ checked, onChange }) => (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: '44px',
        height: '24px',
        borderRadius: '12px',
        backgroundColor: checked ? 'var(--ig-primary-button)' : 'var(--border-color)',
        padding: '2px',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease',
        display: 'inline-flex',
        alignItems: 'center',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
          transform: checked ? 'translateX(20px)' : 'translateX(0px)',
          transition: 'transform 0.2s ease',
        }}
      />
    </div>
  );

  return (
    <div style={{ maxWidth: '600px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>
          태그 및 언급
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          다른 사람이 사진, 동영상, 릴스, 스토리 또는 댓글에서 회원님을 태그하거나 @언급할 수 있는 권한을 관리합니다.
        </p>
      </div>

      {/* Tags Section */}
      <div
        style={{
          paddingBottom: '24px',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Tag size={18} color="var(--ig-primary-button)" />
          <h3 style={{ fontSize: '15px', fontWeight: 700 }}>나를 태그할 수 있는 사람</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {[
            { id: 'everyone', label: '모든 사람' },
            { id: 'following', label: '내가 팔로우하는 사람' },
            { id: 'none', label: '태그 허용 안 함' }
          ].map(opt => (
            <label
              key={opt.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '10px',
                border: tagPermission === opt.id ? '2px solid var(--ig-primary-button)' : '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="tag_perm"
                checked={tagPermission === opt.id}
                onChange={() => setTagPermission(opt.id)}
                style={{ accentColor: 'var(--ig-primary-button)', width: '18px', height: '18px' }}
              />
              <span style={{ fontSize: '14px', fontWeight: 600 }}>{opt.label}</span>
            </label>
          ))}
        </div>

        {/* Manual approval toggle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ paddingRight: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700 }}>태그 수동으로 승인하기</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
              누군가 회원님을 태그하면 내 프로필의 '태그됨' 탭에 게시되기 전에 승인 요청을 받습니다.
            </div>
          </div>
          <ToggleSwitch
            checked={manualApproval}
            onChange={(val) => {
              setManualApproval(val);
              localStorage.setItem('ig_manual_approval', String(val));
              showToast(val ? '태그 수동 승인이 활성화되었습니다.' : '태그 수동 승인이 비활성화되었습니다.');
            }}
          />
        </div>
      </div>

      {/* Mentions Section */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <AtSign size={18} color="var(--ig-primary-button)" />
          <h3 style={{ fontSize: '15px', fontWeight: 700 }}>나를 언급(@mention)할 수 있는 사람</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { id: 'everyone', label: '모든 사람' },
            { id: 'following', label: '내가 팔로우하는 사람' },
            { id: 'none', label: '언급 허용 안 함' }
          ].map(opt => (
            <label
              key={opt.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '10px',
                border: mentionPermission === opt.id ? '2px solid var(--ig-primary-button)' : '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="mention_perm"
                checked={mentionPermission === opt.id}
                onChange={() => setMentionPermission(opt.id)}
                style={{ accentColor: 'var(--ig-primary-button)', width: '18px', height: '18px' }}
              />
              <span style={{ fontSize: '14px', fontWeight: 600 }}>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <Button variant="primary" size="md" onClick={handleSave} style={{ minWidth: '100px', fontWeight: 600 }}>
        설정 저장
      </Button>
    </div>
  );
};
