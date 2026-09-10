import { useEffect, useRef } from 'react';

export const useInfiniteScroll = (callback, options = {}) => {
  const targetRef = useRef(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        callback();
      }
    }, {
      root: null,
      rootMargin: '100px',
      threshold: 0.1,
      ...options
    });

    observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [callback, options]);

  return targetRef;
};
