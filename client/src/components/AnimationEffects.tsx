import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useEffect, useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Trophy, Crown, Sparkles, Zap, Star } from 'lucide-react';

// ========================================
// Particle System for Background Effects
// ========================================
interface FloatingParticle {
  id: string;
  x: number;
  y: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
}

export function FloatingParticles({ count = 30, className = '' }: { count?: number; className?: string }) {
  const [particles, setParticles] = useState<FloatingParticle[]>([]);
  const prefersReducedMotion = useReducedMotion();
  
  useEffect(() => {
    if (prefersReducedMotion) return;
    
    const newParticles = Array.from({ length: count }, (_, i) => ({
      id: `particle-${i}`,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      color: ['#8B5CF6', '#EC4899', '#06B6D4', '#FBBF24'][Math.floor(Math.random() * 4)],
      duration: 20 + Math.random() * 20,
      delay: Math.random() * 10
    }));
    setParticles(newParticles);
  }, [count, prefersReducedMotion]);
  
  if (prefersReducedMotion) return null;
  
  return (
    <div className={cn("fixed inset-0 pointer-events-none overflow-hidden z-0", className)}>
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full blur-sm"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            boxShadow: `0 0 ${particle.size * 3}px ${particle.color}`
          }}
          animate={{
            x: [0, 50, -50, 0],
            y: [0, -100, 50, 0],
            opacity: [0, 1, 0.5, 0],
            scale: [1, 1.5, 1, 0.8]
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
}

// ========================================
// Aurora Background Effect
// ========================================
export function AuroraBackground({ className = '' }: { className?: string }) {
  const prefersReducedMotion = useReducedMotion();
  
  if (prefersReducedMotion) return null;
  
  return (
    <div className={cn("fixed inset-0 pointer-events-none overflow-hidden z-0", className)}>
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(ellipse at 25% 50%, #8B5CF6 0%, transparent 50%), radial-gradient(ellipse at 75% 50%, #EC4899 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, #06B6D4 0%, transparent 50%)'
        }}
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
          x: [-100, 100, -100],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      <motion.div
        className="absolute inset-0 opacity-20"
        style={{
          background: 'conic-gradient(from 0deg, #8B5CF6, #EC4899, #06B6D4, #FBBF24, #8B5CF6)'
        }}
        animate={{
          rotate: [0, -360],
          scale: [1.5, 1, 1.5],
        }}
        transition={{
          duration: 40,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </div>
  );
}

// ========================================
// Grid Pattern with Glow Nodes
// ========================================
export function GridBackground({ className = '' }: { className?: string }) {
  const prefersReducedMotion = useReducedMotion();
  const [glowNodes, setGlowNodes] = useState<{ x: number; y: number; id: string }[]>([]);
  
  useEffect(() => {
    if (prefersReducedMotion) return;
    
    const timer = setInterval(() => {
      const newNodes = Array.from({ length: 3 }, (_, i) => ({
        id: `node-${Date.now()}-${i}`,
        x: Math.random() * 100,
        y: Math.random() * 100
      }));
      setGlowNodes(prev => [...prev.slice(-10), ...newNodes]);
    }, 2000);
    
    return () => clearInterval(timer);
  }, [prefersReducedMotion]);
  
  return (
    <div className={cn("fixed inset-0 pointer-events-none z-0", className)}>
      <svg className="w-full h-full opacity-10">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-purple-600" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      
      {!prefersReducedMotion && (
        <AnimatePresence>
          {glowNodes.map(node => (
            <motion.div
              key={node.id}
              className="absolute w-2 h-2 rounded-full bg-purple-500"
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                boxShadow: '0 0 20px #8B5CF6'
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 2, 0],
                opacity: [0, 1, 0]
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 3 }}
            />
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}

// ========================================
// Ripple Effect for Buttons
// ========================================
interface RippleProps {
  x: number;
  y: number;
  color?: string;
}

export function Ripple({ x, y, color = '#8B5CF6' }: RippleProps) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        left: x - 10,
        top: y - 10,
        backgroundColor: color,
        width: 20,
        height: 20,
      }}
      initial={{ scale: 0, opacity: 0.5 }}
      animate={{ scale: 10, opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    />
  );
}

export function useRipple() {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: string }[]>([]);
  
  const createRipple = (event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const id = Date.now().toString();
    
    setRipples(prev => [...prev, { x, y, id }]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, 600);
  };
  
  return { ripples, createRipple };
}

// ========================================
// Shimmer Effect for Loading States
// ========================================
export function ShimmerEffect({ className = '' }: { className?: string }) {
  const prefersReducedMotion = useReducedMotion();
  
  if (prefersReducedMotion) return null;
  
  return (
    <motion.div
      className={cn("absolute inset-0 -inset-x-4 pointer-events-none", className)}
      style={{
        background: 'linear-gradient(90deg, transparent 0%, rgba(139, 92, 246, 0.3) 50%, transparent 100%)',
      }}
      animate={{
        x: ['-100%', '200%']
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  );
}

// ========================================
// Glow Pulse Effect
// ========================================
export function GlowPulse({ 
  className = '',
  color = '#8B5CF6',
  size = 100,
  intensity = 0.5
}: { 
  className?: string;
  color?: string;
  size?: number;
  intensity?: number;
}) {
  const prefersReducedMotion = useReducedMotion();
  
  if (prefersReducedMotion) return null;
  
  return (
    <motion.div
      className={cn("absolute rounded-full pointer-events-none", className)}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color}${Math.round(intensity * 255).toString(16)} 0%, transparent 70%)`,
        filter: 'blur(20px)',
        left: '50%',
        top: '50%',
        marginLeft: -size / 2,
        marginTop: -size / 2,
      }}
      animate={{
        scale: [1, 1.5, 1],
        opacity: [intensity, intensity * 0.5, intensity]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  );
}

// ========================================
// Glowing Trail Effect for Chips
// ========================================
interface GlowingTrailProps {
  path: { x: number; y: number }[];
  color?: string;
  className?: string;
}

export function GlowingTrail({ path, color = '#8B5CF6', className = '' }: GlowingTrailProps) {
  const prefersReducedMotion = useReducedMotion();
  
  if (prefersReducedMotion || path.length < 2) return null;
  
  return (
    <svg className={cn("absolute inset-0 pointer-events-none", className)}>
      <defs>
        <linearGradient id="trail-gradient">
          <stop offset="0%" stopColor={color} stopOpacity="0" />
          <stop offset="50%" stopColor={color} stopOpacity="0.5" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <motion.path
        d={`M ${path[0].x} ${path[0].y} ${path.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')}`}
        stroke="url(#trail-gradient)"
        strokeWidth="4"
        fill="none"
        filter="url(#glow)"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </svg>
  );
}

// ========================================
// Explosive Particle Effect
// ========================================
interface ExplosionParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  shape: 'circle' | 'star' | 'diamond';
}

export function ExplosionEffect({ 
  x, 
  y, 
  particleCount = 50,
  colors = ['#8B5CF6', '#EC4899', '#06B6D4', '#FBBF24'],
  className = ''
}: {
  x: number;
  y: number;
  particleCount?: number;
  colors?: string[];
  className?: string;
}) {
  const [particles, setParticles] = useState<ExplosionParticle[]>([]);
  const prefersReducedMotion = useReducedMotion();
  
  useEffect(() => {
    if (prefersReducedMotion) return;
    
    const newParticles = Array.from({ length: particleCount }, (_, i) => {
      const angle = (Math.PI * 2 * i) / particleCount;
      const velocity = 100 + Math.random() * 200;
      return {
        id: `explosion-${Date.now()}-${i}`,
        x: 0,
        y: 0,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        shape: ['circle', 'star', 'diamond'][Math.floor(Math.random() * 3)] as 'circle' | 'star' | 'diamond'
      };
    });
    setParticles(newParticles);
    
    const timer = setTimeout(() => {
      setParticles([]);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [x, y, particleCount, colors, prefersReducedMotion]);
  
  if (prefersReducedMotion) return null;
  
  const getShape = (shape: string, size: number) => {
    switch (shape) {
      case 'star':
        return <Star size={size} fill="currentColor" />;
      case 'diamond':
        return (
          <div 
            style={{ 
              width: size, 
              height: size, 
              transform: 'rotate(45deg)',
              backgroundColor: 'currentColor'
            }} 
          />
        );
      default:
        return (
          <div 
            className="rounded-full" 
            style={{ 
              width: size, 
              height: size,
              backgroundColor: 'currentColor'
            }} 
          />
        );
    }
  };
  
  return (
    <div 
      className={cn("absolute pointer-events-none", className)}
      style={{ left: x, top: y }}
    >
      <AnimatePresence>
        {particles.map(particle => (
          <motion.div
            key={particle.id}
            className="absolute"
            style={{ color: particle.color }}
            initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            animate={{
              x: particle.vx,
              y: particle.vy,
              scale: 0,
              opacity: 0
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          >
            {getShape(particle.shape, particle.size)}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ========================================
// Trophy Animation for Winners
// ========================================
export function TrophyAnimation({ 
  show, 
  className = '' 
}: { 
  show: boolean; 
  className?: string 
}) {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={cn("absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none", className)}
          initial={{ scale: 0, rotate: -180, opacity: 0 }}
          animate={{ 
            scale: [0, 1.5, 1],
            rotate: [0, 10, -10, 0],
            opacity: 1
          }}
          exit={{ scale: 0, opacity: 0 }}
          transition={prefersReducedMotion ? { duration: 0.01 } : { 
            duration: 0.8,
            ease: "easeOut"
          }}
        >
          <motion.div
            animate={prefersReducedMotion ? {} : {
              rotate: [0, 5, -5, 0],
              y: [0, -10, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Trophy className="w-24 h-24 text-yellow-500 drop-shadow-2xl" />
            <motion.div
              className="absolute inset-0"
              animate={prefersReducedMotion ? {} : {
                scale: [1, 1.2, 1],
                opacity: [0.5, 0, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Trophy className="w-24 h-24 text-yellow-500 blur-lg opacity-50" />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ========================================
// Screen Shake Effect
// ========================================
export function useScreenShake() {
  const [isShaking, setIsShaking] = useState(false);
  
  const shake = useCallback((duration = 600) => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), duration);
  }, []);
  
  return { isShaking, shake };
}

// ========================================
// Magnetic Button Effect
// ========================================
export function useMagneticEffect(ref: React.RefObject<HTMLElement>, strength = 0.3) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distanceX = e.clientX - centerX;
      const distanceY = e.clientY - centerY;
      const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
      
      if (distance < 100) {
        const pullX = (distanceX / distance) * strength * (1 - distance / 100);
        const pullY = (distanceY / distance) * strength * (1 - distance / 100);
        element.style.transform = `translate(${pullX * 10}px, ${pullY * 10}px) scale(1.05)`;
      } else {
        element.style.transform = '';
      }
    };
    
    const handleMouseLeave = () => {
      element.style.transform = '';
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [ref, strength]);
}

// ========================================
// Typewriter Text Effect
// ========================================
export function TypewriterText({ 
  text, 
  speed = 50,
  className = '',
  onComplete
}: {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}) {
  const [displayText, setDisplayText] = useState('');
  const prefersReducedMotion = useReducedMotion();
  
  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayText(text);
      onComplete?.();
      return;
    }
    
    let index = 0;
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
        onComplete?.();
      }
    }, speed);
    
    return () => clearInterval(timer);
  }, [text, speed, onComplete, prefersReducedMotion]);
  
  return (
    <span className={className}>
      {displayText}
      <motion.span
        className="inline-block w-0.5 h-5 bg-current ml-0.5"
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
      />
    </span>
  );
}

// ========================================
// Rainbow Gradient Animation
// ========================================
export function RainbowGradient({ 
  className = '',
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <motion.div
      className={cn("bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 bg-clip-text text-transparent", className)}
      animate={prefersReducedMotion ? {} : {
        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
      }}
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: "linear"
      }}
      style={{ backgroundSize: '200% 200%' }}
    >
      {children}
    </motion.div>
  );
}

// ========================================
// Smooth Counter Animation
// ========================================
export function AnimatedCounter({
  value,
  duration = 1000,
  className = '',
  prefix = '',
  suffix = ''
}: {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  
  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }
    
    const startTime = Date.now();
    const startValue = displayValue;
    const diff = value - startValue;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress * (2 - progress); // ease-out
      
      setDisplayValue(Math.floor(startValue + diff * eased));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value, duration, prefersReducedMotion]);
  
  return (
    <span className={className}>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  );
}

// ========================================
// Phase Transition Effect
// ========================================
export function PhaseTransition({
  phase,
  children
}: {
  phase: string;
  children: React.ReactNode;
}) {
  const [currentPhase, setCurrentPhase] = useState(phase);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  
  useEffect(() => {
    if (phase !== currentPhase) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setCurrentPhase(phase);
        setIsTransitioning(false);
      }, prefersReducedMotion ? 0 : 500);
      
      return () => clearTimeout(timer);
    }
  }, [phase, currentPhase, prefersReducedMotion]);
  
  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {isTransitioning && !prefersReducedMotion && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 z-50"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            exit={{ scaleX: 0, transition: { delay: 0.3 } }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ originX: 0 }}
          />
        )}
      </AnimatePresence>
      
      <motion.div
        key={currentPhase}
        initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={prefersReducedMotion ? {} : { opacity: 0, scale: 1.1 }}
        transition={{ duration: prefersReducedMotion ? 0.01 : 0.5 }}
      >
        {children}
      </motion.div>
    </div>
  );
}