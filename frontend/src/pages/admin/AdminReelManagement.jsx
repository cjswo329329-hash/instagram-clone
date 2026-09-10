import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  ArrowUpDown, 
  Trash2, 
  AlertTriangle, 
  Calendar, 
  Heart, 
  MessageCircle, 
  Share2, 
  Play, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle,
  X,
  Music,
  Film
} from 'lucide-react';
import { Avatar } from '../../components/common/Avatar';
import { adminApi } from '../../services';

export const AdminReelManagement = ({ onDataChange }) => {
  const [reels, setReels] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at_desc');
  const [loading, setLoading] = useState(false);

  // 삭제 대상 릴스 상태
  const [targetReel, setTargetReel] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  // 비디오 미리보기 재생 모달 상태
  const [previewVideo, setPreviewVideo] = useState(null);

  const fetchReels = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getReels({
        page,
        pageSize,
        q: searchTerm,
        sortBy,
      });
      setReels(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      console.error('Failed to fetch reels:', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchTerm, sortBy]);

  useEffect(() => {
    fetchReels();
  }, [fetchReels]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
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

  // 릴스 삭제 실행
  const handleConfirmDelete = async () => {
    if (!targetReel) return;
    setDeleting(true);
    try {
      const res = await adminApi.deleteReel(targetReel.id);
      setActionSuccess(res.message || `릴스 (ID: ${targetReel.id})이 성공적으로 삭제되었습니다.`);
      setTargetReel(null);
      fetchReels();
      if (onDataChange) {
        onDataChange();
      }
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      console.error('Delete reel failed:', err);
      alert(err.response?.data?.detail || '릴스 삭제에 실패했습니다.');
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

      {/* 필터 및 검색 바 */}
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
            placeholder="캡션, 작성자, 음원 제목 검색..."
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
            <option value="created_at_desc">최신 등록순 (Newest)</option>
            <option value="created_at_asc">오래된 등록순 (Oldest)</option>
            <option value="likes_desc">좋아요 많은순 (Most Likes)</option>
            <option value="comments_desc">댓글 많은순 (Most Comments)</option>
            <option value="shares_desc">공유 많은순 (Most Shares)</option>
          </select>
        </div>
      </div>

      {/* 릴스 목록 테이블 */}
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
                <th style={{ padding: '14px 16px', width: '90px' }}>비디오</th>
                <th style={{ padding: '14px 16px' }}>작성자</th>
                <th style={{ padding: '14px 16px', minWidth: '240px' }}>캡션 및 오디오</th>
                <th style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={14} />
                    <span>등록 일시</span>
                  </div>
                </th>
                <th style={{ padding: '14px 16px' }}>반응 통계</th>
                <th style={{ padding: '14px 16px', textAlign: 'center' }}>삭제 관리</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    릴스 동영상 목록을 불러오는 중입니다...
                  </td>
                </tr>
              ) : reels.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    {searchTerm ? '검색어와 일치하는 릴스가 없습니다.' : '등록된 릴스가 없습니다.'}
                  </td>
                </tr>
              ) : (
                reels.map((reel) => (
                  <tr
                    key={reel.id}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'background-color 0.15s ease',
                    }}
                    className="admin-table-row"
                  >
                    {/* 비디오 썸네일 & 재생 버튼 */}
                    <td style={{ padding: '12px 16px' }}>
                      <div
                        onClick={() => setPreviewVideo(reel)}
                        style={{
                          width: '54px',
                          height: '76px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          backgroundColor: '#000000',
                          border: '1px solid var(--border-color)',
                          cursor: 'pointer',
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        title="동영상 재생 미리보기"
                      >
                        {reel.poster_url ? (
                          <img
                            src={reel.poster_url}
                            alt="Reel Poster"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <Film size={24} color="#ffffff" />
                        )}
                        <div
                          style={{
                            position: 'absolute',
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(0, 0, 0, 0.65)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                          }}
                        >
                          <Play size={14} fill="#ffffff" style={{ marginLeft: '2px' }} />
                        </div>
                      </div>
                    </td>

                    {/* 작성자 정보 */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Avatar src={reel.author?.profile_image_url} size="xs" />
                        <div>
                          <a
                            href={`/${reel.author?.username}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                              textDecoration: 'none',
                              fontSize: '13px',
                            }}
                          >
                            {reel.author?.username || 'unknown'}
                          </a>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            ID #{reel.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 캡션 및 오디오 음원 정보 */}
                    <td style={{ padding: '12px 16px' }}>
                      <div
                        style={{
                          fontSize: '13px',
                          color: 'var(--text-primary)',
                          lineHeight: 1.4,
                          maxHeight: '40px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {reel.caption || <span style={{ color: 'var(--text-muted)' }}>본문 없음</span>}
                      </div>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '11px',
                          color: '#8b5cf6',
                          marginTop: '6px',
                          backgroundColor: 'rgba(139, 92, 246, 0.08)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                        }}
                      >
                        <Music size={11} />
                        <span>{reel.audio_title}</span>
                      </div>
                    </td>

                    {/* 등록 일시 */}
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '13px', whiteSpace: 'nowrap' }}>
                      {formatDateTime(reel.created_at)}
                    </td>

                    {/* 좋아요 / 댓글 / 공유 통계 */}
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                          <Heart size={14} color="#ed4956" /> {reel.likes_count}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                          <MessageCircle size={14} color="#0095f6" /> {reel.comments_count}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                          <Share2 size={14} color="#8b5cf6" /> {reel.shares_count}
                        </span>
                      </div>
                    </td>

                    {/* 삭제 버튼 */}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <button
                        onClick={() => setTargetReel(reel)}
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
                        릴스 삭제
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
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
            총 <strong>{total}</strong>개의 릴스 (페이지 {page} / {totalPages})
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

      {/* 릴스 삭제 확인 모달 */}
      {targetReel && (
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
              릴스 동영상 강제 삭제
            </h3>

            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 20px 0' }}>
              <strong>@{targetReel.author?.username}</strong> 님의 릴스 영상(ID: {targetReel.id})을 정말 삭제하시겠습니까?
              <br />
              동영상 콘텐츠와 연관된 <strong>댓글, 좋아요, 공유 통계</strong>가 시스템에서 완전히 삭제됩니다.
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => setTargetReel(null)}
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
                {deleting ? '삭제 처리 중...' : '네, 삭제합니다'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 비디오 재생 미리보기 모달 */}
      {previewVideo && (
        <div
          onClick={() => setPreviewVideo(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.88)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '24px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderRadius: '16px',
              maxWidth: '420px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* 상단 헤더 */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Avatar src={previewVideo.author?.profile_image_url} size="xs" />
                <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
                  {previewVideo.author?.username}
                </span>
              </div>
              <button
                onClick={() => setPreviewVideo(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* 비디오 플레이어 */}
            <div style={{ height: '480px', backgroundColor: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <video
                src={previewVideo.video_url}
                poster={previewVideo.poster_url}
                controls
                autoPlay
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>

            {/* 설명 및 정보 */}
            <div style={{ padding: '16px' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {previewVideo.caption || '(본문 내용 없음)'}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#8b5cf6', marginBottom: '10px' }}>
                <Music size={13} />
                <span>{previewVideo.audio_title}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <span>{formatDateTime(previewVideo.created_at)}</span>
                <span>좋아요 {previewVideo.likes_count}개 • 댓글 {previewVideo.comments_count}개 • 공유 {previewVideo.shares_count}회</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReelManagement;
