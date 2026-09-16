import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Filter,
  Eye,
  Trash2,
  Ban,
  MessageSquare,
  FileText,
  Film,
  User,
  ChevronLeft,
  ChevronRight,
  Clock,
  ShieldAlert,
  Info
} from 'lucide-react';
import { adminApi } from '../../services';

export const AdminReportManagement = ({ onDataChange }) => {
  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [targetTypeFilter, setTargetTypeFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  // 조치 모달 상태
  const [selectedReport, setSelectedReport] = useState(null);
  const [actionType, setActionType] = useState(null); // 'content_deleted' | 'user_banned' | 'dismissed'
  const [adminNotes, setAdminNotes] = useState('');
  const [banReason, setBanReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getReports({
        page,
        pageSize,
        statusFilter,
        targetType: targetTypeFilter,
      });
      setReports(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, targetTypeFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleOpenActionModal = (report, type) => {
    setSelectedReport(report);
    setActionType(type);
    setAdminNotes('');
    if (type === 'user_banned') {
      setBanReason(`신고 누적 및 이용약관 위반: ${report.reason_category}`);
    } else {
      setBanReason('');
    }
  };

  const handleCloseActionModal = () => {
    setSelectedReport(null);
    setActionType(null);
    setAdminNotes('');
    setBanReason('');
  };

  const handleExecuteAction = async () => {
    if (!selectedReport || !actionType) return;
    setSubmitting(true);
    try {
      const res = await adminApi.actionReport(selectedReport.id, {
        action: actionType,
        notes: adminNotes,
        banReason: actionType === 'user_banned' ? banReason : undefined,
      });
      setActionSuccess(res.message || '신고가 성공적으로 처리되었습니다.');
      handleCloseActionModal();
      fetchReports();
      if (onDataChange) onDataChange();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      alert(err.response?.data?.detail || '신고 처리에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const getReasonBadge = (cat) => {
    const map = {
      spam: { label: '스팸/홍보', bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' },
      harassment: { label: '괴롭힘/욕설', bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' },
      explicit: { label: '음란물/선정성', bg: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' },
      violence: { label: '폭력/위협', bg: 'rgba(220, 38, 38, 0.1)', color: '#dc2626' },
      hate: { label: '혐오 발언', bg: 'rgba(185, 28, 28, 0.1)', color: '#b91c1c' },
      copyright: { label: '저작권 침해', bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' },
      other: { label: '기타 위반', bg: 'rgba(107, 114, 128, 0.1)', color: '#6b7280' },
    };
    const c = map[cat] || { label: cat, bg: 'var(--border-subtle)', color: 'var(--text-secondary)' };
    return (
      <span
        style={{
          padding: '3px 8px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: 700,
          backgroundColor: c.bg,
          color: c.color,
        }}
      >
        {c.label}
      </span>
    );
  };

  const getTargetIcon = (type) => {
    switch (type) {
      case 'post':
        return <FileText size={16} color="#0095f6" />;
      case 'reel':
        return <Film size={16} color="#8b5cf6" />;
      case 'user':
        return <User size={16} color="#10b981" />;
      case 'comment':
        return <MessageSquare size={16} color="#f59e0b" />;
      default:
        return <AlertTriangle size={16} color="var(--text-secondary)" />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {actionSuccess && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '10px',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          <CheckCircle size={18} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* 필터 바 */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--bg-elevated)',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
        }}
      >
        {/* 상태 탭 필터 */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'pending', label: '심사 대기중' },
            { id: 'resolved', label: '조치 완료' },
            { id: 'dismissed', label: '기각/반려' },
            { id: '', label: '전체 보기' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setStatusFilter(item.id);
                setPage(1);
              }}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: statusFilter === item.id ? 700 : 500,
                backgroundColor: statusFilter === item.id ? 'var(--ig-primary-button)' : 'var(--bg-secondary)',
                color: statusFilter === item.id ? '#ffffff' : 'var(--text-primary)',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* 유형 필터 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="var(--text-secondary)" />
          <select
            value={targetTypeFilter}
            onChange={(e) => {
              setTargetTypeFilter(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              outline: 'none',
            }}
          >
            <option value="">모든 대상 유형</option>
            <option value="post">게시물 (Feed)</option>
            <option value="reel">릴스 영상</option>
            <option value="user">사용자 계정</option>
            <option value="comment">댓글</option>
          </select>
        </div>
      </div>

      {/* 신고 목록 테이블 */}
      <div
        style={{
          backgroundColor: 'var(--bg-elevated)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>ID</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>신고자</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>대상 유형</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>대상 내용/작성자</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>위반 카테고리</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>상태</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>접수일시</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', textAlign: 'right' }}>관리자 심사 조치</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    신고 데이터를 불러오는 중입니다...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    조건에 해당하는 신고 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                reports.map((r) => (
                  <tr
                    key={r.id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background-color 0.15s ease',
                    }}
                    className="admin-table-row"
                  >
                    <td style={{ padding: '12px 16px', fontWeight: 700 }}>#{r.id}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--ig-primary-button)', fontWeight: 600 }}>
                      @{r.reporter_username}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {getTargetIcon(r.target_type)}
                        <span style={{ textTransform: 'uppercase', fontWeight: 600, fontSize: '12px' }}>
                          {r.target_type}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', maxWidth: '240px' }}>
                      <div>
                        {r.target_author_username && (
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>
                            작성자: @{r.target_author_username}
                          </span>
                        )}
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                          {r.target_summary || `ID: ${r.target_id}`}
                        </span>
                      </div>
                      {r.description && (
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          💬 "{r.description}"
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>{getReasonBadge(r.reason_category)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {r.status === 'pending' && (
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 700,
                            backgroundColor: 'rgba(245, 158, 11, 0.15)',
                            color: '#f59e0b',
                          }}
                        >
                          대기중
                        </span>
                      )}
                      {r.status === 'resolved' && (
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 700,
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981',
                          }}
                        >
                          조치완료 ({r.resolution_action})
                        </span>
                      )}
                      {r.status === 'dismissed' && (
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 700,
                            backgroundColor: 'var(--border-subtle)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          기각됨
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {new Date(r.created_at).toLocaleString('ko-KR', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      {r.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleOpenActionModal(r, 'content_deleted')}
                            title="콘텐츠 삭제 조치"
                            style={{
                              padding: '6px 10px',
                              backgroundColor: 'rgba(239, 68, 68, 0.12)',
                              color: '#ef4444',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Trash2 size={13} />
                            삭제
                          </button>
                          <button
                            onClick={() => handleOpenActionModal(r, 'user_banned')}
                            title="작성자 계정 정지"
                            style={{
                              padding: '6px 10px',
                              backgroundColor: 'rgba(220, 38, 38, 0.15)',
                              color: '#dc2626',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Ban size={13} />
                            계정정지
                          </button>
                          <button
                            onClick={() => handleOpenActionModal(r, 'dismissed')}
                            title="신고 기각"
                            style={{
                              padding: '6px 10px',
                              backgroundColor: 'var(--border-subtle)',
                              color: 'var(--text-secondary)',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: '12px',
                            }}
                          >
                            기각
                          </button>
                        </div>
                      ) : (
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          처리자: {r.resolved_by_username || 'Admin'}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 페이징 */}
        <div
          style={{
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)',
          }}
        >
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            총 {total.toLocaleString()}건 중 {reports.length}건 표시 (페이지 {page} / {totalPages})
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                opacity: page <= 1 ? 0.5 : 1,
              }}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                opacity: page >= totalPages ? 0.5 : 1,
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 조치 확인 모달 */}
      {selectedReport && actionType && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '480px',
              width: '100%',
              border: '1px solid var(--border-color)',
              boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
            }}
          >
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {actionType === 'content_deleted' && '🛑 신고 승인: 콘텐츠 강제 삭제'}
              {actionType === 'user_banned' && '⛔ 신고 승인: 회원 계정 정지(Ban)'}
              {actionType === 'dismissed' && '⚠️ 신고 기각: 위반 미해당 종결'}
            </h3>

            <div
              style={{
                padding: '12px',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '13px',
              }}
            >
              <div><strong>신고 번호:</strong> #{selectedReport.id}</div>
              <div><strong>대상 유형:</strong> {selectedReport.target_type}</div>
              <div><strong>사유 카테고리:</strong> {selectedReport.reason_category}</div>
              <div><strong>내용 요약:</strong> {selectedReport.target_summary}</div>
            </div>

            {actionType === 'user_banned' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  회원 정지 사유 (사용자에게 노출됨)
                </label>
                <input
                  type="text"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="예: 불법 음란물 게시로 인한 이용정지"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    boxSizing: 'border-box',
                    fontSize: '13px',
                  }}
                />
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                관리자 처리 메모 (감사 로그에 기록됨)
              </label>
              <textarea
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="처리 경위나 사유를 기록하세요..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  boxSizing: 'border-box',
                  fontSize: '13px',
                  resize: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleCloseActionModal}
                disabled={submitting}
                style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13px',
                }}
              >
                취소
              </button>
              <button
                onClick={handleExecuteAction}
                disabled={submitting}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: actionType === 'dismissed' ? 'var(--text-secondary)' : 'var(--ig-danger)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '13px',
                }}
              >
                {submitting ? '처리 중...' : '조치 확정'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReportManagement;
