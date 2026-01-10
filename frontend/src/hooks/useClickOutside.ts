import { RefObject, useEffect } from 'react';

/**
 * Hook that handles click-outside detection with proper mousedown/mouseup tracking.
 * Only triggers callback if BOTH mousedown and mouseup occur outside the referenced element.
 * This prevents accidentally closing modals when selecting text by dragging from inside to outside.
 */
export function useClickOutside(
  ref: RefObject<HTMLElement>,
  callback: () => void
) {
  useEffect(() => {
    let mouseDownTarget: EventTarget | null = null;

    const handleMouseDown = (event: MouseEvent) => {
      mouseDownTarget = event.target;
    };

    const handleMouseUp = (event: MouseEvent) => {
      // Only trigger callback if:
      // 1. The ref element exists
      // 2. Both mousedown and mouseup happened outside the element
      if (
        ref.current &&
        mouseDownTarget &&
        !ref.current.contains(mouseDownTarget as Node) &&
        !ref.current.contains(event.target as Node)
      ) {
        callback();
      }
      mouseDownTarget = null;
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [ref, callback]);
}
