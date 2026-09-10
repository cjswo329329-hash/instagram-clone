import React, { useState } from 'react';
import { MessageSquare, Plus, X, ShieldAlert } from 'lucide-react';
import { Button } from '../common/Button';

export const HiddenWordsPanel = ({ showToast }) => {
  const [hideOffensive, setHideOffensive] = useState(() => {
    const saved = localStorage.getItem('ig_hide_offensive');
    return saved !== null ? saved === 'true' : true;
  });
  const [advancedFilter, setAdvancedFilter] = useState(() => {
    const saved = localStorage.getItem('ig_advanced_filter');
    return saved !== null ? saved === 'true' : true;
  });
  const [hideCustom, setHideCustom] = useState(() => {
    const saved = localStorage.getItem('ig_hide_custom');
    return saved !== null ? saved === 'true' : true;
  });

  const [customWords, setCustomWords] = useState(() => {
    const saved = localStorage.getItem('ig_hidden_words');
    return saved ? JSON.parse(saved) : ['광고', '비트코인', '수익보장', '주식리딩', '사기'];
  });

  const [inputWord, setInputWord] = useState('');

  const handleAddWord = (e) => {
    e.preventDefault();
    const word = inputWord.trim();
    if (word && !customWords.includes(word)) {
      const updated = [...customWords, word];
      setCustomWords(updated);
      localStorage.setItem('ig_hidden_words', JSON.stringify(updated));
      setInputWord('');
      showToast(`'${word}' 단어가 필터에 추가되었습니다.`);
    }
  };

  const handleRemoveWord = (wordToRemove) => {
    const updated = customWords.filter(w => w !== wordToRemove);
    setCustomWords(updated);
    localStorage.setItem('ig_hidden_words', JSON.stringify(updated));
    showToast(`'${wordToRemove}' 단어가 삭제되었습니다.`);
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
    <div style={{ maxWidth: '620px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>
          댓글 관리 및 숨긴 단어
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          공격적이거나 부적절한 단어, 문구 또는 이모티콘이 포함된 댓글을 자동으로 숨겨 쾌적한 피드 환경을 유지합니다.
        </p>
      </div>

      {/* Automatic Filtering Section */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          paddingBottom: '28px',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700 }}>모욕적인 댓글 숨기기</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
              비하, 혐오 표현, 스팸으로 간주되는 댓글을 게시물, 릴스에서 자동으로 숨깁니다.
            </div>
          </div>
          <ToggleSwitch
            checked={hideOffensive}
            onChange={(val) => {
              setHideOffensive(val);
              localStorage.setItem('ig_hide_offensive', String(val));
              showToast(val ? '모욕적인 댓글 숨기기가 활성화되었습니다.' : '모욕적인 댓글 숨기기가 비활성화되었습니다.');
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700 }}>고급 댓글 필터링</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
              의도적으로 맞춤법을 변형하거나 우회 표기된 불쾌한 댓글까지 AI가 인식하여 추가로 숨깁니다.
            </div>
          </div>
          <ToggleSwitch
            checked={advancedFilter}
            onChange={(val) => {
              setAdvancedFilter(val);
              localStorage.setItem('ig_advanced_filter', String(val));
              showToast(val ? '고급 댓글 필터링이 활성화되었습니다.' : '고급 댓글 필터링이 비활성화되었습니다.');
            }}
          />
        </div>
      </div>

      {/* Custom Words Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '18px' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700 }}>맞춤 단어 및 문구 숨기기</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
              회원님이 지정한 단어나 이모티콘이 포함된 댓글 및 메시지 요청을 자동으로 숨깁니다.
            </div>
          </div>
          <ToggleSwitch
            checked={hideCustom}
            onChange={(val) => {
              setHideCustom(val);
              localStorage.setItem('ig_hide_custom', String(val));
              showToast(val ? '맞춤 단어 숨기기가 활성화되었습니다.' : '맞춤 단어 숨기기가 비활성화되었습니다.');
            }}
          />
        </div>

        {hideCustom && (
          <div
            style={{
              padding: '20px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '14px',
              border: '1px solid var(--border-color)',
            }}
          >
            {/* Input tag */}
            <form onSubmit={handleAddWord} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="숨길 단어 또는 문구 입력 (쉼표 또는 Enter)"
                value={inputWord}
                onChange={(e) => setInputWord(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  fontSize: '14px',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                }}
              />
              <Button type="submit" variant="primary" size="sm" style={{ padding: '0 16px' }}>
                <Plus size={16} />
                <span>추가</span>
              </Button>
            </form>

            {/* Word Tag Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {customWords.map((word, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '16px',
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-color)',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}
                >
                  <span>{word}</span>
                  <button
                    onClick={() => handleRemoveWord(word)}
                    style={{ color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
