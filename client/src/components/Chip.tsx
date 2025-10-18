import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ChipProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Chip({ className, style }: ChipProps) {
  return (
    <motion.div
      className={cn(
        'w-6 h-6 rounded-full bg-poker-chipGold border-2 border-yellow-600 shadow-md',
        className
      )}
      style={style}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
    />
  );
}
