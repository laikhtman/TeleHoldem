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

// Component for pot collection animation
interface PotCollectionAnimationProps {
  potPosition: { x: number; y: number };
  winnerPosition: { x: number; y: number };
  amount: number;
  onComplete?: () => void;
  isSplitPot?: boolean;
  splitCount?: number;
}

export function PotCollectionAnimation({
  potPosition,
  winnerPosition,
  amount,
  onComplete,
  isSplitPot = false,
  splitCount = 1
}: PotCollectionAnimationProps) {
  const [chips, setChips] = useState<ChipParticle[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const { playSound } = useSound();

  useEffect(() => {
    playSound('win-pot', { volume: 0.4 });
    
    // Create cascading chip rain effect for big pots
    const isBigPot = amount > 500;
    const particles: ChipParticle[] = [];
    
    if (isSplitPot && splitCount > 1) {
      // Split pot animation
      const amountPerWinner = Math.floor(amount / splitCount);
      const angleStep = (Math.PI * 2) / splitCount;
      
      for (let i = 0; i < splitCount; i++) {
        const angle = angleStep * i;
        const targetX = winnerPosition.x + Math.cos(angle) * 150;
        const targetY = winnerPosition.y + Math.sin(angle) * 150;
        
        particles.push(...createChipParticles(
          amountPerWinner,
          potPosition.x,
          potPosition.y,
          targetX,
          targetY,
          {
            spread: 40,
            velocityRange: 250
          }
        ));
      }
    } else {
      // Single winner animation
      particles.push(...createChipParticles(
        amount,
        potPosition.x,
        potPosition.y,
        winnerPosition.x,
        winnerPosition.y,
        {
          spread: isBigPot ? 80 : 50,
          velocityRange: isBigPot ? 350 : 250,
          avalanche: isBigPot
        }
      ));
    }
    
    // Stagger chip creation for rain effect
    particles.forEach((chip, index) => {
      setTimeout(() => {
        setChips(prev => [...prev, chip]);
      }, index * 30);
    });
    
    // Cleanup after animation
    const timer = setTimeout(() => {
      setChips([]);
      onComplete?.();
    }, 4000);
    
    return () => clearTimeout(timer);
  }, [potPosition, winnerPosition, amount, isSplitPot, splitCount, onComplete, playSound]);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none">
      <ChipPhysics 
        chips={chips} 
        onChipsUpdate={setChips}
        containerRef={containerRef}
        enableCollisions={true}
        enableStacking={true}
      />
    </div>
  );
}