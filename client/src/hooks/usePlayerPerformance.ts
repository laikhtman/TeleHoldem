import { useState, useEffect, useCallback, useMemo } from 'react';
import { GameState, PerformanceMetrics, DifficultyLevel, DifficultyMode } from '@shared/schema';

const RECENT_HANDS_WINDOW = 20; // Track last 20 hands as specified
const BANKROLL_HISTORY_SIZE = 30; // Track last 30 bankroll updates
const WIN_RATE_HIGH_THRESHOLD = 0.65; // > 65% win rate triggers difficulty increase
const WIN_RATE_LOW_THRESHOLD = 0.35; // < 35% win rate triggers difficulty decrease
const CONSECUTIVE_THRESHOLD = 3; // Trigger adjustment after 3+ consecutive wins/losses
const DIFFICULTY_ADJUSTMENT_COOLDOWN = 10000; // 10 second cooldown between adjustments

interface UsePlayerPerformanceProps {
  gameState: GameState | null;
  initialDifficulty?: DifficultyMode;
}

interface UsePlayerPerformanceReturn {
  performanceMetrics: PerformanceMetrics;
  difficultySettings: {
    mode: DifficultyMode;
    currentLevel: DifficultyLevel;
    multiplier: number;
  };
  updatePerformance: (won: boolean, potSize: number) => void;
  updateBankroll: (amount: number) => void;
  setDifficultyMode: (mode: DifficultyMode) => void;
  getRecommendedDifficulty: () => DifficultyLevel;
  shouldAdjustDifficulty: () => boolean;
}

