import { motion } from 'framer-motion';

interface TurnTimerProps {
  duration: number;
}

export function TurnTimer({ duration }: TurnTimerProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="rgba(255, 215, 0, 0.2)"
          strokeWidth="5"
          fill="transparent"
        />
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          stroke="rgba(255, 215, 0, 1)"
          strokeWidth="5"
          fill="transparent"
          strokeDasharray="282.7"
          strokeDashoffset="282.7"
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
        />
      </svg>
    </div>
  );
}
