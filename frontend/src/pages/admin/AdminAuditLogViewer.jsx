import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Globe,
  ChevronLeft,
  ChevronRight,
  FileCheck
} from 'lucide-react';
import { adminApi } from '../../services';

export const AdminAuditLogViewer = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getAuditLogs({
        page,
        pageSize,
        action: actionFilter,
      });
      setLogs(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getActionBadge = (action) => {
    const map = {
      USER_BAN: { label: '회원 정지 (BAN)', bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' },
      USER_UNBAN: { label: '정지 해제', bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' },
      USER_DELETE: { label: '회원 영구삭제', bg: 'rgba(220, 38, 38, 0.2)', color: '#dc2626' },
      POST_DELETE: { label: '게시물 강제삭제', bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' },
      REEL_DELETE: { label: '릴스 강제삭제', bg: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' },
      REPORT_RESOLVE: { label: '신고 승인조치', bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' },
      REPORT_DISMISS: { label: '신고 기각', bg: 'var(--border-subtle)', color: 'var(--text-secondary)' },
    };
    const b = map[action] || { label: action, bg: 'var(--border-subtle)', color: 'var(--text-secondary)' };
    return (
      <span
        style={{
          padding: '4px 10px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: 700,
          backgroundColor: b.bg,
          color: b.color,
          display: 'inline-block',
        }}
      >
        {b.label}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 필터 및 상단 컨트롤 */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={20} color="var(--ig-primary-button)" />
          <span style={{ fontWeight: 700, fontSize: '15px' }}>관리자 보안 감사 로그 (Audit Trail)</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="var(--text-secondary)" />
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              outline: 'none',
            }}
          >
            <option value="">모든 관리자 행위</option>
            <option value="USER_BAN">회원 계정 정지 (USER_BAN)</option>
            <option value="USER_UNBAN">계정 정지 해제 (USER_UNBAN)</option>
            <option value="USER_DELETE">회원 영구 삭제 (USER_DELETE)</option>
            <option value="POST_DELETE">게시물 강제 삭제 (POST_DELETE)</option>
            <option value="REEL_DELETE">릴스 강제 삭제 (REEL_DELETE)</option>
            <option value="REPORT_RESOLVE">신고 승인 및 조치 (REPORT_RESOLVE)</option>
            <option value="REPORT_DISMISS">신고 기각 (REPORT_DISMISS)</option>
          </select>

          <button
            onClick={fetchLogs}
            title="새로고침"
            style={{
              padding: '8px',
              background: 'none',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RefreshCw size={16} className={loading ? 'spin-icon' : ''} />
          </button>
        </div>
      </div>

      {/* 감사 로그 목록 테이블 */}
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
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>로그 ID</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>일시</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>관리자</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>수행 작업</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>대상 식별자</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>사유 및 상세 내역</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>IP 주소</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    감사 로그를 불러오는 중입니다...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    기록된 관리자 작업 로그가 없습니다.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr
                    key={l.id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background-color 0.15s ease',
                    }}
                    className="admin-table-row"
                  >
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      #{l.id}
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                      {new Date(l.created_at).toLocaleString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700 }}>
                      <span style={{ color: 'var(--ig-primary-button)' }}>@{l.admin_username}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>{getActionBadge(l.action)}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '11px', marginRight: '4px' }}>
                        [{l.target_type}]
                      </span>
                      {l.target_identifier || `ID:${l.target_id}`}
                    </td>
                    <td style={{ padding: '12px 16px', maxWidth: '320px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{l.reason || '-'}</div>
                      {l.details && (
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {l.details}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                      {l.ip_address || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 페이징 네비게이션 */}
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
            총 {total.toLocaleString()}건 로그 (페이지 {page} / {totalPages})
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
    </div>
  );
};

export default AdminAuditLogViewer;
