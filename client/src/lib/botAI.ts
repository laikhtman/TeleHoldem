import { Card, BotAction, Player, GameState, DifficultyLevel, DifficultySettings, PlayerTendencies, GamePhase } from '@shared/schema';
import { handEvaluator, BoardTextureInfo } from './handEvaluator';

interface BluffContext {
  position: 'early' | 'middle' | 'late';
  stackDepth: number; // Big blinds
  opponentsInHand: number;
  potOdds: number;
  foldEquity: number;
  boardTexture?: BoardTextureInfo;
  streetAggression?: number; // Track aggression on current street
  previousStreetAction?: 'bet' | 'check' | 'raise' | 'call' | 'fold' | null;
}

export class BotAI {
  private difficultySettings: DifficultySettings = {
    mode: 'normal',
    currentLevel: 'normal',
    multiplier: 1.0
  };
  
  private bluffHistory: Map<string, {
    street: GamePhase;
    action: string;
    handStrength: number;
  }[]> = new Map(); // Track multi-street bluffing

  constructor(difficultySettings?: DifficultySettings) {
    if (difficultySettings) {
      this.difficultySettings = difficultySettings;
    }
  }

  setDifficultySettings(settings: DifficultySettings) {
    this.difficultySettings = settings;
  }

  private getPersonality(player: Player): 'TAG' | 'LAG' | 'TP' | 'LP' | 'BAL' {
    if (player.isHuman) return 'BAL';
    const idx = parseInt(player.id, 10) || 0;
    const personalities: Array<'TAG' | 'LAG' | 'TP' | 'LP' | 'BAL'> = ['TAG', 'LAG', 'TP', 'LP', 'BAL'];
    return personalities[idx % personalities.length];
  }

  private applyDifficultyMultiplier(value: number, type: 'error' | 'aggression' | 'tightness' | 'fold_probability' | 'bet_size'): number {
    const multiplier = this.difficultySettings.multiplier;
    const level = this.difficultySettings.currentLevel;
    
    switch (type) {
      case 'error':
        // Easy mode makes more errors, expert mode makes fewer
        if (level === 'easy') return value * 1.5; // 50% more errors
        if (level === 'hard') return value * 0.7; // 30% fewer errors
        if (level === 'expert') return value * 0.4; // 60% fewer errors
        return value;
        
      case 'aggression':
        // Higher difficulty = more aggressive play
        // Easy mode: AI is less aggressive (smaller raises, less frequent)
        if (level === 'easy') return value * 0.7; // 30% less aggressive
        if (level === 'hard') return value * 1.3; // 30% more aggressive
        if (level === 'expert') return value * 1.5; // 50% more aggressive
        return value * multiplier;
        
      case 'tightness':
        // Higher difficulty = tighter, more selective play
        if (level === 'easy') return value * 0.8; // Looser play
        if (level === 'hard') return value * 1.2; // Tighter play
        if (level === 'expert') return value * 1.4; // Much tighter play
        return value;
        
      case 'fold_probability':
        // Easy mode: AI folds more often to player bets (10-15% increase)
        if (level === 'easy') return Math.min(1.0, value * 1.15); // 15% more likely to fold
        if (level === 'hard') return value * 0.9; // 10% less likely to fold
        if (level === 'expert') return value * 0.8; // 20% less likely to fold
        return value;
        
      case 'bet_size':
        // Easy mode: AI makes smaller bets
        if (level === 'easy') return value * 0.75; // 25% smaller bets
        if (level === 'hard') return value * 1.15; // 15% larger bets
        if (level === 'expert') return value * 1.25; // 25% larger bets
        return value;
    }
  }

