import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { initialPosts, initialStories, initialExplorePosts } from '../data/mockData';
import { postApi, storyApi, exploreApi } from '../services';
import { useAuth } from './AuthContext';

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
  const { user } = useAuth();

  const [posts, setPosts] = useState(() => {
    return initialPosts.map(p => ({ ...p, isLiked: false, isBookmarked: false }));
  });

  const [stories, setStories] = useState(() => {
    return initialStories;
  });

  const [explorePosts, setExplorePosts] = useState(() => {
    return initialExplorePosts;
  });

  const [feedLoading, setFeedLoading] = useState(false);
  const [feedCursor, setFeedCursor] = useState(null);
  const [hasMoreFeed, setHasMoreFeed] = useState(true);
  const [loadingMoreFeed, setLoadingMoreFeed] = useState(false);

  // Fetch real feed from backend
  const fetchFeed = useCallback(async () => {
    try {
      setFeedLoading(true);
      const res = await postApi.getFeed(10);
      if (res && Array.isArray(res.items)) {
        setPosts(res.items);
        setFeedCursor(res.next_cursor);
        setHasMoreFeed(res.has_more);
      }
    } catch (err) {
      console.warn('Could not fetch feed from backend, using default initial:', err);
    } finally {
      setFeedLoading(false);
    }
  }, []);

  // Fetch more feed for infinite scroll
  const loadMoreFeed = useCallback(async () => {
    if (!hasMoreFeed || loadingMoreFeed || !feedCursor) return;
    try {
      setLoadingMoreFeed(true);
      const res = await postApi.getFeed(10, feedCursor);
      if (res && res.items && res.items.length > 0) {
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newItems = res.items.filter(p => !existingIds.has(p.id));
          return [...prev, ...newItems];
        });
        setFeedCursor(res.next_cursor);
        setHasMoreFeed(res.has_more);
      } else {
        setHasMoreFeed(false);
      }
    } catch (err) {
      console.warn('Failed to load more feed:', err);
    } finally {
      setLoadingMoreFeed(false);
    }
  }, [hasMoreFeed, loadingMoreFeed, feedCursor]);

  // Fetch real stories from backend
  const fetchStories = useCallback(async () => {
    try {
      const res = await storyApi.getStoriesFeed();
      if (res && res.length > 0) {
        const normalized = res.map(item => ({
          userId: item.user?.id || item.userId,
          username: item.user?.username || item.username,
          fullName: item.user?.full_name || item.fullName,
          profileImage: item.user?.profile_image_url || item.user?.profileImageUrl || item.profileImage,
          hasUnseen: item.has_unseen ?? item.hasUnseen ?? true,
          stories: (item.stories || []).map(st => ({
            id: st.id,
            mediaUrl: st.media_url || st.mediaUrl,
            mediaType: st.media_type || st.mediaType || 'image',
            createdAt: st.created_at || st.createdAt,
            timeAgo: st.timeAgo || '방금 전',
            isViewed: st.is_viewed ?? st.isViewed ?? false
          }))
        }));
        setStories(normalized);
        localStorage.setItem('ig_stories', JSON.stringify(normalized));
      }
    } catch (err) {
      console.warn('Could not fetch stories from backend:', err);
    }
  }, []);

  useEffect(() => {
    // 사용자 로그인/로그아웃/계정 전환 시 피드 및 스토리 최신 상태 갱신
    fetchFeed();
    fetchStories();
  }, [user, fetchFeed, fetchStories]);

  useEffect(() => {
    localStorage.setItem('ig_stories', JSON.stringify(stories));
  }, [stories]);

  useEffect(() => {
    localStorage.setItem('ig_explore_posts_v3', JSON.stringify(explorePosts));
  }, [explorePosts]);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [activeStory, setActiveStory] = useState(null); // { userId, initialIndex }
  const [activePostDetail, setActivePostDetail] = useState(null); // post object or id
  const [focusCommentOnDetail, setFocusCommentOnDetail] = useState(false);
  const [activeOptionsPost, setActiveOptionsPost] = useState(null);
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const [authPromptConfig, setAuthPromptConfig] = useState(null);

  const openAuthPromptModal = (config = {}) => {
    setAuthPromptConfig(config);
    setIsAuthPromptOpen(true);
  };
  const closeAuthPromptModal = () => {
    setIsAuthPromptOpen(false);
    setAuthPromptConfig(null);
  };

  const openCreatePost = () => setIsCreateOpen(true);
  const closeCreatePost = () => setIsCreateOpen(false);

  const openNotifications = () => setIsNotificationsOpen(true);
  const closeNotifications = () => setIsNotificationsOpen(false);

  const openStoryViewer = (userStory, initialIndex = 0) => {
    setActiveStory({ ...userStory, initialIndex });
  };
  const closeStoryViewer = () => setActiveStory(null);

  const openPostDetail = (post, options = {}) => {
    setActivePostDetail(post);
    setFocusCommentOnDetail(!!options?.focusComment);
  };
  const closePostDetail = () => {
    setActivePostDetail(null);
    setFocusCommentOnDetail(false);
  };

  const openOptions = (post) => setActiveOptionsPost(post);
  const closeOptions = () => setActiveOptionsPost(null);

  // Global Actions for posts with backend synchronization
  const toggleLikePost = async (postId) => {
    // Optimistic update
    setPosts(prev =>
      prev.map(p => {
        if (p.id === postId) {
          const isLiked = !p.isLiked;
          return {
            ...p,
            isLiked,
            likesCount: isLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1)
          };
        }
        return p;
      })
    );

    setActivePostDetail(prev => {
      if (prev && prev.id === postId) {
        const isLiked = !prev.isLiked;
        return {
          ...prev,
          isLiked,
          likesCount: isLiked ? prev.likesCount + 1 : Math.max(0, prev.likesCount - 1)
        };
      }
      return prev;
    });

    try {
      const res = await postApi.togglePostLike(postId);
      // Sync actual likes_count if returned
      if (res && typeof res.likes_count === 'number') {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, isLiked: res.liked, likesCount: res.likes_count } : p));
      }
    } catch (err) {
      console.error('Failed to toggle like on backend:', err);
      // Rollback
      setPosts(prev =>
        prev.map(p => {
          if (p.id === postId) {
            const isLiked = !p.isLiked;
            return {
              ...p,
              isLiked,
              likesCount: isLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1)
            };
          }
          return p;
        })
      );
    }
  };

  const toggleBookmarkPost = async (postId) => {
    // Optimistic update
    setPosts(prev =>
      prev.map(p => {
        if (p.id === postId) {
          return { ...p, isBookmarked: !p.isBookmarked };
        }
        return p;
      })
    );
    setActivePostDetail(prev => {
      if (prev && prev.id === postId) {
        return { ...prev, isBookmarked: !prev.isBookmarked };
      }
      return prev;
    });

    try {
      await postApi.togglePostBookmark(postId);
    } catch (err) {
      console.error('Failed to toggle bookmark on backend:', err);
      // Rollback
      setPosts(prev =>
        prev.map(p => {
          if (p.id === postId) {
            return { ...p, isBookmarked: !p.isBookmarked };
          }
          return p;
        })
      );
    }
  };

  const addCommentToPost = async (postId, user, text, parentId = null) => {
    const optimisticComment = {
      id: Date.now(),
      username: user?.username || 'me',
      text,
      timeAgo: "방금 전",
      likes: 0,
      parentId: parentId,
      replies: []
    };

    // Optimistic UI update
    setPosts(prev =>
      prev.map(p => {
        if (p.id === postId) {
          const currentComments = p.comments || [];
          let updatedComments;
          if (parentId) {
            updatedComments = currentComments.map(c => {
              if (c.id === parentId) {
                return {
                  ...c,
                  replies_count: (c.replies_count || c.replies?.length || 0) + 1,
                  replies: [...(c.replies || []), optimisticComment]
                };
              }
              return c;
            });
          } else {
            updatedComments = [...currentComments, optimisticComment];
          }
          return {
            ...p,
            commentsCount: (p.commentsCount || 0) + 1,
            comments: updatedComments
          };
        }
        return p;
      })
    );

    setActivePostDetail(prev => {
      if (prev && prev.id === postId) {
        const currentComments = prev.comments || [];
        let updatedComments;
        if (parentId) {
          updatedComments = currentComments.map(c => {
            if (c.id === parentId) {
              return {
                ...c,
                replies_count: (c.replies_count || c.replies?.length || 0) + 1,
                replies: [...(c.replies || []), optimisticComment]
              };
            }
            return c;
          });
        } else {
          updatedComments = [...currentComments, optimisticComment];
        }
        return {
          ...prev,
          commentsCount: (prev.commentsCount || 0) + 1,
          comments: updatedComments
        };
      }
      return prev;
    });

    try {
      const res = await postApi.addComment(postId, text, parentId);
      return res;
    } catch (err) {
      console.error('Failed to add comment on backend:', err);
    }
  };

  const addNewPost = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
  };

  const deletePost = async (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    if (activePostDetail && activePostDetail.id === postId) {
      setActivePostDetail(null);
    }
    try {
      await postApi.deletePost(postId);
    } catch (err) {
      console.error('Failed to delete post on backend:', err);
    }
  };

  return (
    <ModalContext.Provider
      value={{
        posts,
        setPosts,
        feedLoading,
        fetchFeed,
        loadMoreFeed,
        hasMoreFeed,
        loadingMoreFeed,
        stories,
        setStories,
        fetchStories,
        explorePosts,
        setExplorePosts,
        isCreateOpen,
        openCreatePost,
        closeCreatePost,
        isNotificationsOpen,
        openNotifications,
        closeNotifications,
        activeStory,
        openStoryViewer,
        closeStoryViewer,
        activePostDetail,
        focusCommentOnDetail,
        setFocusCommentOnDetail,
        openPostDetail,
        closePostDetail,
        activeOptionsPost,
        openOptions,
        closeOptions,
        isAuthPromptOpen,
        authPromptConfig,
        openAuthPromptModal,
        closeAuthPromptModal,
        toggleLikePost,
        toggleBookmarkPost,
        addCommentToPost,
        addNewPost,
        deletePost
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => useContext(ModalContext);
