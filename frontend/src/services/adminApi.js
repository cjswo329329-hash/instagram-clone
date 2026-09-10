import api from './api';

export const adminApi = {
  // 통계 대시보드 데이터 조회
  getStats: async () => {
    const res = await api.get('/admin/stats');
    return res.data;
  },

  // 회원 관리 목록 조회 (가입날짜, 검색, 정렬, 페이징)
  getUsers: async ({ page = 1, pageSize = 15, q = '', sortBy = 'created_at_desc' } = {}) => {
    const params = { page, page_size: pageSize, sort_by: sortBy };
    if (q && q.trim()) {
      params.q = q.trim();
    }
    const res = await api.get('/admin/users', { params });
    return res.data;
  },

  // 회원 탈퇴 처리 / 계정 삭제
  deleteUser: async (userId) => {
    const res = await api.delete(`/admin/users/${userId}`);
    return res.data;
  },

  // 게시물 관리 목록 조회
  getPosts: async ({ page = 1, pageSize = 15, q = '', sortBy = 'created_at_desc' } = {}) => {
    const params = { page, page_size: pageSize, sort_by: sortBy };
    if (q && q.trim()) {
      params.q = q.trim();
    }
    const res = await api.get('/admin/posts', { params });
    return res.data;
  },

  // 게시물 관리자 권한 강제 삭제
  deletePost: async (postId) => {
    const res = await api.delete(`/admin/posts/${postId}`);
    return res.data;
  },

  // 릴스 관리 목록 조회
  getReels: async ({ page = 1, pageSize = 15, q = '', sortBy = 'created_at_desc' } = {}) => {
    const params = { page, page_size: pageSize, sort_by: sortBy };
    if (q && q.trim()) {
      params.q = q.trim();
    }
    const res = await api.get('/admin/reels', { params });
    return res.data;
  },

  // 릴스 동영상 관리자 권한 강제 삭제
  deleteReel: async (reelId) => {
    const res = await api.delete(`/admin/reels/${reelId}`);
    return res.data;
  },
};

export default adminApi;