  private paramsFor(personality: ReturnType<BotAI['getPersonality']>, humanWinRateAdj: number = 0) {
    // Enhanced parameters with personality-based bluffing frequencies
    let params = { 
      bluffBase: 0, 
      raiseMult: 0, 
      betNoBet: 0, 
      callTightness: 0, 
      mistakeChance: 0,
      // New advanced bluffing parameters
      bluffFrequency: 0,      // Overall bluff frequency
      cbetFrequency: 0,       // Continuation bet frequency
      barrelFrequency: 0,     // Multi-street bluff frequency
      riverBluffFrequency: 0, // River bluff frequency
      giveUpThreshold: 0      // When to abandon bluffs
    };
    
    switch (personality) {
      case 'TAG': // Tight-Aggressive: Selective bluffs (15-20%)
        params = { 
          bluffBase: 0.05 - humanWinRateAdj * 0.05, 
          raiseMult: 0.5 + humanWinRateAdj * 0.1, 
          betNoBet: 0.45 - humanWinRateAdj * 0.05, 
          callTightness: 0.35 + humanWinRateAdj * 0.05,
          mistakeChance: 0.05,
          bluffFrequency: 0.175,
          cbetFrequency: 0.65,
          barrelFrequency: 0.35,
          riverBluffFrequency: 0.20,
          giveUpThreshold: 0.6
        };
        break;
      case 'LAG': // Loose-Aggressive: High bluff frequency (30-40%)
        params = { 
          bluffBase: 0.15 - humanWinRateAdj * 0.08, 
          raiseMult: 0.8 + humanWinRateAdj * 0.1, 
          betNoBet: 0.5 - humanWinRateAdj * 0.06, 
          callTightness: 0.25 + humanWinRateAdj * 0.04,
          mistakeChance: 0.08,
          bluffFrequency: 0.35,
          cbetFrequency: 0.80,
          barrelFrequency: 0.50,
          riverBluffFrequency: 0.35,
          giveUpThreshold: 0.4
        };
        break;
      case 'TP': // Tight-Passive: Rare bluffs (5-10%)
        params = { 
          bluffBase: 0.03 - humanWinRateAdj * 0.03, 
          raiseMult: 0.35 + humanWinRateAdj * 0.08, 
          betNoBet: 0.3 - humanWinRateAdj * 0.04, 
          callTightness: 0.45 + humanWinRateAdj * 0.05,
          mistakeChance: 0.04,
          bluffFrequency: 0.075,
          cbetFrequency: 0.40,
          barrelFrequency: 0.15,
          riverBluffFrequency: 0.08,
          giveUpThreshold: 0.8
        };
        break;
      case 'LP': // Loose-Passive: Almost no bluffs (0-5%)
        params = { 
          bluffBase: 0.08 - humanWinRateAdj * 0.05, 
          raiseMult: 0.4 + humanWinRateAdj * 0.08, 
          betNoBet: 0.2 - humanWinRateAdj * 0.03, 
          callTightness: 0.5 + humanWinRateAdj * 0.05,
          mistakeChance: 0.06,
          bluffFrequency: 0.025,
          cbetFrequency: 0.30,
          barrelFrequency: 0.10,
          riverBluffFrequency: 0.03,
          giveUpThreshold: 0.9
        };
        break;
      default: // BAL - Balanced: Optimal frequency (20-25%)
        params = { 
          bluffBase: 0.1 - humanWinRateAdj * 0.06, 
          raiseMult: 0.6 + humanWinRateAdj * 0.1, 
          betNoBet: 0.4 - humanWinRateAdj * 0.05, 
          callTightness: 0.35 + humanWinRateAdj * 0.05,
          mistakeChance: 0.07,
          bluffFrequency: 0.225,
          cbetFrequency: 0.60,
          barrelFrequency: 0.40,
          riverBluffFrequency: 0.25,
          giveUpThreshold: 0.5
        };
    }
    
    // Apply difficulty modifiers
    params.bluffBase = this.applyDifficultyMultiplier(params.bluffBase, 'aggression');
    params.raiseMult = this.applyDifficultyMultiplier(params.raiseMult, 'aggression');
    params.betNoBet = this.applyDifficultyMultiplier(params.betNoBet, 'tightness');
    params.callTightness = this.applyDifficultyMultiplier(params.callTightness, 'tightness');
    params.mistakeChance = this.applyDifficultyMultiplier(params.mistakeChance, 'error');
    params.bluffFrequency = this.applyDifficultyMultiplier(params.bluffFrequency, 'aggression');
    params.cbetFrequency = this.applyDifficultyMultiplier(params.cbetFrequency, 'aggression');
    params.barrelFrequency = this.applyDifficultyMultiplier(params.barrelFrequency, 'aggression');
    
    return params;
  }

