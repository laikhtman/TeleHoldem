import { useState, useEffect, useRef } from 'react';
import { animate } from 'framer-motion';

export function useAnimatedCounter(targetValue: number) {
  const [value, setValue] = useState(targetValue);
  const prevTargetRef = useRef(targetValue);

  useEffect(() => {
    // Only animate if target actually changed
    if (prevTargetRef.current === targetValue) return;
    
    const fromValue = prevTargetRef.current;
    prevTargetRef.current = targetValue;
    
    const controls = animate(fromValue, targetValue, {
      duration: 0.5,
      ease: 'easeOut',
      onUpdate(latest) {
        setValue(Math.round(latest));
      },
    });
    
    return () => controls.stop();
  }, [targetValue]);

  return value;
}
