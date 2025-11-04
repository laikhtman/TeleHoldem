import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSound } from '@/hooks/useSound';
import { useReducedMotion } from '@/hooks/useReducedMotion';

// Physics constants
const GRAVITY = 9.8 * 100; // Scaled for pixels
const BOUNCE_DAMPING = 0.6;
const MIN_VELOCITY = 0.5;
const FRICTION = 0.98;
const CHIP_SIZE = 32; // Base chip diameter in pixels

// Chip denomination configuration
export interface ChipDenomination {
  value: number;
  color: string;
  borderColor: string;
  weight: number; // Affects physics behavior
  textColor: string;
  symbol?: string;
}

export const CHIP_DENOMINATIONS: ChipDenomination[] = [
  { value: 1, color: 'bg-white', borderColor: 'border-gray-400', weight: 1.0, textColor: 'text-gray-900' },
  { value: 5, color: 'bg-red-600', borderColor: 'border-red-800', weight: 1.1, textColor: 'text-white' },
  { value: 25, color: 'bg-green-600', borderColor: 'border-green-800', weight: 1.2, textColor: 'text-white' },
  { value: 100, color: 'bg-gray-900', borderColor: 'border-gray-700', weight: 1.3, textColor: 'text-white' },
  { value: 500, color: 'bg-purple-600', borderColor: 'border-purple-800', weight: 1.4, textColor: 'text-white', symbol: '★' },
  { value: 1000, color: 'bg-yellow-500', borderColor: 'border-yellow-700', weight: 1.5, textColor: 'text-gray-900', symbol: '♦' },
];

// Physics particle for chip animation
interface ChipParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  denomination: ChipDenomination;
  landed: boolean;
  bounceCount: number;
  targetX?: number;
  targetY?: number;
  stackIndex?: number;
  wobblePhase?: number;
}

interface ChipPhysicsProps {
  chips: ChipParticle[];
  onChipsUpdate: (chips: ChipParticle[]) => void;
  containerRef?: React.RefObject<HTMLDivElement>;
  enableCollisions?: boolean;
  enableStacking?: boolean;
}

