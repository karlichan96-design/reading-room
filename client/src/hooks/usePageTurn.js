import { useEffect } from 'react';

const SWIPE_THRESHOLD = 50;
const INTERACTIVE_SELECTOR = 'a, button, input, textarea, select, [role="button"]';

// Attaches tap-zone (left third = prev, right third = next) and horizontal
// swipe navigation to a DOM element, for a book-like page-turning feel.
export function usePageTurn(ref, { onPrev, onNext, enabled = true }) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    let touchStartX = null;

    function handleTouchStart(e) {
      touchStartX = e.changedTouches[0].clientX;
    }

    function handleTouchEnd(e) {
      if (touchStartX == null) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      touchStartX = null;
      if (Math.abs(dx) < SWIPE_THRESHOLD) return;
      if (dx < 0) onNext();
      else onPrev();
    }

    function handleClick(e) {
      if (e.target.closest?.(INTERACTIVE_SELECTOR)) return;
      const selection = el.ownerDocument.getSelection?.().toString();
      if (selection) return;

      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const third = rect.width / 3;
      if (x < third) onPrev();
      else if (x > third * 2) onNext();
    }

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });
    el.addEventListener('click', handleClick);

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('click', handleClick);
    };
  }, [ref, onPrev, onNext, enabled]);
}
