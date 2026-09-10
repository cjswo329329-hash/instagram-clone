import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { DropZone } from './DropZone';
import { ImageEditor } from './ImageEditor';
import { CaptionInput } from './CaptionInput';
import { useModal } from '../../contexts/ModalContext';
import { useAuth } from '../../contexts/AuthContext';
import { postApi, uploadApi } from '../../services';

export const CreatePostModal = () => {
  const { isCreateOpen, closeCreatePost, addNewPost } = useModal();
  const { user } = useAuth();

  const [step, setStep] = useState(1); // 1: select, 2: crop, 3: caption
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [aspectRatio, setAspectRatio] = useState('1 / 1');
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetState = () => {
    setStep(1);
    setSelectedImages([]);
    setSelectedFiles([]);
    setAspectRatio('1 / 1');
    setCaption('');
    setLocation('');
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetState();
    closeCreatePost();
  };

  const handleSelectImages = (urls, files = []) => {
    setSelectedImages(urls);
    setSelectedFiles(files || []);
    setStep(2);
  };

  const handleShare = async () => {
    setIsSubmitting(true);
    try {
      let finalMediaUrls = [];

      // 1. Upload files if real file objects are present
      if (selectedFiles && selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const res = await uploadApi.uploadMedia(file, 'posts');
          finalMediaUrls.push(res.url);
        }
      } else {
        // Sample/direct URLs
        finalMediaUrls = selectedImages;
      }

      if (finalMediaUrls.length === 0) {
        alert('업로드할 사진을 선택해주세요.');
        setIsSubmitting(false);
        return;
      }

      // 2. Create post via backend API
      const newPost = await postApi.createPost({
        caption: caption.trim() || undefined,
        location: location.trim() || undefined,
        media_urls: finalMediaUrls
      });

      addNewPost(newPost);
      handleClose();
    } catch (err) {
      console.error('Failed to create post:', err);
      const detail = err.response?.data?.detail || err.response?.data?.message;
      let errorMsg = '게시물 등록 중 오류가 발생했습니다.';
      if (typeof detail === 'string') {
        errorMsg = detail;
      } else if (Array.isArray(detail)) {
        errorMsg = detail.map(d => d.msg || JSON.stringify(d)).join('\n');
      } else if (err.message) {
        errorMsg = err.message;
      }
      alert(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    if (step === 1) return '새 게시물 만들기';
    if (step === 2) return '자르기';
    return '새 게시물 만들기';
  };

  return (
    <Modal
      isOpen={isCreateOpen}
      onClose={handleClose}
      maxWidth={step === 3 ? '780px' : '560px'}
      width="92%"
      showCloseButton={false}
    >
      {/* Modal Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-elevated)',
        }}
      >
        {step > 1 ? (
          <button
            onClick={() => setStep(prev => prev - 1)}
            style={{ color: 'var(--text-primary)', padding: '4px' }}
          >
            <ArrowLeft size={22} />
          </button>
        ) : (
          <div style={{ width: '24px' }} />
        )}

        <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
          {getTitle()}
        </h2>

        {step === 2 && (
          <Button
            variant="text"
            onClick={() => setStep(3)}
            style={{ fontSize: '14px', fontWeight: 600 }}
          >
            다음
          </Button>
        )}

        {step === 3 && (
          <Button
            variant="text"
            onClick={handleShare}
            loading={isSubmitting}
            style={{ fontSize: '14px', fontWeight: 600 }}
          >
            공유하기
          </Button>
        )}

        {step === 1 && <div style={{ width: '24px' }} />}
      </div>

      {/* Modal Body */}
      <div>
        {step === 1 && <DropZone onSelectImages={handleSelectImages} />}
        {step === 2 && (
          <ImageEditor
            images={selectedImages}
            aspectRatio={aspectRatio}
            onChangeAspectRatio={setAspectRatio}
          />
        )}
        {step === 3 && (
          <CaptionInput
            images={selectedImages}
            aspectRatio={aspectRatio}
            caption={caption}
            onChangeCaption={setCaption}
            location={location}
            onChangeLocation={setLocation}
          />
        )}
      </div>
    </Modal>
  );
};