  getAction(player: Player, gameState: GameState): BotAction {
    const { currentBet, phase, pots, players } = gameState;
    const totalPot = pots.reduce((acc, pot) => acc + pot.amount, 0);
    const callAmount = currentBet - player.bet;
    const activePlayers = players.filter(p => !p.folded).length;

    // Update difficulty settings if available in game state
    if (gameState.difficultySettings) {
      this.difficultySettings = gameState.difficultySettings;
    }

    const handStrength = this.evaluateHandStrength(player.hand, gameState.communityCards);
    const personality = this.getPersonality(player);
    
    // Dynamic difficulty adjustment based on performance metrics
    let humanWinAdj = 0;
    if (gameState.performanceMetrics) {
      const winRate = gameState.performanceMetrics.winRate;
      if (this.difficultySettings.mode === 'auto') {
        humanWinAdj = Math.max(-0.15, Math.min(0.15, (winRate - 0.5) * 0.3));
      }
    } else {
      const played = Math.max(1, gameState.sessionStats.handsPlayed);
      const humanWR = gameState.sessionStats.handsWonByPlayer / played;
      humanWinAdj = Math.max(-0.1, Math.min(0.1, (humanWR - 0.5)));
    }
    
    const params = this.paramsFor(personality, humanWinAdj);
    
    // Analyze context for advanced bluffing
    const context = this.analyzeBluffContext(player, gameState);
    
    // Calculate advanced bluff frequency
    const advancedBluffFrequency = this.calculateAdvancedBluffFrequency(context, personality, params, gameState);
    
    // Make random mistakes based on difficulty
    if (Math.random() < params.mistakeChance) {
      const mistakeType = Math.random();
      if (this.difficultySettings.currentLevel === 'easy') {
        if (mistakeType < 0.3 && callAmount > 0) return { action: 'fold' };
        if (mistakeType < 0.6 && callAmount === 0) return { action: 'check' };
      } else if (this.difficultySettings.currentLevel === 'normal') {
        if (mistakeType < 0.15 && callAmount > 0 && handStrength < 0.4) return { action: 'fold' };
      }
    }
    
    // Check for multi-street bluff continuation
    const handId = `${gameState.sessionStats.handsPlayed}`;
    const bluffHistory = this.bluffHistory.get(handId);
    if (bluffHistory && bluffHistory.length > 0) {
      const lastBluff = bluffHistory[bluffHistory.length - 1];
      // If we were bluffing and hand strength is still weak
      if (lastBluff.handStrength < 0.4 && handStrength < 0.5) {
        if (this.shouldContinueBluff(player, gameState, params)) {
          const bluffAction = this.executeAdvancedBluff(player, gameState, context, params);
          if (bluffAction) return bluffAction;
        } else {
          // Give up on bluff
          if (callAmount > 0) return { action: 'fold' };
          return { action: 'check' };
        }
      }
    }
    
    // Advanced bluffing decision based on context and personality
    const shouldBluff = Math.random() < advancedBluffFrequency && handStrength < 0.4;
    
    if (shouldBluff) {
      // Execute advanced bluff
      const bluffAction = this.executeAdvancedBluff(player, gameState, context, params);
      if (bluffAction) return bluffAction;
    }
    
    // Value betting and standard play
    const betSizeModifier = this.applyDifficultyMultiplier(1.0, 'bet_size');
    const foldProbabilityModifier = this.applyDifficultyMultiplier(1.0, 'fold_probability');
    
    if (callAmount === 0) { // No bet to call
      // Strong hand - value bet
      if (handStrength > 0.75) {
        const betAmount = Math.min(
          Math.floor(totalPot * (params.raiseMult + Math.random() * 0.3) * betSizeModifier),
          player.chips
        );
        return { action: 'bet', amount: Math.max(betAmount, 20) };
      }
      
      // Medium hand - sometimes bet (based on personality)
      if (handStrength > params.betNoBet) {
        // Continuation betting frequency
        const cbetChance = phase === 'flop' ? params.cbetFrequency : params.betNoBet;
        if (Math.random() < cbetChance) {
          const betAmount = Math.min(
            Math.floor(totalPot * (0.4 + Math.random() * 0.2) * betSizeModifier),
            player.chips
          );
          return { action: 'bet', amount: Math.max(betAmount, 20) };
        }
      }
      
      return { action: 'check' };
    }
    
    // Facing a bet
    const potOdds = callAmount / (totalPot + callAmount);
    
    // Very strong hand - raise for value
    if (handStrength > 0.85) {
      const raiseAmount = Math.min(
        callAmount + Math.floor(totalPot * (params.raiseMult + Math.random() * 0.4) * betSizeModifier),
        player.chips
      );
      return { action: 'raise', amount: raiseAmount };
    }
    
    // Strong hand - call or raise based on personality
    if (handStrength > 0.65) {
      if (personality === 'LAG' || personality === 'TAG') {
        // Aggressive personalities raise more often
        if (Math.random() < 0.4) {
          const raiseAmount = Math.min(
            callAmount + Math.floor(totalPot * (0.5 + Math.random() * 0.3) * betSizeModifier),
            player.chips
          );
          return { action: 'raise', amount: raiseAmount };
        }
      }
      return { action: 'call', amount: callAmount };
    }
    
    // Medium hand - consider pot odds and tendencies
    if (handStrength > 0.35) {
      // Use player tendencies to make decision
      let callThreshold = params.callTightness;
      if (gameState.playerTendencies && gameState.playerTendencies.aggressionFactor > 1.5) {
        // Tighten up against aggressive players
        callThreshold += 0.1;
      }
      
      if (handStrength > callThreshold || potOdds < 0.25) {
        // Apply fold probability modifier for easier difficulty
        if (Math.random() > foldProbabilityModifier) {
          return { action: 'fold' };
        }
        return { action: 'call', amount: callAmount };
      }
    }
    
    // Weak hand - consider bluff raise or fold
    if (handStrength < 0.2 && Math.random() < advancedBluffFrequency * 0.5) {
      // Occasional bluff raise with very weak hands
      const raiseAmount = Math.min(
        callAmount + Math.floor(totalPot * (0.6 + Math.random() * 0.4) * betSizeModifier),
        player.chips
      );
      return { action: 'raise', amount: raiseAmount };
    }
    
    return { action: 'fold' };
  }

