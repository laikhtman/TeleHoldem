import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Settings, BarChart3, History, Users, Info } from 'lucide-react';
import { useSound } from '@/hooks/useSound';
import { useHaptic } from '@/hooks/useHaptic';
import { cn } from '@/lib/utils';

interface FloatingActionMenuProps {
  onStatsClick?: () => void;
  onHistoryClick?: () => void;
  onSettingsClick?: () => void;
  onTableInfoClick?: () => void;
  onPlayersClick?: () => void;
  className?: string;
}

export function FloatingActionMenu({
  onStatsClick,
  onHistoryClick,
  onSettingsClick,
  onTableInfoClick,
  onPlayersClick,
  className = ''
}: FloatingActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { playSound } = useSound();
  const { triggerHaptic } = useHaptic();

  const handleToggle = () => {
    setIsOpen(!isOpen);
    triggerHaptic('light');
    playSound('button-click', { volume: 0.2 });
  };

  const handleAction = (action: () => void | undefined) => {
    if (action) {
      action();
      setIsOpen(false);
      triggerHaptic('light');
      playSound('button-click', { volume: 0.2 });
    }
  };

  const menuItems = [
    { icon: BarChart3, label: 'Stats', onClick: onStatsClick, color: 'bg-gradient-to-br from-cyan-600 to-cyan-700' },
    { icon: History, label: 'History', onClick: onHistoryClick, color: 'bg-gradient-to-br from-purple-600 to-purple-700' },
    { icon: Users, label: 'Players', onClick: onPlayersClick, color: 'bg-gradient-to-br from-pink-600 to-pink-700' },
    { icon: Info, label: 'Table Info', onClick: onTableInfoClick, color: 'bg-gradient-to-br from-poker-chipGold to-amber-600' },
    { icon: Settings, label: 'Settings', onClick: onSettingsClick, color: 'bg-gradient-to-br from-gray-600 to-gray-700' },
  ].filter(item => item.onClick); // Only show items with handlers

  return (
    <div 
      className={cn(
        "fixed z-50", 
        className
      )}
      style={{
        bottom: `calc(max(env(safe-area-inset-bottom, 0px), var(--safe-area-bottom, 0px)) + 6rem)`,
        right: `calc(max(env(safe-area-inset-right, 0px), var(--safe-area-right, 0px)) + 1rem)`,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
    >
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu items */}
            <div className="absolute bottom-16 right-0 flex flex-col gap-3 items-end">
              {menuItems.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, scale: 0.3, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1, 
                    y: 0,
                    transition: {
                      delay: index * 0.05
                    }
                  }}
                  exit={{ 
                    opacity: 0, 
                    scale: 0.3, 
                    y: 20,
                    transition: {
                      delay: (menuItems.length - index - 1) * 0.05
                    }
                  }}
                  className="flex items-center gap-3"
                  data-testid={`fab-${item.label.toLowerCase()}`}
                >
                  {/* Label */}
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-lg text-sm font-medium whitespace-nowrap"
                  >
                    {item.label}
                  </motion.div>

                  {/* Button */}
                  <motion.button
                    onClick={() => item.onClick && handleAction(item.onClick)}
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center shadow-lg text-white min-h-[48px] min-w-[48px] touch-manipulation",
                      item.color
                    )}
                    style={{ touchAction: 'manipulation' }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label={item.label}
                  >
                    <item.icon className="w-5 h-5" />
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Main FAB button */}
      <motion.button
        onClick={handleToggle}
        className="w-14 h-14 min-h-[56px] rounded-full bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-purple-glow shadow-xl flex items-center justify-center relative overflow-hidden"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{ rotate: isOpen ? 45 : 0 }}
        aria-label="Open action menu"
        data-testid="fab-main"
      >
        {/* Ripple effect background - purple/pink gradient matching crypto theme */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600" />
        
        {/* Icon */}
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          className="relative z-10"
        >
          {isOpen ? (
            <X className="w-6 h-6" strokeWidth={3} />
          ) : (
            <Plus className="w-6 h-6" strokeWidth={3} />
          )}
        </motion.div>

        {/* Pulse animation when closed */}
        {!isOpen && (
          <motion.div
            className="absolute inset-0 rounded-full bg-poker-chipGold"
            animate={{
              scale: [1, 1.5, 1.5],
              opacity: [0.4, 0, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        )}
      </motion.button>

      {/* Hint text for first-time users */}
      {!isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-full mb-2 right-0 bg-background/90 backdrop-blur-sm px-2 py-1 rounded text-xs text-muted-foreground whitespace-nowrap md:hidden"
        >
          Tap for more options
        </motion.div>
      )}
    </div>
  );
}