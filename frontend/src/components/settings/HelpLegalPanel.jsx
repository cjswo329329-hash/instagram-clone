import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, AlertCircle, FileText, Check, Search } from 'lucide-react';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

export const HelpLegalPanel = ({ initialSubtab = 'faq', showToast }) => {
  const [subtab, setSubtab] = useState(initialSubtab); // 'faq', 'privacy', 'terms'
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Report Modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportCategory, setReportCategory] = useState('bug');
  const [reportDescription, setReportDescription] = useState('');

  const faqs = [
    {
      id: 1,
      q: '비공개 계정으로 전환하면 기존 팔로워는 어떻게 되나요?',
      a: '비공개 계정으로 전환하더라도 이미 회원님을 팔로우하고 있던 사람들은 계속해서 회원님의 게시물과 스토리를 볼 수 있습니다. 원치 않는 팔로워가 있다면 프로필의 팔로워 목록에서 언제든 삭제할 수 있습니다.'
    },
    {
      id: 2,
      q: '인스타그램 스토리는 언제 자동으로 사라지나요?',
      a: '스토리는 업로드 후 정확히 24시간 동안 친구들에게 노출된 후 피드에서 자동으로 사라집니다. 사라진 스토리는 본인만 볼 수 있는 [설정 > 보관함 > 스토리 보관함]에 영구 보관되며 프로필 하이라이트로 등록할 수 있습니다.'
    },
    {
      id: 3,
      q: '친한 친구 목록에 추가된 사람은 알림을 받나요?',
      a: '아니요, 친한 친구 목록은 철저히 비공개입니다. 회원님이 특정인을 친한 친구로 추가하거나 삭제하더라도 상대방에게 알림이 전송되지 않습니다. 단, 친한 친구 전용 스토리에는 초록색 링이 표시됩니다.'
    },
    {
      id: 4,
      q: '2단계 인증(2FA) 코드를 받지 못했을 때 어떻게 하나요?',
      a: '휴대전화를 분실하거나 인증 번호를 수신할 수 없는 경우, 2단계 인증 설정 시 발급받았던 8자리 [백업 복구 코드] 중 하나를 입력하여 로그인할 수 있습니다.'
    },
  ];

  const filteredFaqs = faqs.filter(f =>
    f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const handleSubmitReport = (e) => {
    e.preventDefault();
    if (!reportDescription.trim()) {
      alert('문제 내용을 입력해주세요.');
      return;
    }
    setIsReportModalOpen(false);
    setReportDescription('');
    showToast('문제 신고가 정상적으로 접수되었습니다. 신속히 검토하겠습니다.');
  };

  return (
    <div style={{ maxWidth: '640px' }}>
      {/* Subtab Navigation */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '24px',
        }}
      >
        <button
          onClick={() => setSubtab('faq')}
          style={{
            flex: 1,
            padding: '12px 0',
            fontSize: '14px',
            fontWeight: subtab === 'faq' ? 700 : 500,
            color: subtab === 'faq' ? 'var(--text-primary)' : 'var(--text-secondary)',
            borderBottom: subtab === 'faq' ? '2px solid var(--text-primary)' : '2px solid transparent',
            marginBottom: '-1px',
            cursor: 'pointer',
          }}
        >
          고객 센터 (FAQ)
        </button>
        <button
          onClick={() => setSubtab('privacy')}
          style={{
            flex: 1,
            padding: '12px 0',
            fontSize: '14px',
            fontWeight: subtab === 'privacy' ? 700 : 500,
            color: subtab === 'privacy' ? 'var(--text-primary)' : 'var(--text-secondary)',
            borderBottom: subtab === 'privacy' ? '2px solid var(--text-primary)' : '2px solid transparent',
            marginBottom: '-1px',
            cursor: 'pointer',
          }}
        >
          개인정보처리방침
        </button>
        <button
          onClick={() => setSubtab('terms')}
          style={{
            flex: 1,
            padding: '12px 0',
            fontSize: '14px',
            fontWeight: subtab === 'terms' ? 700 : 500,
            color: subtab === 'terms' ? 'var(--text-primary)' : 'var(--text-secondary)',
            borderBottom: subtab === 'terms' ? '2px solid var(--text-primary)' : '2px solid transparent',
            marginBottom: '-1px',
            cursor: 'pointer',
          }}
        >
          이용약관
        </button>
      </div>

      {/* SUBTAB 1: FAQ & Problem Report */}
      {subtab === 'faq' && (
        <div>
          {/* Header & Search */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>
                무엇을 도와드릴까요?
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                자주 묻는 질문을 확인하거나 새로운 기술적 문제를 신고할 수 있습니다.
              </p>
            </div>

            <Button variant="secondary" size="sm" onClick={() => setIsReportModalOpen(true)}>
              문제 신고
            </Button>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--bg-secondary)',
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              marginBottom: '20px',
            }}
          >
            <Search size={16} color="var(--text-secondary)" />
            <input
              type="text"
              placeholder="도움말 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                backgroundColor: 'transparent',
                fontSize: '14px',
                width: '100%',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* FAQ Accordion Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredFaqs.map(item => {
              const isExpanded = expandedFaq === item.id;

              return (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-subtle)',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    onClick={() => handleToggleFaq(item.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px',
                      textAlign: 'left',
                      fontWeight: 600,
                      fontSize: '14px',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                    }}
                  >
                    <span>{item.q}</span>
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>

                  {isExpanded && (
                    <div
                      style={{
                        padding: '0 16px 16px 16px',
                        fontSize: '13px',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.6,
                        borderTop: '1px solid var(--border-subtle)',
                        paddingTop: '12px',
                      }}
                    >
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 2: PRIVACY POLICY */}
      {subtab === 'privacy' && (
        <div
          style={{
            backgroundColor: 'var(--bg-secondary)',
            padding: '24px',
            borderRadius: '14px',
            border: '1px solid var(--border-color)',
            fontSize: '13px',
            lineHeight: 1.7,
            color: 'var(--text-primary)',
            maxHeight: '520px',
            overflowY: 'auto',
          }}
          className="no-scrollbar"
        >
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>Meta 개인정보처리방침</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '14px' }}>최종 개정일: 2026년 1월 1일</p>

          <h4 style={{ fontWeight: 700, marginTop: '16px', marginBottom: '6px' }}>1. 수집하는 개인정보 항목</h4>
          <p>Instagram 서비스 이용 시 사용자가 제공하는 프로필 정보(이름, 사용자 이름, 이메일, 전화번호, 프로필 사진), 게시물 및 스토리 미디어, 메시지 텍스트 및 기기 식별 정보(브라우저 유형, IP 주소)를 수집합니다.</p>

          <h4 style={{ fontWeight: 700, marginTop: '16px', marginBottom: '6px' }}>2. 개인정보의 이용 목적</h4>
          <p>수집된 정보는 서비스 제공, 피드 맞춤 추천, 계정 보안 인증, 부적절한 콘텐츠 필터링 및 법적 의무 준수를 위해 활용됩니다.</p>

          <h4 style={{ fontWeight: 700, marginTop: '16px', marginBottom: '6px' }}>3. 정보의 보유 및 파기</h4>
          <p>사용자가 계정 탈퇴를 요청하는 경우 법령에 따라 보존해야 하는 경우를 제외하고 개인정보는 지체 없이 안전하게 파기됩니다.</p>
        </div>
      )}

      {/* SUBTAB 3: TERMS OF SERVICE */}
      {subtab === 'terms' && (
        <div
          style={{
            backgroundColor: 'var(--bg-secondary)',
            padding: '24px',
            borderRadius: '14px',
            border: '1px solid var(--border-color)',
            fontSize: '13px',
            lineHeight: 1.7,
            color: 'var(--text-primary)',
            maxHeight: '520px',
            overflowY: 'auto',
          }}
          className="no-scrollbar"
        >
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>Instagram 서비스 이용약관</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '14px' }}>시행일자: 2026년 1월 1일</p>

          <h4 style={{ fontWeight: 700, marginTop: '16px', marginBottom: '6px' }}>1. 커뮤니티 가이드라인 준수</h4>
          <p>사용자는 폭력, 음란물, 지적 재산권 침해, 타인에 대한 비방이나 모욕을 포함하는 콘텐츠를 게시할 수 없으며, 이를 위반할 시 계정 이용이 제한될 수 있습니다.</p>

          <h4 style={{ fontWeight: 700, marginTop: '16px', marginBottom: '6px' }}>2. 콘텐츠 권리 및 라이선스</h4>
          <p>사용자가 서비스에 공유하는 사진과 동영상의 저작권은 사용자에게 귀속됩니다. 단, 사용자는 서비스를 운영, 개선 및 호스팅하기 위한 목적으로 비독점적 라이선스를 Instagram에 부여합니다.</p>
        </div>
      )}

      {/* Problem Report Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        maxWidth="440px"
        width="90%"
        showCloseButton={true}
      >
        <form onSubmit={handleSubmitReport} style={{ padding: '24px 20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>문제 신고</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.4 }}>
            오류가 발생하거나 개선이 필요한 사항을 설명해주세요. 문제 해결에 큰 도움이 됩니다.
          </p>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              카테고리
            </label>
            <select
              value={reportCategory}
              onChange={(e) => setReportCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '14px',
              }}
            >
              <option value="bug">기술적 버그 및 오류</option>
              <option value="spam">스팸 및 부정 사용</option>
              <option value="payment">결제 및 광고 문의</option>
              <option value="other">기타 피드백</option>
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              상세 설명
            </label>
            <textarea
              rows={4}
              placeholder="문제가 발생한 상황을 구체적으로 적어주세요."
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                resize: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button variant="secondary" size="md" onClick={() => setIsReportModalOpen(false)}>
              취소
            </Button>
            <Button type="submit" variant="primary" size="md">
              신고 제출
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
