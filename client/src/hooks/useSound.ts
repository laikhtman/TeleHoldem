import { useCallback, useRef, useEffect } from 'react';

interface SoundOptions {
  volume?: number;
  playbackRate?: number;
}

type SoundType = 
  | 'card-deal'
  | 'card-flip'
  | 'card-shuffle'
  | 'chip-place'
  | 'chip-collect'
  | 'chip-stack'
  | 'victory-small'
  | 'victory-big'
  | 'button-click'
  | 'fold'
  | 'raise'
  | 'check';

/**
 * Custom hook for playing synthesized sound effects in the poker game
 * Uses Web Audio API to generate sounds without requiring audio files
 */
export function useSound() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const isMutedRef = useRef(false);

  useEffect(() => {
    // Initialize AudioContext on first interaction
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    return () => {
      // Cleanup on unmount
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  const createOscillator = useCallback((
    ctx: AudioContext,
    frequency: number,
    type: OscillatorType,
    duration: number,
    volume: number
  ) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gainNode.gain.value = volume;

    const now = ctx.currentTime;
    gainNode.gain.setValueAtTime(volume, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

    oscillator.start(now);
    oscillator.stop(now + duration);

    return oscillator;
  }, []);

  const playCardDeal = useCallback((options: SoundOptions = {}) => {
    if (!audioContextRef.current || isMutedRef.current) return;
    
    const { volume = 0.15 } = options;
    const ctx = audioContextRef.current;
    
    // Quick snap sound - high frequency click
    createOscillator(ctx, 800, 'square', 0.05, volume);
    
    // Slight swish
    setTimeout(() => {
      const noise = ctx.createBufferSource();
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < buffer.length; i++) {
        data[i] = (Math.random() * 2 - 1) * volume * 0.3;
      }
      noise.buffer = buffer;
      
      const gainNode = ctx.createGain();
      gainNode.gain.value = volume * 0.3;
      noise.connect(gainNode);
      gainNode.connect(ctx.destination);
      noise.start();
    }, 10);
  }, [createOscillator]);

  const playCardFlip = useCallback((options: SoundOptions = {}) => {
    if (!audioContextRef.current || isMutedRef.current) return;
    
    const { volume = 0.15 } = options;
    const ctx = audioContextRef.current;
    
    // Rising pitch for flip
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'square';
    const now = ctx.currentTime;
    oscillator.frequency.setValueAtTime(400, now);
    oscillator.frequency.exponentialRampToValueAtTime(900, now + 0.1);
    
    gainNode.gain.setValueAtTime(volume, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    oscillator.start(now);
    oscillator.stop(now + 0.1);
  }, []);

  const playCardShuffle = useCallback((options: SoundOptions = {}) => {
    if (!audioContextRef.current || isMutedRef.current) return;
    
    const { volume = 0.2 } = options;
    const ctx = audioContextRef.current;
    
    // Create rustling/shuffling noise
    const noise = ctx.createBufferSource();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.8, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < buffer.length; i++) {
      data[i] = (Math.random() * 2 - 1) * volume * 0.5;
    }
    
    noise.buffer = buffer;
    
    const gainNode = ctx.createGain();
    const now = ctx.currentTime;
    gainNode.gain.setValueAtTime(volume * 0.5, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
    
    noise.connect(gainNode);
    gainNode.connect(ctx.destination);
    noise.start();
  }, []);

  const playChipPlace = useCallback((options: SoundOptions = {}) => {
    if (!audioContextRef.current || isMutedRef.current) return;
    
    const { volume = 0.25 } = options;
    const ctx = audioContextRef.current;
    
    // Ceramic chip click - two quick tones
    createOscillator(ctx, 600, 'sine', 0.04, volume);
    setTimeout(() => {
      createOscillator(ctx, 550, 'sine', 0.04, volume * 0.7);
    }, 20);
  }, [createOscillator]);

  const playChipCollect = useCallback((options: SoundOptions = {}) => {
    if (!audioContextRef.current || isMutedRef.current) return;
    
    const { volume = 0.25 } = options;
    const ctx = audioContextRef.current;
    
    // Multiple chips being gathered - cascading clicks
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        createOscillator(ctx, 550 - i * 30, 'sine', 0.03, volume * (1 - i * 0.15));
      }, i * 30);
    }
  }, [createOscillator]);

  const playChipStack = useCallback((options: SoundOptions = {}) => {
    if (!audioContextRef.current || isMutedRef.current) return;
    
    const { volume = 0.2 } = options;
    const ctx = audioContextRef.current;
    
    // Chips being stacked - multiple quick clicks
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        createOscillator(ctx, 650, 'sine', 0.03, volume);
      }, i * 50);
    }
  }, [createOscillator]);

  const playVictorySmall = useCallback((options: SoundOptions = {}) => {
    if (!audioContextRef.current || isMutedRef.current) return;
    
    const { volume = 0.3 } = options;
    const ctx = audioContextRef.current;
    
    // Simple upward arpeggio - C, E, G
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      setTimeout(() => {
        createOscillator(ctx, freq, 'sine', 0.3, volume);
      }, i * 100);
    });
  }, [createOscillator]);

  const playVictoryBig = useCallback((options: SoundOptions = {}) => {
    if (!audioContextRef.current || isMutedRef.current) return;
    
    const { volume = 0.35 } = options;
    const ctx = audioContextRef.current;
    
    // Triumphant fanfare - longer progression
    const notes = [
      { freq: 523.25, duration: 0.15 }, // C5
      { freq: 659.25, duration: 0.15 }, // E5
      { freq: 783.99, duration: 0.15 }, // G5
      { freq: 1046.50, duration: 0.4 }, // C6
    ];
    
    notes.forEach((note, i) => {
      setTimeout(() => {
        createOscillator(ctx, note.freq, 'sine', note.duration, volume);
      }, i * 120);
    });
    
    // Add harmonic richness
    setTimeout(() => {
      createOscillator(ctx, 1046.50 * 1.5, 'sine', 0.4, volume * 0.5);
    }, 360);
  }, [createOscillator]);

  const playButtonClick = useCallback((options: SoundOptions = {}) => {
    if (!audioContextRef.current || isMutedRef.current) return;
    
    const { volume = 0.15 } = options;
    const ctx = audioContextRef.current;
    
    // Soft click
    createOscillator(ctx, 300, 'sine', 0.05, volume);
  }, [createOscillator]);

  const playFold = useCallback((options: SoundOptions = {}) => {
    if (!audioContextRef.current || isMutedRef.current) return;
    
    const { volume = 0.2 } = options;
    const ctx = audioContextRef.current;
    
    // Descending tone for fold (sad sound)
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'sine';
    const now = ctx.currentTime;
    oscillator.frequency.setValueAtTime(500, now);
    oscillator.frequency.exponentialRampToValueAtTime(250, now + 0.2);
    
    gainNode.gain.setValueAtTime(volume, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    oscillator.start(now);
    oscillator.stop(now + 0.2);
  }, []);

  const playRaise = useCallback((options: SoundOptions = {}) => {
    if (!audioContextRef.current || isMutedRef.current) return;
    
    const { volume = 0.25 } = options;
    const ctx = audioContextRef.current;
    
    // Ascending confident tone
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'sine';
    const now = ctx.currentTime;
    oscillator.frequency.setValueAtTime(400, now);
    oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.15);
    
    gainNode.gain.setValueAtTime(volume, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    oscillator.start(now);
    oscillator.stop(now + 0.15);
  }, []);

  const playCheck = useCallback((options: SoundOptions = {}) => {
    if (!audioContextRef.current || isMutedRef.current) return;
    
    const { volume = 0.15 } = options;
    const ctx = audioContextRef.current;
    
    // Neutral tap sound
    createOscillator(ctx, 450, 'sine', 0.08, volume);
  }, [createOscillator]);

  const playSound = useCallback((type: SoundType, options: SoundOptions = {}) => {
    switch (type) {
      case 'card-deal':
        playCardDeal(options);
        break;
      case 'card-flip':
        playCardFlip(options);
        break;
      case 'card-shuffle':
        playCardShuffle(options);
        break;
      case 'chip-place':
        playChipPlace(options);
        break;
      case 'chip-collect':
        playChipCollect(options);
        break;
      case 'chip-stack':
        playChipStack(options);
        break;
      case 'victory-small':
        playVictorySmall(options);
        break;
      case 'victory-big':
        playVictoryBig(options);
        break;
      case 'button-click':
        playButtonClick(options);
        break;
      case 'fold':
        playFold(options);
        break;
      case 'raise':
        playRaise(options);
        break;
      case 'check':
        playCheck(options);
        break;
    }
  }, [
    playCardDeal,
    playCardFlip,
    playCardShuffle,
    playChipPlace,
    playChipCollect,
    playChipStack,
    playVictorySmall,
    playVictoryBig,
    playButtonClick,
    playFold,
    playRaise,
    playCheck,
  ]);

  const toggleMute = useCallback(() => {
    isMutedRef.current = !isMutedRef.current;
    return isMutedRef.current;
  }, []);

  const setMuted = useCallback((muted: boolean) => {
    isMutedRef.current = muted;
  }, []);

  return {
    playSound,
    toggleMute,
    setMuted,
    isMuted: () => isMutedRef.current,
  };
}
