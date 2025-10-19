import { useState, useEffect } from 'react';

interface OrientationState {
  isPortrait: boolean;
  isLandscape: boolean;
}

export function useOrientation(): OrientationState {
  const [orientation, setOrientation] = useState<OrientationState>(() => {
    if (typeof window === 'undefined') {
      return { isPortrait: true, isLandscape: false };
    }
    const isPortrait = window.matchMedia("(orientation: portrait)").matches;
    return {
      isPortrait,
      isLandscape: !isPortrait,
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const portraitQuery = window.matchMedia("(orientation: portrait)");
    
    const handleOrientationChange = (e: MediaQueryListEvent | MediaQueryList) => {
      const isPortrait = e.matches;
      setOrientation({
        isPortrait,
        isLandscape: !isPortrait,
      });
    };

    // Initial check
    handleOrientationChange(portraitQuery);

    // Listen for changes
    portraitQuery.addEventListener('change', handleOrientationChange);

    return () => {
      portraitQuery.removeEventListener('change', handleOrientationChange);
    };
  }, []);

  return orientation;
}
