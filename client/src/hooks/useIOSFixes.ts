import { useEffect } from 'react';

export function useIOSFixes() {
  useEffect(() => {
    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    if (isIOS) {
      document.documentElement.classList.add('ios');
    }
    
    if (isSafari) {
      document.documentElement.classList.add('safari');
    }

    // Fix iOS viewport height
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setVH();
    
    // Update on resize and orientation change
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
    
    // Handle orientation change with delay for iOS
    const handleOrientationChange = () => {
      setTimeout(() => {
        setVH();
        // Force a reflow to ensure proper rendering
        document.documentElement.style.display = 'none';
        document.documentElement.offsetHeight; // Force reflow
        document.documentElement.style.display = '';
      }, 100);
    };
    window.addEventListener('orientationchange', handleOrientationChange);

    // Prevent iOS bounce scrolling on non-scrollable elements
    let touchStartY = 0;
    let touchStartX = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (!e.target) return;
      
      const element = e.target as HTMLElement;
      const scrollableElement = element.closest('.allow-scroll, .scrollable-area');
      
      if (!scrollableElement) {
        // Prevent scrolling on non-scrollable elements
        e.preventDefault();
        return;
      }
      
      // Allow scrolling within scrollable elements but prevent overscroll
      const touchEndY = e.touches[0].clientY;
      const touchEndX = e.touches[0].clientX;
      const deltaY = touchEndY - touchStartY;
      const deltaX = Math.abs(touchEndX - touchStartX);
      
      // If horizontal movement is greater, allow it (for sliders, etc.)
      if (deltaX > Math.abs(deltaY)) {
        return;
      }
      
      const scrollTop = scrollableElement.scrollTop;
      const scrollHeight = scrollableElement.scrollHeight;
      const clientHeight = scrollableElement.clientHeight;
      
      // Prevent overscroll at boundaries
      if ((scrollTop <= 0 && deltaY > 0) || 
          (scrollTop + clientHeight >= scrollHeight && deltaY < 0)) {
        e.preventDefault();
      }
    };
    
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    // Fix iOS keyboard issues
    const handleInputFocus = (e: FocusEvent) => {
      if (!isIOS) return;
      
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        // Delay to let iOS keyboard animation complete
        setTimeout(() => {
          // Ensure the input is visible
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Prevent body scroll
          document.body.style.position = 'fixed';
          document.body.style.width = '100%';
        }, 300);
      }
    };
    
    const handleInputBlur = () => {
      if (!isIOS) return;
      
      // Restore body scroll
      document.body.style.position = '';
      document.body.style.width = '';
      
      // Reset scroll position
      setTimeout(() => {
        window.scrollTo(0, 0);
        document.body.scrollTop = 0;
      }, 100);
    };
    
    document.addEventListener('focusin', handleInputFocus);
    document.addEventListener('focusout', handleInputBlur);

    // Disable double-tap zoom
    let lastTouchEnd = 0;
    const handleTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };
    document.addEventListener('touchend', handleTouchEnd, { passive: false });

    // Fix iOS safe area on rotation
    const updateSafeAreas = () => {
      const root = document.documentElement;
      const computedStyle = getComputedStyle(root);
      
      // Update CSS variables if they're not being applied correctly
      const safeAreaTop = computedStyle.getPropertyValue('--safe-area-top');
      const safeAreaBottom = computedStyle.getPropertyValue('--safe-area-bottom');
      const safeAreaLeft = computedStyle.getPropertyValue('--safe-area-left');
      const safeAreaRight = computedStyle.getPropertyValue('--safe-area-right');
      
      if (!safeAreaTop || safeAreaTop === '0px') {
        root.style.setProperty('--safe-area-top', 'env(safe-area-inset-top, 0px)');
      }
      if (!safeAreaBottom || safeAreaBottom === '0px') {
        root.style.setProperty('--safe-area-bottom', 'env(safe-area-inset-bottom, 0px)');
      }
      if (!safeAreaLeft || safeAreaLeft === '0px') {
        root.style.setProperty('--safe-area-left', 'env(safe-area-inset-left, 0px)');
      }
      if (!safeAreaRight || safeAreaRight === '0px') {
        root.style.setProperty('--safe-area-right', 'env(safe-area-inset-right, 0px)');
      }
    };
    
    updateSafeAreas();
    window.addEventListener('resize', updateSafeAreas);

    // Prevent pinch zoom
    const handleGestureStart = (e: Event) => {
      e.preventDefault();
    };
    document.addEventListener('gesturestart', handleGestureStart);

    // Clean up event listeners
    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', updateSafeAreas);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('focusin', handleInputFocus);
      document.removeEventListener('focusout', handleInputBlur);
      document.removeEventListener('gesturestart', handleGestureStart);
    };
  }, []);
}