  // Evaluate hand strength using hand evaluator
  private evaluateHandStrength(hand: Card[], communityCards: Card[]): number {
    if (communityCards.length === 0) {
      // Pre-flop: simple high card evaluation
      return this.evaluatePreflopHand(hand);
    }
    
    // Post-flop: use hand evaluator
    return handEvaluator.evaluateHandStrength(hand, communityCards);
  }

  private evaluatePreflopHand(hand: Card[]): number {
    if (hand.length < 2) return 0.1;
    
    const [card1, card2] = hand;
    const rank1 = this.getRankValue(card1.rank);
    const rank2 = this.getRankValue(card2.rank);
    
    // Pocket pair
    if (rank1 === rank2) {
      return 0.5 + (rank1 / 14) * 0.4;
    }
    
    // High cards
    const avgRank = (rank1 + rank2) / 2;
    const maxRank = Math.max(rank1, rank2);
    
    // Suited bonus
    const suitedBonus = card1.suit === card2.suit ? 0.1 : 0;
    
    return Math.min(0.9, (avgRank / 14) * 0.5 + (maxRank / 14) * 0.2 + suitedBonus);
  }

  private getRankValue(rank: string): number {
    const values: Record<string, number> = {
      '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
      '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
    };
    return values[rank] || 2;
  }
  
  // Advanced bluffing methods
  private analyzeBluffContext(player: Player, gameState: GameState): BluffContext {
    const { players, currentBet, pots } = gameState;
    const totalPot = pots.reduce((acc, pot) => acc + pot.amount, 0);
    const callAmount = currentBet - player.bet;
    const activePlayers = players.filter(p => !p.folded && !p.allIn);
    
    // Position analysis
    let position: 'early' | 'middle' | 'late';
    const positionRatio = player.position / (players.length - 1);
    if (positionRatio < 0.33) position = 'early';
    else if (positionRatio < 0.67) position = 'middle';
    else position = 'late';
    
    // Stack depth in big blinds (assume 20 is big blind)
    const stackDepth = player.chips / 20;
    
    // Pot odds and fold equity
    const potOdds = callAmount > 0 ? callAmount / (totalPot + callAmount) : 0;
    
    // Estimate fold equity based on player tendencies
    let foldEquity = 0.4; // Base fold equity
    if (gameState.playerTendencies) {
      const tendencies = gameState.playerTendencies;
      if (tendencies.foldToBetFrequency > 0) {
        foldEquity = tendencies.foldToBetFrequency;
      }
    }
    
    // Board texture analysis
    const boardTexture = gameState.communityCards.length >= 3 
      ? handEvaluator.evaluateBoardTexture(gameState.communityCards)
      : undefined;
    
    return {
      position,
      stackDepth,
      opponentsInHand: activePlayers.length - 1,
      potOdds,
      foldEquity,
      boardTexture,
    };
  }
  
