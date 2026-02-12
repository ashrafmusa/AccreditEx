import { useEffect } from 'react';

/**
 * useArrowNavigation Hook
 * 
 * Provides keyboard navigation (Arrow keys, Home, End) for navigation items.
 * Enhances accessibility by allowing keyboard-only users to navigate efficiently.
 * 
 * @param containerRef - Ref to the container element with navigation items
 * @param itemSelector - CSS selector for focusable items (default: 'button, a')
 * 
 * @example
 * ```tsx
 * const NavigationRail = () => {
 *   const navRef = useRef<HTMLElement>(null);
 *   useArrowNavigation(navRef);
 *   
 *   return <nav ref={navRef}>...</nav>;
 * };
 * ```
 * 
 * Keyboard shortcuts:
 * - ArrowDown/ArrowRight: Move to next item
 * - ArrowUp/ArrowLeft: Move to previous item
 * - Home: Jump to first item
 * - End: Jump to last item
 */
export const useArrowNavigation = (
  containerRef: React.RefObject<HTMLElement | null>,
  itemSelector: string = 'button, a'
) => {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Get all focusable items
      const items = Array.from(
        container.querySelectorAll(itemSelector)
      ) as HTMLElement[];

      if (items.length === 0) return;

      // Find currently focused item
      const currentIndex = items.indexOf(document.activeElement as HTMLElement);
      
      // If no item is focused, don't handle the event
      if (currentIndex === -1) return;

      let nextIndex = currentIndex;

      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : currentIndex;
          break;

        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          nextIndex = currentIndex > 0 ? currentIndex - 1 : 0;
          break;

        case 'Home':
          e.preventDefault();
          nextIndex = 0;
          break;

        case 'End':
          e.preventDefault();
          nextIndex = items.length - 1;
          break;

        default:
          // Not a navigation key, don't handle
          return;
      }

      // Focus the next item
      items[nextIndex]?.focus();
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, itemSelector]);
};
