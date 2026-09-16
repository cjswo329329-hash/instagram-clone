import api from './api';

export const adminApi = {
  // 통계 대시보드 데이터 조회
  getStats: async () => {
    const res = await api.get('/admin/stats');
    return res.data;
  },

  // 회원 관리 목록 조회 (가입날짜, 검색, 정렬, 상태필터, 페이징)
  getUsers: async ({ page = 1, pageSize = 15, q = '', sortBy = 'created_at_desc', statusFilter = '' } = {}) => {
    const params = { page, page_size: pageSize, sort_by: sortBy };
    if (q && q.trim()) {
      params.q = q.trim();
      params.search = q.trim();
    }
    if (statusFilter && statusFilter.trim()) {
      params.status_filter = statusFilter.trim();
      params.status = statusFilter.trim();
    }
    const res = await api.get('/admin/users', { params });
    return res.data;
  },

  // 회원 계정 정지 (Ban)
  banUser: async (userId, reason) => {
    const res = await api.post(`/admin/users/${userId}/ban`, { reason });
    return res.data;
  },

  // 회원 계정 정지 해제 (Unban)
  unbanUser: async (userId) => {
    const res = await api.post(`/admin/users/${userId}/unban`);
    return res.data;
  },

  // 회원 영구 삭제
  deleteUser: async (userId) => {
    const res = await api.delete(`/admin/users/${userId}`);
    return res.data;
  },

  // 게시물 관리 목록 조회 (검색, 미디어유형, 정렬, 페이징)
  getPosts: async ({ page = 1, pageSize = 15, q = '', sortBy = 'created_at_desc', mediaType = '' } = {}) => {
    const params = { page, page_size: pageSize, sort_by: sortBy };
    if (q && q.trim()) {
      params.q = q.trim();
      params.search = q.trim();
    }
    if (mediaType && mediaType.trim()) {
      params.media_type = mediaType.trim();
    }
    const res = await api.get('/admin/posts', { params });
    return res.data;
  },

  // 게시물 관리자 권한 강제 삭제
  deletePost: async (postId) => {
    const res = await api.delete(`/admin/posts/${postId}`);
    return res.data;
  },

  // 릴스 관리 목록 조회 (검색, 정렬, 페이징)
  getReels: async ({ page = 1, pageSize = 15, q = '', sortBy = 'created_at_desc' } = {}) => {
    const params = { page, page_size: pageSize, sort_by: sortBy };
    if (q && q.trim()) {
      params.q = q.trim();
      params.search = q.trim();
    }
    const res = await api.get('/admin/reels', { params });
    return res.data;
  },

  // 릴스 동영상 관리자 권한 강제 삭제
  deleteReel: async (reelId) => {
    const res = await api.delete(`/admin/reels/${reelId}`);
    return res.data;
  },

  // 신고 접수 목록 조회 (상태, 대상유형, 검색어, 페이징)
  getReports: async ({ page = 1, pageSize = 15, statusFilter = '', targetType = '', q = '' } = {}) => {
    const params = { page, page_size: pageSize };
    if (statusFilter && statusFilter.trim()) {
      params.status_filter = statusFilter.trim();
      params.status = statusFilter.trim();
    }
    if (targetType && targetType.trim()) {
      params.target_type = targetType.trim();
      params.targetType = targetType.trim();
    }
    if (q && q.trim()) {
      params.q = q.trim();
      params.search = q.trim();
    }
    const res = await api.get('/admin/reports', { params });
    return res.data;
  },

  // 신고 심사 조치 (콘텐츠 삭제, 계정 정지, 기각)
  actionReport: async (reportId, { action, notes = '', banReason = '' } = {}) => {
    const payload = { action, notes };
    if (banReason) {
      payload.ban_reason = banReason;
    }
    const res = await api.post(`/admin/reports/${reportId}/action`, payload);
    return res.data;
  },

  // 관리자 감사 로그 조회 (액션필터, 검색어, 페이징)
  getAuditLogs: async ({ page = 1, pageSize = 20, action = '', q = '' } = {}) => {
    const params = { page, page_size: pageSize };
    if (action && action.trim()) {
      params.action = action.trim();
      params.action_filter = action.trim();
    }
    if (q && q.trim()) {
      params.q = q.trim();
      params.search = q.trim();
    }
    const res = await api.get('/admin/audit-logs', { params });
    return res.data;
  },

  // 실시간 시스템 인프라 및 스토리지 헬스체크
  getSystemHealth: async () => {
    const res = await api.get('/admin/system-health');
    return res.data;
  },
};

export default adminApi;
