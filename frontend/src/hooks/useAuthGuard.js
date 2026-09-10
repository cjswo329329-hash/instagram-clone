import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';

export const useAuthGuard = () => {
  const { user } = useAuth();
  const { openAuthPromptModal } = useModal();

  /**
   * Executes callback if logged in, or opens Instagram-style AuthPromptModal if guest.
   * @param {Function} callback Action to execute if authenticated
   * @param {Object} options Modal content configuration { title, description, actionType }
   */
  const requireAuth = (callback, options = {}) => {
    if (user) {
      if (typeof callback === 'function') {
        return callback();
      }
      return;
    }

    // Default messages by actionType if not provided
    const defaultConfigs = {
      like: {
        title: '좋아요를 눌러 마음을 표현해보세요',
        description: 'Instagram에 로그인하여 게시물에 좋아요를 누르고 친구들과 소통해보세요.',
        actionType: 'like',
      },
      comment: {
        title: '댓글을 작성하여 대화에 참여하세요',
        description: 'Instagram에 로그인하여 크리에이터와 의견을 나누고 댓글을 남겨보세요.',
        actionType: 'comment',
      },
      bookmark: {
        title: '게시물을 저장하여 나중에 다시 보세요',
        description: 'Instagram에 로그인하여 마음에 드는 사진과 릴스를 컬렉션에 저장하세요.',
        actionType: 'bookmark',
      },
      follow: {
        title: '계정을 팔로우하여 소식을 받아보세요',
        description: 'Instagram에 로그인하여 최신 게시물과 스토리를 피드에서 확인하세요.',
        actionType: 'follow',
      },
      message: {
        title: '메시지를 보내고 실시간으로 대화하세요',
        description: 'Instagram에 로그인하여 1:1 다이렉트 메시지를 주고받을 수 있습니다.',
        actionType: 'message',
      },
      create: {
        title: '새로운 게시물 만들기',
        description: 'Instagram에 로그인하여 소중한 순간의 사진과 동영상을 공유해보세요.',
        actionType: 'create',
      },
      story: {
        title: '스토리를 시청하고 반응해보세요',
        description: 'Instagram에 로그인하여 24시간 동안 공유되는 일상 스토리를 확인하세요.',
        actionType: 'story',
      },
      default: {
        title: '로그인이 필요한 서비스입니다',
        description: 'Instagram에 로그인하여 친구들의 사진과 동영상을 확인하고 교류해보세요.',
        actionType: 'default',
      }
    };

    const actionKey = options.actionType || 'default';
    const baseConfig = defaultConfigs[actionKey] || defaultConfigs.default;

    openAuthPromptModal({
      title: options.title || baseConfig.title,
      description: options.description || baseConfig.description,
      actionType: options.actionType || baseConfig.actionType,
    });
  };

  return {
    user,
    isAuthenticated: !!user,
    requireAuth,
  };
};