  private calculateAdvancedBluffFrequency(
    context: BluffContext,
    personality: 'TAG' | 'LAG' | 'TP' | 'LP' | 'BAL',
    params: any,
    gameState: GameState
  ): number {
    let baseFrequency = params.bluffFrequency;
    
    // Position adjustment (more bluffs in late position)
    if (context.position === 'late') {
      baseFrequency *= 1.3;
    } else if (context.position === 'early') {
      baseFrequency *= 0.7;
    }
    
    // Stack depth adjustment (avoid bluffing when short-stacked)
    if (context.stackDepth < 15) {
      baseFrequency *= 0.5; // Much less bluffing when short
    } else if (context.stackDepth > 50) {
      baseFrequency *= 1.2; // More bluffing with deep stacks
    }
    
    // Multi-way pot adjustment (less bluffing multiway)
    if (context.opponentsInHand > 1) {
      baseFrequency *= Math.max(0.3, 1 - (context.opponentsInHand - 1) * 0.3);
    }
    
    // Board texture adjustment
    if (context.boardTexture) {
      if (context.boardTexture.isDry) {
        baseFrequency *= 1.25; // More bluffs on dry boards
      } else if (context.boardTexture.isWet) {
        baseFrequency *= 0.75; // Fewer bluffs on wet boards
      }
      
      // Scare cards adjustment
      if (context.boardTexture.scaryCards.length > 0) {
        baseFrequency *= 1.15; // More bluffs when scary cards hit
      }
      
      // Paired board adjustment
      if (context.boardTexture.isPaired) {
        baseFrequency *= 0.85; // Fewer bluffs on paired boards
      }
    }
    
    // Fold equity adjustment
    if (context.foldEquity > 0.6) {
      baseFrequency *= 1.2; // Bluff more against folders
    } else if (context.foldEquity < 0.3) {
      baseFrequency *= 0.6; // Bluff less against calling stations
    }
    
    return Math.min(0.8, Math.max(0, baseFrequency));
  }
  
  private shouldContinueBluff(
    player: Player,
    gameState: GameState,
    params: any
  ): boolean {
    const handId = `${gameState.sessionStats.handsPlayed}`;
    const history = this.bluffHistory.get(handId) || [];
    
    // Check if we've been called multiple times
    const calledCount = history.filter(h => h.action === 'called').length;
    if (calledCount >= 2) {
      // Give up on bluff if called twice (based on personality threshold)
      return Math.random() > params.giveUpThreshold;
    }
    
    // Check board development
    if (gameState.communityCards.length >= 4) {
      const boardTexture = handEvaluator.evaluateBoardTexture(gameState.communityCards);
      if (boardTexture) {
        // Continue if scary cards hit
        if (boardTexture.scaryCards.length > 0) {
          return Math.random() < params.barrelFrequency * 1.5;
        }
        // Give up if board gets too wet
        if (boardTexture.isWet && boardTexture.isMonotone) {
          return Math.random() < params.barrelFrequency * 0.5;
        }
      }
    }
    
    // Check if we're on the river
    if (gameState.phase === 'river') {
      return Math.random() < params.riverBluffFrequency;
    }
    
    return Math.random() < params.barrelFrequency;
  }
  
  private executeAdvancedBluff(
    player: Player,
    gameState: GameState,
    context: BluffContext,
    params: any
  ): BotAction | null {
    const { currentBet, pots } = gameState;
    const totalPot = pots.reduce((acc, pot) => acc + pot.amount, 0);
    const callAmount = currentBet - player.bet;
    
    // Calculate bluff size based on board texture and context
    let bluffSizeFactor = params.raiseMult;
    
    // Adjust size based on board texture
    if (context.boardTexture) {
      if (context.boardTexture.isDry) {
        bluffSizeFactor *= 0.75; // Smaller bluffs on dry boards
      } else if (context.boardTexture.isWet) {
        bluffSizeFactor *= 1.25; // Larger bluffs on wet boards to rep strong hands
      }
    }
    
    // Polarize on the river
    if (gameState.phase === 'river') {
      bluffSizeFactor *= Math.random() < 0.5 ? 1.5 : 0.8; // Mix of large and medium bluffs
    }
    
    // Calculate the bluff amount
    const bluffAmount = Math.floor(totalPot * bluffSizeFactor * this.applyDifficultyMultiplier(1.0, 'bet_size'));
    
    // Record the bluff in history
    const handId = `${gameState.sessionStats.handsPlayed}`;
    const history = this.bluffHistory.get(handId) || [];
    history.push({
      street: gameState.phase,
      action: callAmount > 0 ? 'raise' : 'bet',
      handStrength: this.evaluateHandStrength(player.hand, gameState.communityCards)
    });
    this.bluffHistory.set(handId, history);
    
    if (callAmount > 0) {
      const raiseAmount = Math.min(callAmount + bluffAmount, player.chips);
      return { action: 'raise', amount: raiseAmount };
    } else {
      const betAmount = Math.min(Math.max(bluffAmount, 20), player.chips);
      return { action: 'bet', amount: betAmount };
    }
  }
}

export const botAI = new BotAI();