export function ChipPhysics({ 
  chips, 
  onChipsUpdate, 
  containerRef,
  enableCollisions = true,
  enableStacking = true 
}: ChipPhysicsProps) {
  const animationFrameRef = useRef<number>();
  const prefersReducedMotion = useReducedMotion();
  const { playSound } = useSound();
  const lastSoundTimeRef = useRef<number>(0);

  // Physics update loop
  const updatePhysics = useCallback(() => {
    const deltaTime = 1 / 60; // Assume 60fps
    const updatedChips = chips.map((chip, index) => {
      if (chip.landed && chip.bounceCount > 3) {
        // Add subtle wobble to landed chips
        const wobbleAmount = Math.sin((chip.wobblePhase || 0) + Date.now() * 0.001) * 0.5;
        return {
          ...chip,
          rotation: chip.rotation + wobbleAmount,
          wobblePhase: (chip.wobblePhase || 0) + 0.1
        };
      }

      let newChip = { ...chip };

      // Apply gravity
      if (!chip.landed) {
        newChip.vy += (GRAVITY * chip.denomination.weight * deltaTime);
        
        // Apply friction
        newChip.vx *= FRICTION;
        newChip.vy *= FRICTION;
        
        // Update position
        newChip.x += newChip.vx * deltaTime;
        newChip.y += newChip.vy * deltaTime;
        
        // Update rotation
        newChip.rotation += newChip.rotationSpeed * deltaTime;
      }

      // Check for container bounds
      if (containerRef?.current) {
        const bounds = containerRef.current.getBoundingClientRect();
        
        // Floor collision
        if (newChip.y + CHIP_SIZE / 2 >= bounds.height) {
          newChip.y = bounds.height - CHIP_SIZE / 2;
          
          if (Math.abs(newChip.vy) > MIN_VELOCITY) {
            // Bounce
            newChip.vy = -newChip.vy * BOUNCE_DAMPING;
            newChip.bounceCount++;
            
            // Play sound on bounce (throttled)
            const now = Date.now();
            if (now - lastSoundTimeRef.current > 50) {
              playSound('chip-place', { volume: Math.min(0.3, Math.abs(newChip.vy) / 100) });
              lastSoundTimeRef.current = now;
            }
          } else {
            // Chip has landed
            newChip.vy = 0;
            newChip.vx *= 0.9; // Extra friction when on surface
            newChip.landed = true;
          }
        }
        
        // Side wall collisions
        if (newChip.x - CHIP_SIZE / 2 <= 0) {
          newChip.x = CHIP_SIZE / 2;
          newChip.vx = Math.abs(newChip.vx) * BOUNCE_DAMPING;
        } else if (newChip.x + CHIP_SIZE / 2 >= bounds.width) {
          newChip.x = bounds.width - CHIP_SIZE / 2;
          newChip.vx = -Math.abs(newChip.vx) * BOUNCE_DAMPING;
        }
      }

      // Check for collision with other chips
      if (enableCollisions) {
        chips.forEach((otherChip, otherIndex) => {
          if (index !== otherIndex) {
            const dx = newChip.x - otherChip.x;
            const dy = newChip.y - otherChip.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = CHIP_SIZE;

            if (distance < minDistance && distance > 0) {
              // Collision detected
              const overlap = minDistance - distance;
              const separationX = (dx / distance) * overlap * 0.5;
              const separationY = (dy / distance) * overlap * 0.5;

              newChip.x += separationX;
              newChip.y += separationY;

              // Transfer momentum
              const relativeVx = newChip.vx - otherChip.vx;
              const relativeVy = newChip.vy - otherChip.vy;
              const impulse = 0.5;

              newChip.vx -= relativeVx * impulse;
              newChip.vy -= relativeVy * impulse;
            }
          }
        });
      }

      // Auto-stacking behavior
      if (enableStacking && chip.targetX !== undefined && chip.targetY !== undefined) {
        const dx = chip.targetX - newChip.x;
        const dy = chip.targetY - newChip.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 5) {
          // Snap to target position
          newChip.x = chip.targetX;
          newChip.y = chip.targetY;
          newChip.vx = 0;
          newChip.vy = 0;
          newChip.landed = true;
        } else {
          // Move towards target
          const attraction = 0.1;
          newChip.vx += (dx / distance) * attraction;
          newChip.vy += (dy / distance) * attraction;
        }
      }

      return newChip;
    });

    onChipsUpdate(updatedChips);
  }, [chips, onChipsUpdate, containerRef, enableCollisions, enableStacking, playSound]);

  // Animation loop
  useEffect(() => {
    if (prefersReducedMotion || chips.length === 0) return;

    const animate = () => {
      updatePhysics();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [updatePhysics, prefersReducedMotion, chips.length]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      <AnimatePresence>
        {chips.map((chip) => (
          <ChipElement key={chip.id} chip={chip} />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ChipElementProps {
  chip: ChipParticle;
}

function ChipElement({ chip }: ChipElementProps) {
  const prefersReducedMotion = useReducedMotion();
  
  // Calculate shadow based on height
  const shadowSize = Math.max(0, (200 - chip.y) / 10);
  const shadowOpacity = Math.max(0, Math.min(0.3, shadowSize / 20));

  return (
    <motion.div
      className={cn(
        'absolute flex items-center justify-center rounded-full border-2',
        chip.denomination.color,
        chip.denomination.borderColor,
        'chip-shine'
      )}
      style={{
        left: chip.x - CHIP_SIZE / 2,
        top: chip.y - CHIP_SIZE / 2,
        width: CHIP_SIZE,
        height: CHIP_SIZE,
        transform: `rotate(${chip.rotation}deg) scale(${chip.landed ? 0.95 : 1})`,
        boxShadow: `0 ${shadowSize}px ${shadowSize * 2}px rgba(0,0,0,${shadowOpacity})`,
        zIndex: Math.floor(1000 - chip.y), // Higher chips render on top
      }}
      transition={prefersReducedMotion ? { duration: 0.01 } : undefined}
    >
      <span className={cn('text-xs font-bold', chip.denomination.textColor)}>
        {chip.denomination.symbol || chip.denomination.value}
      </span>
    </motion.div>
  );
}

// Helper function to create chip particles from an amount
export function createChipParticles(
  amount: number,
  startX: number,
  startY: number,
  targetX?: number,
  targetY?: number,
  options?: {
    spread?: number;
    velocityRange?: number;
    avalanche?: boolean;
  }
): ChipParticle[] {
  const chips: ChipParticle[] = [];
  let remainingAmount = amount;
  
  // Sort denominations in descending order
  const sortedDenominations = [...CHIP_DENOMINATIONS].sort((a, b) => b.value - a.value);
  
  for (const denom of sortedDenominations) {
    const chipCount = Math.floor(remainingAmount / denom.value);
    const maxChipsPerDenom = options?.avalanche ? 20 : 5; // Limit chips per denomination
    const actualChipCount = Math.min(chipCount, maxChipsPerDenom);
    
    for (let i = 0; i < actualChipCount; i++) {
      const spread = options?.spread || 50;
      const velocityRange = options?.velocityRange || 200;
      
      chips.push({
        id: `chip-${Date.now()}-${Math.random()}`,
        x: startX + (Math.random() - 0.5) * spread,
        y: startY,
        vx: (Math.random() - 0.5) * velocityRange,
        vy: options?.avalanche ? -(Math.random() * 300 + 200) : -(Math.random() * 100 + 50),
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 720,
        denomination: denom,
        landed: false,
        bounceCount: 0,
        targetX: targetX ? targetX + (Math.random() - 0.5) * 20 : undefined,
        targetY: targetY ? targetY - i * 3 : undefined, // Stack chips vertically
        stackIndex: i,
      });
      
      remainingAmount -= denom.value;
      if (remainingAmount <= 0) break;
    }
    
    if (remainingAmount <= 0) break;
  }
  
  return chips;
}

// Component for betting action choreography
interface BettingAnimationProps {
  playerPosition: { x: number; y: number };
  betPosition: { x: number; y: number };
  amount: number;
  onComplete?: () => void;
  isAllIn?: boolean;
}

export function BettingAnimation({ 
  playerPosition, 
  betPosition, 
  amount, 
  onComplete,
  isAllIn = false 
}: BettingAnimationProps) {
  const [chips, setChips] = useState<ChipParticle[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const { playSound } = useSound();

  useEffect(() => {
    // Create chips for betting animation
    const particles = createChipParticles(
      amount,
      playerPosition.x,
      playerPosition.y,
      betPosition.x,
      betPosition.y,
      {
        spread: isAllIn ? 100 : 30,
        velocityRange: isAllIn ? 400 : 200,
        avalanche: isAllIn
      }
    );
    
    setChips(particles);
    
    if (isAllIn) {
      playSound('all-in', { volume: 0.5 });
    }
    
    // Cleanup after animation
    const timer = setTimeout(() => {
      setChips([]);
      onComplete?.();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [playerPosition, betPosition, amount, isAllIn, onComplete, playSound]);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none">
      <ChipPhysics 
        chips={chips} 
        onChipsUpdate={setChips}
        containerRef={containerRef}
        enableStacking={true}
      />
    </div>
  );
}

// Enhanced chip particle with Bezier curve support
interface EnhancedChipParticle extends ChipParticle {
  bezier?: {
    p0x: number; p0y: number;
    p1x: number; p1y: number;
    p2x: number; p2y: number;
    p3x: number; p3y: number;
  };
  bezierT?: number;
  speed?: number;
  delay?: number;
  glowIntensity?: number;
}

// Bezier curve calculation for smooth chip trajectories
function getBezierPoint(t: number, p0: number, p1: number, p2: number, p3: number): number {
  const oneMinusT = 1 - t;
  return Math.pow(oneMinusT, 3) * p0 +
         3 * Math.pow(oneMinusT, 2) * t * p1 +
         3 * oneMinusT * Math.pow(t, 2) * p2 +
         Math.pow(t, 3) * p3;
}

// Enhanced pot collection animation with special effects
interface PotCollectionAnimationProps {
  potPosition: { x: number; y: number };
  winnerPosition: { x: number; y: number };
  amount: number;
  onComplete?: () => void;
  isSplitPot?: boolean;
  splitCount?: number;
  winType?: string; // For special effects based on hand type
}

export function PotCollectionAnimation({
  potPosition,
  winnerPosition,
  amount,
  onComplete,
  isSplitPot = false,
  splitCount = 1,
  winType = 'regular'
}: PotCollectionAnimationProps) {
  const [chips, setChips] = useState<EnhancedChipParticle[]>([]);
  const [particles, setParticles] = useState<any[]>([]);
  const [screenShake, setScreenShake] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { playSound } = useSound();
  const animationFrameRef = useRef<number>();
  const prefersReducedMotion = useReducedMotion();

  // Create enhanced chips with Bezier curves and denomination grouping
  const createEnhancedChips = useCallback((amount: number): EnhancedChipParticle[] => {
    const denominations = [1000, 500, 100, 25, 5, 1];
    const chipGroups: { [key: number]: EnhancedChipParticle[] } = {};
    let remaining = amount;
    
    // Group chips by denomination
    denominations.forEach(denomValue => {
      const count = Math.floor(remaining / denomValue);
      if (count > 0) {
        chipGroups[denomValue] = [];
        const denomination = CHIP_DENOMINATIONS.find(d => d.value === denomValue)!;
        
        for (let i = 0; i < Math.min(count, 5); i++) {
          const id = `chip-${denomValue}-${i}-${Date.now()}`;
          
          // Create dramatic Bezier control points
          const midX = (potPosition.x + winnerPosition.x) / 2;
          const midY = Math.min(potPosition.y, winnerPosition.y) - 150 - Math.random() * 100;
          const controlPoint1X = potPosition.x + (midX - potPosition.x) * 0.7 + (Math.random() - 0.5) * 100;
          const controlPoint1Y = potPosition.y - 100 - Math.random() * 50;
          const controlPoint2X = winnerPosition.x + (midX - winnerPosition.x) * 0.3 + (Math.random() - 0.5) * 50;
          const controlPoint2Y = winnerPosition.y - 50 - Math.random() * 30;
          
          // Target position with stacking
          const stackOffset = i * 3;
          const targetX = winnerPosition.x + (Math.random() - 0.5) * 20;
          const targetY = winnerPosition.y - stackOffset;
          
          const chip: EnhancedChipParticle = {
            id,
            x: potPosition.x,
            y: potPosition.y,
            vx: 0,
            vy: 0,
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 30,
            denomination,
            landed: false,
            bounceCount: 0,
            targetX,
            targetY,
            stackIndex: i,
            wobblePhase: Math.random() * Math.PI * 2,
            bezier: {
              p0x: potPosition.x, p0y: potPosition.y,
              p1x: controlPoint1X, p1y: controlPoint1Y,
              p2x: controlPoint2X, p2y: controlPoint2Y,
              p3x: targetX, p3y: targetY
            },
            bezierT: 0,
            speed: 0.6 + Math.random() * 0.3,
            delay: 0,
            glowIntensity: amount > 500 ? 1 : 0.5
          };
          
          chipGroups[denomValue].push(chip);
        }
        remaining -= count * denomValue;
      }
    });
    
    // Flatten and stagger chips
    const allChips: EnhancedChipParticle[] = [];
    let delay = 0;
    Object.entries(chipGroups).forEach(([_, group]) => {
      group.forEach((chip, idx) => {
        chip.delay = delay + idx * 40;
        allChips.push(chip);
      });
      delay += 80;
    });
    
    return allChips;
  }, [potPosition, winnerPosition]);

  // Create special effect particles based on win type
  const createSpecialEffects = useCallback(() => {
    const effects: any[] = [];
    
    switch(winType) {
      case 'Royal Flush':
        // Rainbow trail particles
        for (let i = 0; i < 30; i++) {
          effects.push({
            type: 'rainbow',
            x: potPosition.x,
            y: potPosition.y,
            targetX: winnerPosition.x,
            targetY: winnerPosition.y,
            color: `hsl(${i * 12}, 100%, 50%)`,
            delay: i * 30
          });
        }
        break;
      
      case 'Straight Flush':
        // Lightning bolt effect
        effects.push({
          type: 'lightning',
          fromX: potPosition.x,
          fromY: potPosition.y,
          toX: winnerPosition.x,
          toY: winnerPosition.y
        });
        break;
      
      case 'Four of a Kind':
        // Explosion then magnetic collection
        for (let i = 0; i < 20; i++) {
          const angle = (Math.PI * 2 * i) / 20;
          effects.push({
            type: 'explosion',
            x: potPosition.x,
            y: potPosition.y,
            vx: Math.cos(angle) * 200,
            vy: Math.sin(angle) * 200,
            targetX: winnerPosition.x,
            targetY: winnerPosition.y,
            delay: 0
          });
        }
        break;
      
      case 'Full House':
        // House shape formation
        effects.push({
          type: 'house',
          x: (potPosition.x + winnerPosition.x) / 2,
          y: (potPosition.y + winnerPosition.y) / 2
        });
        break;
      
      default:
        // Golden particles for big wins
        if (amount > 1000) {
          // Firework burst
          for (let i = 0; i < 40; i++) {
            const angle = (Math.PI * 2 * i) / 40;
            const distance = 150 + Math.random() * 100;
            effects.push({
              type: 'firework',
              x: winnerPosition.x,
              y: winnerPosition.y,
              targetX: winnerPosition.x + Math.cos(angle) * distance,
              targetY: winnerPosition.y + Math.sin(angle) * distance,
              color: '#FFD700',
              size: Math.random() * 8 + 4
            });
          }
        } else if (amount > 500) {
          // Golden sparkles
          for (let i = 0; i < 15; i++) {
            effects.push({
              type: 'sparkle',
              x: winnerPosition.x + (Math.random() - 0.5) * 100,
              y: winnerPosition.y + (Math.random() - 0.5) * 100,
              delay: i * 60
            });
          }
        }
    }
    
    return effects;
  }, [potPosition, winnerPosition, winType, amount]);

  useEffect(() => {
    if (prefersReducedMotion) {
      // Simple immediate chip transfer for reduced motion
      onComplete?.();
      return;
    }

    // Play appropriate sounds
    const isBigPot = amount > 500;
    const isMegaPot = amount > 1000;
    
    if (isMegaPot) {
      playSound('chip-collect', { volume: 0.5 });
      setScreenShake(true);
      setTimeout(() => setScreenShake(false), 600);
    } else if (isBigPot) {
      playSound('chip-collect', { volume: 0.4 });
    } else {
      playSound('chip-place', { volume: 0.3 });
    }
    
    // Create enhanced chips and special effects
    const enhancedChips = createEnhancedChips(amount);
    const specialEffects = createSpecialEffects();
    setParticles(specialEffects);
    
    // Animate chips along Bezier curves with staggered timing
    let startTime = Date.now();
    let activeChips: EnhancedChipParticle[] = [];
    
    const animateChips = () => {
      const elapsed = Date.now() - startTime;
      
      // Add chips based on delay
      enhancedChips.forEach(chip => {
        if (elapsed >= chip.delay! && !activeChips.find(c => c.id === chip.id)) {
          activeChips.push(chip);
          // Play clink sound for each chip
          if (chip.stackIndex === 0) {
            playSound('chip-place', { volume: 0.1 });
          }
        }
      });
      
      // Update chip positions along Bezier curves
      activeChips = activeChips.map(chip => {
        if (chip.bezierT! < 1) {
          chip.bezierT! += chip.speed! / 60;
          const t = Math.min(chip.bezierT!, 1);
          
          // Easing function for smooth deceleration
          const easedT = t < 0.5
            ? 2 * t * t
            : -1 + (4 - 2 * t) * t;
          
          // Calculate position
          chip.x = getBezierPoint(easedT, chip.bezier!.p0x, chip.bezier!.p1x, chip.bezier!.p2x, chip.bezier!.p3x);
          chip.y = getBezierPoint(easedT, chip.bezier!.p0y, chip.bezier!.p1y, chip.bezier!.p2y, chip.bezier!.p3y);
          chip.rotation += chip.rotationSpeed;
          
          // Landing effect
          if (t >= 0.95) {
            chip.landed = true;
            if (t === 1 && chip.stackIndex === 0) {
              playSound('chip-stack', { volume: 0.15 });
            }
          }
        }
        
        return chip;
      });
      
      setChips([...activeChips]);
      
      // Continue animation
      if (elapsed < 3000) {
        animationFrameRef.current = requestAnimationFrame(animateChips);
      } else {
        // Cleanup
        setTimeout(() => {
          setChips([]);
          setParticles([]);
          onComplete?.();
        }, 500);
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(animateChips);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [amount, createEnhancedChips, createSpecialEffects, onComplete, playSound, prefersReducedMotion]);

  return (
    <div 
      ref={containerRef} 
      className={cn(
        "absolute inset-0 pointer-events-none",
        screenShake && "animate-screen-shake"
      )}
    >
      {/* Enhanced chip physics animation */}
      <ChipPhysics 
        chips={chips} 
        onChipsUpdate={setChips}
        containerRef={containerRef}
        enableCollisions={true}
        enableStacking={true}
      />
      
      {/* Special effect particles */}
      <AnimatePresence>
        {particles.map((particle, idx) => (
          <motion.div key={`particle-${idx}`} className="absolute">
            {particle.type === 'rainbow' && (
              <motion.div
                className="w-3 h-3 rounded-full chip-rainbow-trail"
                style={{
                  left: particle.x,
                  top: particle.y,
                  backgroundColor: particle.color,
                  boxShadow: `0 0 20px ${particle.color}`
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                  x: particle.targetX - particle.x,
                  y: particle.targetY - particle.y
                }}
                transition={{ 
                  duration: 1.5,
                  delay: particle.delay / 1000
                }}
              />
            )}
            
            {particle.type === 'lightning' && (
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ zIndex: 100 }}
              >
                <motion.path
                  d={`M ${particle.fromX} ${particle.fromY} L ${particle.toX} ${particle.toY}`}
                  stroke="#00FFFF"
                  strokeWidth="4"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 0.6 }}
                  filter="url(#lightning-glow)"
                />
                <defs>
                  <filter id="lightning-glow">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
              </svg>
            )}
            
            {particle.type === 'sparkle' && (
              <motion.div
                className="text-2xl"
                style={{
                  left: particle.x,
                  top: particle.y,
                  textShadow: '0 0 10px #FFD700'
                }}
                initial={{ opacity: 0, scale: 0, rotate: 0 }}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0, 1.2, 0],
                  rotate: 360
                }}
                transition={{ 
                  duration: 1,
                  delay: particle.delay / 1000
                }}
              >
                ✨
              </motion.div>
            )}
            
            {particle.type === 'firework' && (
              <motion.div
                className="rounded-full chip-firework"
                style={{
                  left: particle.x,
                  top: particle.y,
                  width: particle.size,
                  height: particle.size,
                  backgroundColor: particle.color,
                  boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`
                }}
                initial={{ opacity: 1, scale: 0 }}
                animate={{ 
                  x: particle.targetX - particle.x,
                  y: particle.targetY - particle.y,
                  opacity: [1, 1, 0],
                  scale: [0, 1.5, 0]
                }}
                transition={{ 
                  duration: 1.8,
                  ease: "easeOut"
                }}
              />
            )}
            
            {particle.type === 'explosion' && (
              <motion.div
                className="w-4 h-4 rounded-full bg-orange-500"
                style={{
                  left: particle.x,
                  top: particle.y,
                  boxShadow: '0 0 15px orange'
                }}
                initial={{ opacity: 1, scale: 1 }}
                animate={{ 
                  x: [0, particle.vx * 0.5, particle.targetX - particle.x],
                  y: [0, particle.vy * 0.5, particle.targetY - particle.y],
                  opacity: [1, 1, 0],
                  scale: [1, 1.5, 0]
                }}
                transition={{ 
                  duration: 1.2,
                  delay: particle.delay / 1000,
                  times: [0, 0.3, 1]
                }}
              />
            )}
            
            {particle.type === 'house' && (
              <motion.div
                className="flex flex-col items-center"
                style={{
                  left: particle.x - 30,
                  top: particle.y - 30
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 1, 0], scale: [0, 1, 1, 0] }}
                transition={{ duration: 2 }}
              >
                <div className="w-0 h-0 border-l-[30px] border-l-transparent border-r-[30px] border-r-transparent border-b-[30px] border-b-poker-chipGold" />
                <div className="w-[60px] h-[40px] bg-poker-chipGold" />
              </motion.div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}