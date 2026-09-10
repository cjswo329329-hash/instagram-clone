import { useRef, useCallback } from 'react';

export const useDoubleClick = (onSingleClick, onDoubleClick, latency = 280) => {
  const clickCount = useRef(0);
  const clickTimer = useRef(null);

  const handleClick = useCallback(
    (event) => {
      clickCount.current += 1;

      if (clickCount.current === 1) {
        clickTimer.current = setTimeout(() => {
          clickCount.current = 0;
          if (onSingleClick) onSingleClick(event);
        }, latency);
      } else if (clickCount.current === 2) {
        clearTimeout(clickTimer.current);
        clickCount.current = 0;
        if (onDoubleClick) onDoubleClick(event);
      }
    },
    [onSingleClick, onDoubleClick, latency]
  );

  return handleClick;
};
