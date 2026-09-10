import React, { useState } from 'react';
import { Briefcase, Sparkles, Store, Check, ArrowRight } from 'lucide-react';
import { Button } from '../common/Button';
import { useAuth } from '../../contexts/AuthContext';

export const ProfessionalPanel = ({ showToast }) => {
  const { user, updateProfile } = useAuth();

  const [accountType, setAccountType] = useState(() => {
    return localStorage.getItem('ig_prof_account_type') || 'creator';
  });
  const [category, setCategory] = useState(() => {
    return localStorage.getItem('ig_prof_category') || user?.category || '디지털 크리에이터';
  });
  const [displayCategory, setDisplayCategory] = useState(() => {
    const saved = localStorage.getItem('ig_prof_display_category');
    return saved !== null ? saved === 'true' : true;
  });

  const categories = [
    '디지털 크리에이터',
    '예술가 / 아티스트',
    '블로거',
    '사진작가',
    '의류 및 패션',
    '카페 / 베이커리',
    '레스토랑 및 요리',
    '음악가 / 밴드',
    '교육 및 멘토링',
    '비영리 단체',
  ];

  const handleConvert = () => {
    localStorage.setItem('ig_prof_account_type', accountType);
    localStorage.setItem('ig_prof_category', category);
    localStorage.setItem('ig_prof_display_category', String(displayCategory));
    updateProfile({
      category: displayCategory ? category : '',
      is_professional: true,
    });
    showToast(`프로페셔널 계정(${category})으로 전환되었습니다!`);
  };

  return (
    <div style={{ maxWidth: '600px' }}>
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 149, 246, 0.12)',
            color: 'var(--ig-primary-button)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
          }}
        >
          <Briefcase size={28} />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>
          무료 프로페셔널 계정으로 전환
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto', lineHeight: 1.5 }}>
          인사이트 분석 도구, 전문 카테고리 배지, 비즈니스 연락처 옵션을 무료로 이용해보세요.
        </p>
      </div>

      {/* Account Type Choice Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '28px' }}>
        <div
          onClick={() => {
            setAccountType('creator');
            localStorage.setItem('ig_prof_account_type', 'creator');
          }}
          style={{
            padding: '20px',
            borderRadius: '14px',
            border: accountType === 'creator' ? '2px solid var(--ig-primary-button)' : '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)',
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          <Sparkles size={24} color="var(--ig-primary-button)" style={{ marginBottom: '10px' }} />
          <div style={{ fontWeight: 700, fontSize: '15px' }}>크리에이터</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
            인플루언서, 공인, 콘텐츠 제작자, 아티스트에 가장 적합합니다.
          </div>
          {accountType === 'creator' && (
            <div style={{ position: 'absolute', top: '12px', right: '12px', color: 'var(--ig-primary-button)' }}>
              <Check size={18} strokeWidth={3} />
            </div>
          )}
        </div>

        <div
          onClick={() => {
            setAccountType('business');
            localStorage.setItem('ig_prof_account_type', 'business');
          }}
          style={{
            padding: '20px',
            borderRadius: '14px',
            border: accountType === 'business' ? '2px solid var(--ig-primary-button)' : '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)',
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          <Store size={24} color="var(--ig-primary-button)" style={{ marginBottom: '10px' }} />
          <div style={{ fontWeight: 700, fontSize: '15px' }}>비즈니스</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
            소매업체, 로컬 매장, 브랜드 및 서비스 기업에 가장 적합합니다.
          </div>
          {accountType === 'business' && (
            <div style={{ position: 'absolute', top: '12px', right: '12px', color: 'var(--ig-primary-button)' }}>
              <Check size={18} strokeWidth={3} />
            </div>
          )}
        </div>
      </div>

      {/* Category Selection */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>
          회원님을 가장 잘 설명하는 카테고리
        </label>
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            localStorage.setItem('ig_prof_category', e.target.value);
          }}
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          {categories.map((cat, idx) => (
            <option key={idx} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Display Badge on Profile Toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          marginBottom: '28px',
        }}
      >
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600 }}>프로필에 카테고리 라벨 표시</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            프로필 이름 아래에 '{category}' 라벨이 노출됩니다.
          </div>
        </div>
        <input
          type="checkbox"
          checked={displayCategory}
          onChange={(e) => {
            setDisplayCategory(e.target.checked);
            localStorage.setItem('ig_prof_display_category', String(e.target.checked));
          }}
          style={{ width: '20px', height: '20px', accentColor: 'var(--ig-primary-button)', cursor: 'pointer' }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="primary" size="lg" onClick={handleConvert} style={{ fontWeight: 600, padding: '10px 28px' }}>
          전환 완료
        </Button>
      </div>
    </div>
  );
};