export function usePlayerPerformance({ 
  gameState, 
  initialDifficulty = 'auto' 
}: UsePlayerPerformanceProps): UsePlayerPerformanceReturn {
  
  // Load saved difficulty from localStorage
  const savedDifficulty = localStorage.getItem('pokerDifficulty');
  const savedMode = (savedDifficulty ? JSON.parse(savedDifficulty).mode : initialDifficulty) as DifficultyMode;
  const savedLevel = (savedDifficulty ? JSON.parse(savedDifficulty).level : 'normal') as DifficultyLevel;

  const [difficultyMode, setDifficultyMode] = useState<DifficultyMode>(savedMode);
  const [currentDifficultyLevel, setCurrentDifficultyLevel] = useState<DifficultyLevel>(
    savedMode === 'auto' ? savedLevel : (savedMode as DifficultyLevel)
  );
  
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    recentHands: [],
    bankrollHistory: [],
    winRate: 0.5,
    bankrollTrend: 'stable',
    consecutiveWins: 0,
    consecutiveLosses: 0,
    averagePotWin: 0,
    lastDifficultyAdjustment: Date.now()
  });

  const [handsPlayedSinceAdjustment, setHandsPlayedSinceAdjustment] = useState(0);

  // Calculate difficulty multiplier based on level
  const getDifficultyMultiplier = useCallback((level: DifficultyLevel): number => {
    switch (level) {
      case 'easy': return 0.7;
      case 'normal': return 1.0;
      case 'hard': return 1.3;
      case 'expert': return 1.6;
      default: return 1.0;
    }
  }, []);

  // Calculate win rate from recent hands
  const calculateWinRate = useCallback((hands: PerformanceMetrics['recentHands']): number => {
    if (hands.length === 0) return 0.5;
    const wins = hands.filter(h => h.won).length;
    return wins / hands.length;
  }, []);

  // Calculate bankroll trend
  const calculateBankrollTrend = useCallback((history: PerformanceMetrics['bankrollHistory']): 'up' | 'down' | 'stable' => {
    if (history.length < 3) return 'stable';
    
    const recent = history.slice(-10);
    const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
    const secondHalf = recent.slice(Math.floor(recent.length / 2));
    
    const avgFirst = firstHalf.reduce((sum, h) => sum + h.amount, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((sum, h) => sum + h.amount, 0) / secondHalf.length;
    
    const changePercent = (avgSecond - avgFirst) / avgFirst;
    
    if (changePercent > 0.1) return 'up';
    if (changePercent < -0.1) return 'down';
    return 'stable';
  }, []);

  // Calculate average pot win
  const calculateAveragePotWin = useCallback((hands: PerformanceMetrics['recentHands']): number => {
    const wins = hands.filter(h => h.won);
    if (wins.length === 0) return 0;
    return wins.reduce((sum, h) => sum + h.potSize, 0) / wins.length;
  }, []);

  // Update performance when a hand is completed
  const updatePerformance = useCallback((won: boolean, potSize: number) => {
    setPerformanceMetrics(prev => {
      const newHand = {
        handId: `hand-${Date.now()}`,
        won,
        potSize,
        timestamp: Date.now()
      };

      const recentHands = [...prev.recentHands, newHand].slice(-RECENT_HANDS_WINDOW);
      const winRate = calculateWinRate(recentHands);
      const averagePotWin = calculateAveragePotWin(recentHands);
      
      // Update consecutive wins/losses
      let consecutiveWins = won ? prev.consecutiveWins + 1 : 0;
      let consecutiveLosses = won ? 0 : prev.consecutiveLosses + 1;

      return {
        ...prev,
        recentHands,
        winRate,
        consecutiveWins,
        consecutiveLosses,
        averagePotWin
      };
    });

    setHandsPlayedSinceAdjustment(prev => prev + 1);
  }, [calculateWinRate, calculateAveragePotWin]);

  // Update bankroll history
  const updateBankroll = useCallback((amount: number) => {
    setPerformanceMetrics(prev => {
      const newEntry = {
        amount,
        timestamp: Date.now()
      };

      const bankrollHistory = [...prev.bankrollHistory, newEntry].slice(-BANKROLL_HISTORY_SIZE);
      const bankrollTrend = calculateBankrollTrend(bankrollHistory);

      return {
        ...prev,
        bankrollHistory,
        bankrollTrend
      };
    });
  }, [calculateBankrollTrend]);

  // Get recommended difficulty based on performance (rubber-band system)
  const getRecommendedDifficulty = useCallback((): DifficultyLevel => {
    const { winRate, bankrollTrend, consecutiveWins, consecutiveLosses, lastDifficultyAdjustment } = performanceMetrics;
    
    // Check cooldown to prevent rapid adjustments
    const timeSinceLastAdjustment = Date.now() - lastDifficultyAdjustment;
    if (timeSinceLastAdjustment < DIFFICULTY_ADJUSTMENT_COOLDOWN) {
      return currentDifficultyLevel;
    }
    
    // Ensure we have enough hands played
    if (performanceMetrics.recentHands.length < 5) {
      return currentDifficultyLevel; // Don't adjust with insufficient data
    }
    
    // RUBBER-BAND DIFFICULTY SYSTEM
    // Priority 1: Consecutive wins/losses (immediate response)
    if (consecutiveWins >= CONSECUTIVE_THRESHOLD) {
      // Player has won 3+ hands in a row - make it harder
      switch (currentDifficultyLevel) {
        case 'easy': return 'normal';
        case 'normal': return 'hard';
        case 'hard': return 'expert';
        case 'expert': return 'expert'; // Can't go higher
      }
    }
    
    if (consecutiveLosses >= CONSECUTIVE_THRESHOLD) {
      // Player has lost 3+ hands in a row - make it easier
      switch (currentDifficultyLevel) {
        case 'expert': return 'hard';
        case 'hard': return 'normal';
        case 'normal': return 'easy';
        case 'easy': return 'easy'; // Can't go lower
      }
    }
    
    // Priority 2: Win rate and bankroll trend (gradual adjustment)
    let adjustmentScore = winRate;
    
    // Add weight from bankroll trend
    if (bankrollTrend === 'up') adjustmentScore += 0.1;
    if (bankrollTrend === 'down') adjustmentScore -= 0.1;
    
    // Adjust based on longer-term performance
    if (adjustmentScore > WIN_RATE_HIGH_THRESHOLD) {
      // Player is winning too much overall
      switch (currentDifficultyLevel) {
        case 'easy': return 'normal';
        case 'normal': return 'hard';
        case 'hard': return 'expert';
        case 'expert': return 'expert';
      }
    } else if (adjustmentScore < WIN_RATE_LOW_THRESHOLD) {
      // Player is losing too much overall
      switch (currentDifficultyLevel) {
        case 'expert': return 'hard';
        case 'hard': return 'normal';
        case 'normal': return 'easy';
        case 'easy': return 'easy';
      }
    }
    
    // Return to baseline if performance is balanced
    if (winRate >= 0.45 && winRate <= 0.55) {
      // Player performance is balanced, gradually return to normal
      if (currentDifficultyLevel === 'easy' && performanceMetrics.recentHands.length >= 10) {
        return 'normal';
      }
      if (currentDifficultyLevel === 'hard' && performanceMetrics.recentHands.length >= 10) {
        return 'normal';
      }
    }
    
    return currentDifficultyLevel;
  }, [performanceMetrics, currentDifficultyLevel]);

  // Check if difficulty should be adjusted
  const shouldAdjustDifficulty = useCallback((): boolean => {
    if (difficultyMode !== 'auto') return false;
    if (performanceMetrics.recentHands.length < 5) return false;
    if (handsPlayedSinceAdjustment < DIFFICULTY_ADJUSTMENT_DELAY) return false;
    
    const recommendedLevel = getRecommendedDifficulty();
    return recommendedLevel !== currentDifficultyLevel;
  }, [difficultyMode, performanceMetrics.recentHands.length, handsPlayedSinceAdjustment, getRecommendedDifficulty, currentDifficultyLevel]);

  // Auto-adjust difficulty when in auto mode
  useEffect(() => {
    if (shouldAdjustDifficulty()) {
      const newLevel = getRecommendedDifficulty();
      setCurrentDifficultyLevel(newLevel);
      setHandsPlayedSinceAdjustment(0);
      
      // Update last adjustment timestamp
      setPerformanceMetrics(prev => ({
        ...prev,
        lastDifficultyAdjustment: Date.now()
      }));
      
      // Save to localStorage
      localStorage.setItem('pokerDifficulty', JSON.stringify({
        mode: difficultyMode,
        level: newLevel
      }));
    }
  }, [shouldAdjustDifficulty, getRecommendedDifficulty, difficultyMode]);

  // Set difficulty mode (auto or manual)
  const setDifficultyModeHandler = useCallback((mode: DifficultyMode) => {
    setDifficultyMode(mode);
    
    if (mode !== 'auto') {
      // If switching to manual mode, set the difficulty level directly
      setCurrentDifficultyLevel(mode as DifficultyLevel);
    }
    
    // Save to localStorage
    localStorage.setItem('pokerDifficulty', JSON.stringify({
      mode,
      level: mode === 'auto' ? currentDifficultyLevel : mode
    }));
  }, [currentDifficultyLevel]);

  // Initialize performance metrics from game state if available
  useEffect(() => {
    if (gameState?.performanceMetrics) {
      setPerformanceMetrics(gameState.performanceMetrics);
    }
  }, [gameState?.performanceMetrics]);

  const difficultySettings = useMemo(() => ({
    mode: difficultyMode,
    currentLevel: currentDifficultyLevel,
    multiplier: getDifficultyMultiplier(currentDifficultyLevel)
  }), [difficultyMode, currentDifficultyLevel, getDifficultyMultiplier]);

  return {
    performanceMetrics,
    difficultySettings,
    updatePerformance,
    updateBankroll,
    setDifficultyMode: setDifficultyModeHandler,
    getRecommendedDifficulty,
    shouldAdjustDifficulty
  };
}