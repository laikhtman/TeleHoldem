import { useState, useEffect } from 'react';
import { animate } from 'framer-motion';

export function useAnimatedCounter(targetValue: number) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const controls = animate(value, targetValue, {
      duration: 0.5,
      onUpdate(latest) {
        setValue(Math.round(latest));
      },
    });
    return () => controls.stop();
  }, [targetValue, value]);

  return value;
}
