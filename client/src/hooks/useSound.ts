import { useCallback, useEffect } from 'react';

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

// Singleton AudioContext - shared across all components
let audioContextInstance: AudioContext | null = null;

// Load muted state from localStorage
let isMuted = typeof window !== 'undefined' ? localStorage.getItem('soundMuted') === 'true' : false;

function getAudioContext(): AudioContext {
  if (!audioContextInstance) {
    audioContextInstance = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContextInstance;
}

function createOscillator(
  ctx: AudioContext,
  frequency: number,
  type: OscillatorType,
  duration: number,
  volume: number
) {
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
}

function playCardDeal(options: SoundOptions = {}) {
  if (isMuted) return;
  
  const { volume = 0.15 } = options;
  const ctx = getAudioContext();
  
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
}

function playCardFlip(options: SoundOptions = {}) {
  if (isMuted) return;
  
  const { volume = 0.15 } = options;
  const ctx = getAudioContext();
  
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
}

function playCardShuffle(options: SoundOptions = {}) {
  if (isMuted) return;
  
  const { volume = 0.2 } = options;
  const ctx = getAudioContext();
  
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
}

function playChipPlace(options: SoundOptions = {}) {
  if (isMuted) return;
  
  const { volume = 0.25 } = options;
  const ctx = getAudioContext();
  
  // Ceramic chip click - two quick tones
  createOscillator(ctx, 600, 'sine', 0.04, volume);
  setTimeout(() => {
    createOscillator(ctx, 550, 'sine', 0.04, volume * 0.7);
  }, 20);
}

function playChipCollect(options: SoundOptions = {}) {
  if (isMuted) return;
  
  const { volume = 0.25 } = options;
  const ctx = getAudioContext();
  
  // Multiple chips being gathered - cascading clicks
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      createOscillator(ctx, 550 - i * 30, 'sine', 0.03, volume * (1 - i * 0.15));
    }, i * 30);
  }
}

function playChipStack(options: SoundOptions = {}) {
  if (isMuted) return;
  
  const { volume = 0.2 } = options;
  const ctx = getAudioContext();
  
  // Chips being stacked - multiple quick clicks
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      createOscillator(ctx, 650, 'sine', 0.03, volume);
    }, i * 50);
  }
}

function playVictorySmall(options: SoundOptions = {}) {
  if (isMuted) return;
  
  const { volume = 0.3 } = options;
  const ctx = getAudioContext();
  
  // Simple upward arpeggio - C, E, G
  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
  notes.forEach((freq, i) => {
    setTimeout(() => {
      createOscillator(ctx, freq, 'sine', 0.3, volume);
    }, i * 100);
  });
}

function playVictoryBig(options: SoundOptions = {}) {
  if (isMuted) return;
  
  const { volume = 0.35 } = options;
  const ctx = getAudioContext();
  
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
}

function playButtonClick(options: SoundOptions = {}) {
  if (isMuted) return;
  
  const { volume = 0.15 } = options;
  const ctx = getAudioContext();
  
  // Soft click
  createOscillator(ctx, 300, 'sine', 0.05, volume);
}

function playFold(options: SoundOptions = {}) {
  if (isMuted) return;
  
  const { volume = 0.2 } = options;
  const ctx = getAudioContext();
  
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
}

function playRaise(options: SoundOptions = {}) {
  if (isMuted) return;
  
  const { volume = 0.25 } = options;
  const ctx = getAudioContext();
  
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
}

function playCheck(options: SoundOptions = {}) {
  if (isMuted) return;
  
  const { volume = 0.15 } = options;
  const ctx = getAudioContext();
  
  // Neutral tap sound
  createOscillator(ctx, 450, 'sine', 0.08, volume);
}

/**
 * Custom hook for playing synthesized sound effects in the poker game
 * Uses a shared singleton AudioContext to avoid browser limits
 */
export function useSound() {
  useEffect(() => {
    // Initialize AudioContext on first hook mount
    getAudioContext();
    
    // Note: We don't close the AudioContext on unmount because it's shared
    // across all components. The browser will clean it up when the page unloads.
  }, []);

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
  }, []);

  const toggleMute = useCallback(() => {
    isMuted = !isMuted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('soundMuted', String(isMuted));
    }
    return isMuted;
  }, []);

  const setMuted = useCallback((muted: boolean) => {
    isMuted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('soundMuted', String(muted));
    }
  }, []);

  return {
    playSound,
    toggleMute,
    setMuted,
    isMuted: () => isMuted,
  };
}
