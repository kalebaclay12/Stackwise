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
      // 3. Not clicking on a higher z-index modal (child modal)
      if (
        ref.current &&
        mouseDownTarget &&
        !ref.current.contains(mouseDownTarget as Node) &&
        !ref.current.contains(event.target as Node)
      ) {
        // Check if click target is part of a higher z-index element (like a child modal)
        const target = event.target as HTMLElement;
        const clickedElement = target.closest('[class*="z-["]');
        if (clickedElement) {
          const zIndexMatch = clickedElement.className.match(/z-\[(\d+)\]/);
          if (zIndexMatch && parseInt(zIndexMatch[1]) > 50) {
            // Don't close if clicking on a higher z-index modal
            mouseDownTarget = null;
            return;
          }
        }
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
