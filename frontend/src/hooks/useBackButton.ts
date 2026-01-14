import { useEffect, useCallback } from 'react';

/**
 * Hook to handle Android back button (and browser back) for modals.
 * Pushes a state to history when modal opens and closes modal on back navigation.
 *
 * @param isOpen - Whether the modal is currently open
 * @param onClose - Function to close the modal
 * @param modalId - Unique identifier for this modal (to handle nested modals)
 */
export function useBackButton(isOpen: boolean, onClose: () => void, modalId: string) {
  const handlePopState = useCallback((event: PopStateEvent) => {
    // Check if this modal's state was popped
    if (event.state?.modalId !== modalId && isOpen) {
      onClose();
    }
  }, [isOpen, onClose, modalId]);

  useEffect(() => {
    if (!isOpen) return;

    // Push state to history when modal opens
    const state = { modalId, modalOpen: true };
    window.history.pushState(state, '', window.location.href);

    // Listen for back button
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);

      // If modal is closing normally (not via back button), clean up history
      // Check if current state is our modal state
      if (window.history.state?.modalId === modalId) {
        window.history.back();
      }
    };
  }, [isOpen, modalId, handlePopState]);
}

/**
 * Hook to prevent pull-to-refresh on mobile when scrolling inside a modal.
 * This is critical for iOS/Android where pulling down can trigger page refresh.
 *
 * @param ref - Ref to the scrollable container
 * @param isOpen - Whether the modal is currently open
 */
export function usePreventPullToRefresh(
  ref: React.RefObject<HTMLElement>,
  isOpen: boolean
) {
  useEffect(() => {
    if (!isOpen || !ref.current) return;

    const element = ref.current;

    const preventPullToRefresh = (e: TouchEvent) => {
      // Only prevent if we're at the top and trying to pull down
      if (element.scrollTop === 0) {
        const touch = e.touches[0];
        const startY = touch.clientY;

        const handleTouchMove = (moveEvent: TouchEvent) => {
          const currentY = moveEvent.touches[0].clientY;
          // If pulling down from top, prevent default
          if (currentY > startY && element.scrollTop === 0) {
            moveEvent.preventDefault();
          }
        };

        const handleTouchEnd = () => {
          element.removeEventListener('touchmove', handleTouchMove);
          element.removeEventListener('touchend', handleTouchEnd);
        };

        element.addEventListener('touchmove', handleTouchMove, { passive: false });
        element.addEventListener('touchend', handleTouchEnd);
      }
    };

    element.addEventListener('touchstart', preventPullToRefresh, { passive: true });

    return () => {
      element.removeEventListener('touchstart', preventPullToRefresh);
    };
  }, [ref, isOpen]);
}
