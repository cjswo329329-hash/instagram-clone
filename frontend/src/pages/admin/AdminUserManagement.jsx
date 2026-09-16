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
  X,
  Ban,
  RotateCcw,
  Filter
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
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 영구 탈퇴 모달 상태
  const [targetUser, setTargetUser] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // 계정 정지(Ban) 모달 상태
  const [banTargetUser, setBanTargetUser] = useState(null);
  const [banReasonInput, setBanReasonInput] = useState('');
  const [banning, setBanning] = useState(false);

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
        statusFilter,
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
  }, [page, pageSize, searchTerm, sortBy, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setPage(1);
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setPage(1);
  };

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

  // 회원 정지 실행
  const handleConfirmBan = async () => {
    if (!banTargetUser) return;
    if (!banReasonInput.trim()) {
      alert('정지 사유를 입력해주세요.');
      return;
    }
    setBanning(true);
    try {
      const res = await adminApi.banUser(banTargetUser.id, banReasonInput.trim());
      setActionSuccess(res.message || `'${banTargetUser.username}' 회원이 정지 처리되었습니다.`);
      setBanTargetUser(null);
      setBanReasonInput('');
      fetchUsers();
      if (onDataChange) onDataChange();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      alert(err.response?.data?.detail || '계정 정지 처리에 실패했습니다.');
    } finally {
      setBanning(false);
    }
  };

  // 회원 정지 해제 실행
  const handleConfirmUnban = async (user) => {
    if (!window.confirm(`'${user.username}' 회원의 계정 정지를 해제하시겠습니까?`)) {
      return;
    }
    try {
      const res = await adminApi.unbanUser(user.id);
      setActionSuccess(res.message || `'${user.username}' 계정 정지가 해제되었습니다.`);
      fetchUsers();
      if (onDataChange) onDataChange();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      alert(err.response?.data?.detail || '정지 해제에 실패했습니다.');
    }
  };

  // 회원 영구 삭제 실행
  const handleConfirmDelete = async () => {
    if (!targetUser) return;
    setDeleting(true);
    try {
      const res = await adminApi.deleteUser(targetUser.id);
      setActionSuccess(res.message || `'${targetUser.username}' 회원이 성공적으로 탈퇴 처리되었습니다.`);
      setTargetUser(null);
      fetchUsers();
      if (onDataChange) onDataChange();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      alert(err.response?.data?.detail || '회원 탈퇴 처리에 실패했습니다.');
    } finally {
      setDeleting(false);
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

      {/* 필터 및 검색 컨트롤러 */}
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
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '360px' }}>
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
              boxSizing: 'border-box',
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

        {/* 계정 상태 탭 필터 */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: '', label: '전체' },
            { id: 'active', label: '정상 회원' },
            { id: 'banned', label: '정지 회원' },
            { id: 'admin', label: '관리자' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleStatusFilterChange(item.id)}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: statusFilter === item.id ? 700 : 500,
                backgroundColor: statusFilter === item.id ? 'var(--ig-primary-button)' : 'var(--bg-secondary)',
                color: statusFilter === item.id ? '#ffffff' : 'var(--text-primary)',
                transition: 'all 0.15s ease',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* 정렬 셀렉터 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ArrowUpDown size={16} style={{ color: 'var(--text-secondary)' }} />
          <select
            value={sortBy}
            onChange={handleSortChange}
            style={{
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="created_at_desc">최신 가입순</option>
            <option value="created_at_asc">오래된 가입순</option>
            <option value="posts_desc">게시물 많은순</option>
            <option value="followers_desc">팔로워 많은순</option>
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
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
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
                <th style={{ padding: '14px 16px' }}>가입 일시</th>
                <th style={{ padding: '14px 16px' }}>활동 현황</th>
                <th style={{ padding: '14px 16px' }}>계정 상태</th>
                <th style={{ padding: '14px 16px', textAlign: 'right' }}>관리 조치</th>
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
                  const isSelf = currentAdmin?.id === u.id;
                  const relative = getRelativeTime(u.created_at);

                  return (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        backgroundColor: u.is_banned ? 'rgba(239, 68, 68, 0.03)' : 'transparent',
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

                      {/* 가입 일시 */}
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

                      {/* 계정 상태 뱃지 */}
                      <td style={{ padding: '14px 16px' }}>
                        {u.is_banned ? (
                          <div>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                color: '#ef4444',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 700,
                              }}
                            >
                              <Ban size={12} />
                              계정 정지됨
                            </span>
                            {u.ban_reason && (
                              <div
                                style={{
                                  fontSize: '11px',
                                  color: 'var(--text-secondary)',
                                  marginTop: '4px',
                                  maxWidth: '180px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                                title={u.ban_reason}
                              >
                                사유: {u.ban_reason}
                              </div>
                            )}
                          </div>
                        ) : u.is_admin ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
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
                              padding: '3px 8px',
                              backgroundColor: 'rgba(16, 185, 129, 0.1)',
                              color: '#10b981',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 600,
                            }}
                          >
                            정상 회원
                          </span>
                        )}
                      </td>

                      {/* 관리 조치 */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        {isSelf ? (
                          <span
                            style={{
                              fontSize: '12px',
                              color: 'var(--text-secondary)',
                              padding: '4px 8px',
                              backgroundColor: 'var(--border-subtle)',
                              borderRadius: '4px',
                            }}
                          >
                            본인 계정
                          </span>
                        ) : u.is_admin ? (
                          <span
                            style={{
                              fontSize: '12px',
                              color: 'var(--text-secondary)',
                              padding: '4px 8px',
                              backgroundColor: 'var(--border-subtle)',
                              borderRadius: '4px',
                            }}
                          >
                            관리자 보호
                          </span>
                        ) : (
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            {u.is_banned ? (
                              <button
                                onClick={() => handleConfirmUnban(u)}
                                title="계정 정지 해제"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '5px 10px',
                                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                  border: '1px solid rgba(16, 185, 129, 0.3)',
                                  borderRadius: '6px',
                                  color: '#10b981',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                <RotateCcw size={13} />
                                정지 해제
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setBanTargetUser(u);
                                  setBanReasonInput('');
                                }}
                                title="계정 정지(Ban) 처리"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '5px 10px',
                                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  borderRadius: '6px',
                                  color: '#ef4444',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                <Ban size={13} />
                                정지
                              </button>
                            )}

                            <button
                              onClick={() => setTargetUser(u)}
                              title="회원 영구 탈퇴"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '5px 10px',
                                backgroundColor: 'transparent',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                color: 'var(--ig-danger)',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              <Trash2 size={13} />
                              삭제
                            </button>
                          </div>
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
                color: page <= 1 ? 'var(--text-secondary)' : 'var(--text-primary)',
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                opacity: page <= 1 ? 0.5 : 1,
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
                color: page >= totalPages ? 'var(--text-secondary)' : 'var(--text-primary)',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                opacity: page >= totalPages ? 0.5 : 1,
              }}
            >
              다음
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 회원 정지(Ban) 사유 입력 모달 */}
      {banTargetUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
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
              maxWidth: '440px',
              width: '100%',
              border: '1px solid var(--border-color)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Ban size={22} color="#ef4444" />
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                회원 계정 정지(Ban) 처리
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
              <strong>@{banTargetUser.username}</strong> 회원의 서비스 접근을 정지합니다.
              정지된 회원은 로그인 및 피드 작성이 즉시 차단되며 아래 입력한 정지 사유가 안내됩니다.
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                정지 사유 (필수 입력)
              </label>
              <textarea
                rows={3}
                value={banReasonInput}
                onChange={(e) => setBanReasonInput(e.target.value)}
                placeholder="예: 불법 광고 및 음란물 유포로 인한 계정 이용제한 (운영정책 위반)"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  boxSizing: 'border-box',
                  fontSize: '13px',
                  resize: 'none',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setBanTargetUser(null)}
                disabled={banning}
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
                onClick={handleConfirmBan}
                disabled={banning}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '13px',
                }}
              >
                {banning ? '처리 중...' : '계정 정지 실행'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 회원 영구 탈퇴 확인 모달 */}
      {targetUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
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
              maxWidth: '440px',
              width: '100%',
              border: '1px solid var(--border-color)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <AlertTriangle size={22} color="var(--ig-danger)" />
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                회원 영구 탈퇴 / 계정 삭제
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
              정말로 <strong>@{targetUser.username}</strong> 회원을 영구 삭제하시겠습니까?
              <br />
              <span style={{ color: 'var(--ig-danger)', fontWeight: 600 }}>
                해당 회원의 모든 게시물, 릴스, 댓글, 메시지가 데이터베이스에서 영구적으로 삭제되며 복구할 수 없습니다.
              </span>
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setTargetUser(null)}
                disabled={deleting}
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
                onClick={handleConfirmDelete}
                disabled={deleting}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: 'var(--ig-danger)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '13px',
                }}
              >
                {deleting ? '삭제 처리 중...' : '영구 삭제 확정'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;
