import React from 'react';
import { Modal } from './Modal';
import { useModal } from '../../contexts/ModalContext';
import api from '../../services/api';

export const OptionsModal = () => {
  const { activeOptionsPost, closeOptions, deletePost } = useModal();

  if (!activeOptionsPost) return null;

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.origin + `/post/${activeOptionsPost.id}`);
    alert("게시물 링크가 클립보드에 복사되었습니다!");
    closeOptions();
  };

  const handleDelete = () => {
    if (window.confirm("게시물을 정말 삭제하시겠습니까?")) {
      deletePost(activeOptionsPost.id);
      closeOptions();
    }
  };

  const handleReport = async () => {
    try {
      const res = await api.post('/reports', {
        target_type: 'post',
        target_id: activeOptionsPost.id,
        reason_category: 'spam',
        description: '부적절하거나 유해한 게시물 신고',
      });
      alert(res.data.message || '신고가 정상적으로 접수되었습니다.');
    } catch (err) {
      alert(err.response?.data?.detail || '신고 접수에 실패했습니다.');
    } finally {
      closeOptions();
    }
  };

  return (
    <Modal
      isOpen={!!activeOptionsPost}
      onClose={closeOptions}
      maxWidth="400px"
      width="85%"
      showCloseButton={false}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <button
          onClick={handleReport}
          style={{
            padding: '14px',
            color: 'var(--ig-danger)',
            fontWeight: 700,
            fontSize: '14px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          신고
        </button>

        <button
          onClick={handleDelete}
          style={{
            padding: '14px',
            color: 'var(--ig-danger)',
            fontWeight: 700,
            fontSize: '14px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          삭제
        </button>

        <button
          onClick={handleCopyLink}
          style={{
            padding: '14px',
            color: 'var(--text-primary)',
            fontSize: '14px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          링크 복사
        </button>

        <button
          onClick={() => {
            alert("공유창이 열립니다.");
            closeOptions();
          }}
          style={{
            padding: '14px',
            color: 'var(--text-primary)',
            fontSize: '14px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          공유 대상...
        </button>

        <button
          onClick={closeOptions}
          style={{
            padding: '14px',
            color: 'var(--text-primary)',
            fontSize: '14px',
          }}
        >
          취소
        </button>
      </div>
    </Modal>
  );
};
