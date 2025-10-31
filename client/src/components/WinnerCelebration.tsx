import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Coins } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSound } from '@/hooks/useSound';

interface WinnerCelebrationProps {
  isWinner: boolean;
  playerName: string;
  winAmount?: number;
}


export function WinnerCelebration({ isWinner, playerName, winAmount = 0 }: WinnerCelebrationProps) {
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; delay: number; color: string }>>([]);
  const { playSound } = useSound();
  const isBigWin = winAmount > 300;

  useEffect(() => {
    if (isWinner) {
      // Play victory sound based on win amount
      const isBigWin = winAmount > 300; // Consider wins over $300 as "big wins"
      if (isBigWin) {
        playSound('victory-big', { volume: 0.35 });
      } else {
        playSound('victory-small', { volume: 0.3 });
      }

      // Also play chip collect sound for the win
      setTimeout(() => {
        playSound('chip-collect', { volume: 0.25 });
      }, 500);

      let reduced = false;
      try {
        const raw = localStorage.getItem('pokerGameSettings');
        if (raw) {
          const parsed = JSON.parse(raw);
          reduced = !!parsed.reducedParticles;
        }
      } catch {}
      const particleCount = reduced ? (isBigWin ? 20 : 12) : (isBigWin ? 50 : 30);
      const particles = Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        x: Math.random() * (isBigWin ? 300 : 200) - (isBigWin ? 150 : 100),
        delay: Math.random() * (isBigWin ? 0.6 : 0.3),
        color: ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4'][Math.floor(Math.random() * 4)]
      }));
      setConfetti(particles);
      
      const timer = setTimeout(() => {
        setConfetti([]);
      }, reduced ? 2000 : (isBigWin ? 3500 : 2500));
      
      return () => clearTimeout(timer);
    }
  }, [isWinner, winAmount, playSound]);

  return (
    <AnimatePresence>
      {isWinner && (
        <motion.div
          className="absolute inset-0 pointer-events-none overflow-hidden z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          data-testid="winner-celebration"
        >
          {/* Confetti particles */}
          {confetti.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute"
              style={{
                left: '50%',
                top: '20%',
                width: '8px',
                height: '8px',
                backgroundColor: particle.color,
                borderRadius: Math.random() > 0.5 ? '50%' : '0%',
              }}
              initial={{ 
                x: 0, 
                y: 0, 
                opacity: 1,
                scale: 0,
                rotate: 0
              }}
              animate={{ 
                x: particle.x * (isBigWin ? 2.5 : 2),
                y: [0, isBigWin ? -140 : -100, isBigWin ? 120 : 100],
                opacity: [1, 1, 0],
                scale: [0, 1, 0.6],
                rotate: Math.random() * 720 - 360
              }}
              transition={{ 
                duration: isBigWin ? 2.6 : 2,
                delay: particle.delay,
                ease: "easeOut"
              }}
            />
          ))}

          {/* Winner badge */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            initial={{ scale: 0, rotate: -180, opacity: 0 }}
            animate={{ 
              scale: [0, 1.2, 1],
              rotate: [0, 10, -10, 0],
              opacity: 1
            }}
            exit={{ 
              scale: 0,
              opacity: 0,
              transition: { duration: 0.3 }
            }}
            transition={{ 
              duration: 0.6,
              ease: "easeOut"
            }}
          >
            <div className="bg-gradient-to-br from-poker-chipGold via-yellow-400 to-poker-chipGold text-black px-8 py-4 rounded-lg shadow-2xl border-4 border-yellow-300">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ 
                    rotate: [0, 15, -15, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 0.5,
                    repeat: 3,
                    ease: "easeInOut"
                  }}
                >
                  <Trophy className="w-8 h-8" />
                </motion.div>
                <div>
                  <div className="text-2xl font-bold tracking-wider">WINNER!</div>
                  <div className="text-sm font-semibold opacity-80">{playerName}</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Floating coins */}
          {[...Array(settings?.reducedParticles ? (isBigWin ? 6 : 4) : (isBigWin ? 12 : 8))].map((_, i) => (
            <motion.div
              key={`coin-${i}`}
              className="absolute"
              style={{
                left: `${40 + i * 7}%`,
                bottom: '10%',
              }}
              initial={{ 
                y: 0,
                opacity: 0,
                scale: 0
              }}
              animate={{ 
                y: [isBigWin ? -140 : -100, isBigWin ? -160 : -120, isBigWin ? -140 : -100],
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                rotate: [0, 360]
              }}
              transition={{ 
                duration: isBigWin ? 2.4 : 2,
                delay: i * (isBigWin ? 0.12 : 0.1),
                ease: "easeOut"
              }}
            >
              <Coins className="w-6 h-6 text-poker-chipGold" />
            </motion.div>
          ))}

          {/* Golden glow pulse */}
          <motion.div
            className="absolute inset-0 bg-poker-chipGold/10"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 0.3, 0],
              scale: [0.8, 1.2, 1]
            }}
            transition={{ 
              duration: 1,
              repeat: 2,
              ease: "easeInOut"
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
          {/* Slow-motion overlay for big wins */}
          {isBigWin && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.5, 0] }}
              transition={{ duration: 1.6, ease: 'easeInOut', delay: 0.4 }}
            >
              <div className="px-4 py-2 rounded-md bg-black/60 border border-yellow-400/60 text-poker-chipGold font-bold tracking-wide">
                SLOW-MO REPLAY
              </div>
            </motion.div>
          )}
