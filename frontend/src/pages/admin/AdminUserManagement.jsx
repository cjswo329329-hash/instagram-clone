import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  ArrowUpDown, 
  Trash2, 
  AlertTriangle, 
  Calendar, 
  ShieldCheck, 
  User, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle,
  X
} from 'lucide-react';
import { Avatar } from '../../components/common/Avatar';
import { adminApi } from '../../services';
import { useAuth } from '../../contexts/AuthContext';

export const AdminUserManagement = ({ onDataChange }) => {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at_desc');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 회원 탈퇴 확인 모달 상태
  const [targetUser, setTargetUser] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getUsers({
        page,
        pageSize,
        q: searchTerm,
        sortBy,
      });
      setUsers(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('회원 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchTerm, sortBy]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // 검색 디바운스
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setPage(1);
  };

  // 날짜 포맷팅 유틸리티
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
    } catch {
      return dateStr;
    }
  };

  // 상대 시간 표시 (예: 방금 전, 2일 전)
  const getRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now - d;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return '오늘 가입';
      if (diffDays === 1) return '어제 가입';
      if (diffDays < 30) return `${diffDays}일 전`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)}개월 전`;
      return `${Math.floor(diffDays / 365)}년 전`;
    } catch {
      return '';
    }
  };

  // 회원 탈퇴 처리 실행
  const handleConfirmDelete = async () => {
    if (!targetUser) return;
    setDeleting(true);
    try {
      const res = await adminApi.deleteUser(targetUser.id);
      setActionSuccess(res.message || `'${targetUser.username}' 회원이 성공적으로 탈퇴 처리되었습니다.`);
      setTargetUser(null);
      fetchUsers();
      if (onDataChange) {
        onDataChange();
      }
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      console.error('Delete user failed:', err);
      alert(err.response?.data?.detail || '회원 탈퇴 처리에 실패했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 액션 성공 알림 */}
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

      {/* 필터 및 검색 바 컨트롤러 */}
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
        {/* 검색 인풋 */}
        <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '400px' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-secondary)',
            }}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="아이디, 성명, 이메일 검색..."
            style={{
              width: '100%',
              padding: '10px 12px 10px 38px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                setPage(1);
              }}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                padding: '2px',
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* 정렬 셀렉터 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ArrowUpDown size={16} style={{ color: 'var(--text-secondary)' }} />
          <select
            value={sortBy}
            onChange={handleSortChange}
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="created_at_desc">최신 가입순 (Newest)</option>
            <option value="created_at_asc">오래된 가입순 (Oldest)</option>
            <option value="posts_desc">게시물 많은순 (Most Posts)</option>
            <option value="followers_desc">팔로워 많은순 (Most Followers)</option>
          </select>
        </div>
      </div>

      {/* 회원 목록 테이블 */}
      <div
        style={{
          backgroundColor: 'var(--bg-elevated)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                <th style={{ padding: '14px 16px' }}>회원 정보</th>
                <th style={{ padding: '14px 16px' }}>이메일</th>
                <th style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={14} />
                    <span>가입 일시</span>
                  </div>
                </th>
                <th style={{ padding: '14px 16px' }}>활동 현황</th>
                <th style={{ padding: '14px 16px' }}>권한</th>
                <th style={{ padding: '14px 16px', textAlign: 'center' }}>관리 조치</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    회원 데이터를 조회하고 있습니다...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    {searchTerm ? '검색 결과와 일치하는 회원이 없습니다.' : '등록된 회원이 없습니다.'}
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = currentAdmin?.id === u.id || u.username === 'admin';
                  const relative = getRelativeTime(u.created_at);

                  return (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background-color 0.15s ease',
                      }}
                      className="admin-table-row"
                    >
                      {/* 회원 프로필 */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Avatar src={u.profile_image_url} size="md" />
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <a
                                href={`/${u.username}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  fontWeight: 700,
                                  color: 'var(--text-primary)',
                                  textDecoration: 'none',
                                }}
                              >
                                {u.username}
                              </a>
                              {u.is_verified && (
                                <span style={{ color: '#0095f6', fontSize: '12px' }}>✓</span>
                              )}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                              {u.full_name || '이름 없음'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 이메일 */}
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                        {u.email}
                      </td>

                      {/* 가입 날짜 확인 */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>
                          {formatDateTime(u.created_at)}
                        </div>
                        {relative && (
                          <div style={{ fontSize: '11px', color: '#0095f6', marginTop: '2px', fontWeight: 500 }}>
                            {relative}
                          </div>
                        )}
                      </td>

                      {/* 활동 현황 */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                          게시물 <strong>{u.posts_count}</strong>개
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          팔로워 {u.followers_count}명
                        </div>
                      </td>

                      {/* 권한 뱃지 */}
                      <td style={{ padding: '14px 16px' }}>
                        {u.is_admin ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 8px',
                              backgroundColor: 'rgba(237, 73, 86, 0.1)',
                              color: 'var(--ig-danger)',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 700,
                            }}
                          >
                            <ShieldCheck size={12} />
                            최고 관리자
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 8px',
                              backgroundColor: 'rgba(0, 149, 246, 0.08)',
                              color: '#0095f6',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 600,
                            }}
                          >
                            <User size={12} />
                            일반 회원
                          </span>
                        )}
                      </td>

                      {/* 관리 조치: 탈퇴 처리 */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        {isSelf ? (
                          <span
                            style={{
                              fontSize: '12px',
                              color: 'var(--text-muted)',
                              cursor: 'not-allowed',
                            }}
                            title="관리자 본인 계정은 탈퇴/삭제할 수 없습니다."
                          >
                            보호됨
                          </span>
                        ) : (
                          <button
                            onClick={() => setTargetUser(u)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 12px',
                              backgroundColor: 'transparent',
                              border: '1px solid var(--border-color)',
                              borderRadius: '6px',
                              color: 'var(--ig-danger)',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                            className="btn-danger-hover"
                          >
                            <Trash2 size={14} />
                            탈퇴 처리
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 바 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 20px',
            borderTop: '1px solid var(--border-color)',
            fontSize: '13px',
            color: 'var(--text-secondary)',
          }}
        >
          <div>
            총 <strong>{total}</strong>명의 회원 (페이지 {page} / {totalPages})
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: page <= 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                fontSize: '13px',
              }}
            >
              <ChevronLeft size={16} />
              이전
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: page >= totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                fontSize: '13px',
              }}
            >
              다음
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 회원 탈퇴 확인 모달 (Confirmation Modal) */}
      {targetUser && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
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
              maxWidth: '440px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              border: '1px solid var(--border-color)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'rgba(237, 73, 86, 0.1)',
                color: 'var(--ig-danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
              }}
            >
              <AlertTriangle size={32} />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
              회원 강제 탈퇴 처리
            </h3>

            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 20px 0' }}>
              <strong>@{targetUser.username}</strong> ({targetUser.full_name || '회원'}) 계정을 정말 탈퇴 처리하시겠습니까?
              <br />
              해당 회원이 작성한 <strong>게시물, 댓글, 좋아요, 팔로우 등 모든 활동 데이터</strong>가 영구 삭제되며 복구할 수 없습니다.
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => setTargetUser(null)}
                disabled={deleting}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                취소
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: 'var(--ig-danger)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.7 : 1,
                }}
              >
                {deleting ? '탈퇴 처리 중...' : '네, 탈퇴시킵니다'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .admin-table-row:hover {
          background-color: var(--border-subtle);
        }
        .btn-danger-hover:hover {
          background-color: var(--ig-danger) !important;
          color: #ffffff !important;
          border-color: var(--ig-danger) !important;
        }
      `}</style>
    </div>
  );
};

export default AdminUserManagement;
