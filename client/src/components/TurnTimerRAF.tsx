import { useEffect, useState, useRef } from 'react';
import { useRAFTimer } from '@/hooks/useRAFAnimation';

interface TurnTimerProps {
  duration: number;
}

export function TurnTimerRAF({ duration }: TurnTimerProps) {
  const { progress, start, stop } = useRAFTimer(duration, () => {
    // Timer completed callback
  });

  useEffect(() => {
    start();
    return () => stop();
  }, [start, stop]);

  // Calculate stroke dash offset for circle animation
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div 
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      role="progressbar"
      aria-label="Bot thinking timer"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-live="polite"
    >
      <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="rgba(255, 215, 0, 0.2)"
          strokeWidth="5"
          fill="transparent"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="rgba(255, 215, 0, 1)"
          strokeWidth="5"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-none"
          style={{
            transform: 'translateZ(0)', // Hardware acceleration
          }}
        />
      </svg>
    </div>
  );
}