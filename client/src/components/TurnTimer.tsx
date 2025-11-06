import { motion } from 'framer-motion';

interface TurnTimerProps {
  duration: number;
}

export function TurnTimer({ duration }: TurnTimerProps) {
  const isUrgent = duration < 5000; // Less than 5 seconds
  
  return (
    <div 
      className={`absolute inset-0 flex items-center justify-center pointer-events-none ${isUrgent ? 'timer-urgent-glow' : ''}`}
      role="progressbar"
      aria-label="Bot thinking timer"
      aria-valuenow={0}
      aria-valuemin={0}
      aria-valuemax={duration}
      aria-live="polite"
    >
      <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
        {/* Add gradient definition */}
        <defs>
          <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="1" />
            <stop offset="50%" stopColor="#EC4899" stopOpacity="1" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="1" />
          </linearGradient>
        </defs>
        
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="rgba(139, 92, 246, 0.2)"
          strokeWidth="5"
          fill="transparent"
        />
        
        {/* Animated progress circle with gradient */}
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          stroke="url(#timerGradient)"
          strokeWidth="5"
          fill="transparent"
          strokeDasharray="282.7"
          strokeDashoffset="282.7"
          strokeLinecap="round"
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
          style={{
            filter: 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.5))'
          }}
        />
      </svg>
    </div>
  );
}
