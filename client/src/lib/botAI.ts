import { Card, BotAction, Player, GameState, DifficultyLevel, DifficultySettings, PlayerTendencies, GamePhase, TableImage, BotMemory, MetaGameData, PlayerStyle, TableDynamics } from '@shared/schema';
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

interface MetaGameAdjustments {
  aggressionMultiplier: number;
  callingStandardsAdjustment: number;
  bluffFrequencyAdjustment: number;
  targetedPlayers: string[]; // Players to exploit
  defensivePlayers: string[]; // Players to be careful against
  strategyShift: 'default' | 'tight-aggressive' | 'loose-aggressive' | 'tight-passive' | 'exploitative';
  exploitMode: boolean;
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
    
    // Get meta-game adjustments based on table dynamics and player images
    const metaGameAdjustments = this.calculateMetaGameAdjustments(player, gameState);
    
    // Apply meta-game adjustments to parameters
    const adjustedParams = this.applyMetaGameAdjustments(params, metaGameAdjustments);
    
    // Analyze context for advanced bluffing
    const context = this.analyzeBluffContext(player, gameState);
    
    // Calculate advanced bluff frequency with meta-game awareness
    const advancedBluffFrequency = this.calculateAdvancedBluffFrequency(context, personality, adjustedParams, gameState);
    
    // Make random mistakes based on difficulty
    if (Math.random() < adjustedParams.mistakeChance) {
      const mistakeType = Math.random();
      if (this.difficultySettings.currentLevel === 'easy') {
        if (mistakeType < 0.3 && callAmount > 0) return { action: 'fold' };
        if (mistakeType < 0.6 && callAmount === 0) return { action: 'check' };
      } else if (this.difficultySettings.currentLevel === 'normal') {
        if (mistakeType < 0.15 && callAmount > 0 && handStrength < 0.4) return { action: 'fold' };
      }
    }
    
    // Check if being exploited and need to counter-adjust
    if (metaGameAdjustments.exploitMode && metaGameAdjustments.defensivePlayers.length > 0) {
      return this.getCounterExploitAction(player, gameState, adjustedParams, handStrength, metaGameAdjustments);
    }
    
    // Check for multi-street bluff continuation
    const handId = `${gameState.sessionStats.handsPlayed}`;
    const bluffHistory = this.bluffHistory.get(handId);
    if (bluffHistory && bluffHistory.length > 0) {
      const lastBluff = bluffHistory[bluffHistory.length - 1];
      // If we were bluffing and hand strength is still weak
      if (lastBluff.handStrength < 0.4 && handStrength < 0.5) {
        if (this.shouldContinueBluff(player, gameState, adjustedParams)) {
          const bluffAction = this.executeAdvancedBluff(player, gameState, context, adjustedParams);
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
      const bluffAction = this.executeAdvancedBluff(player, gameState, context, adjustedParams);
      if (bluffAction) return bluffAction;
    }
    
    // Target exploitable players with increased aggression
    if (metaGameAdjustments.targetedPlayers.length > 0) {
      const targetInHand = gameState.players.some(p => 
        !p.folded && metaGameAdjustments.targetedPlayers.includes(p.id)
      );
      if (targetInHand && handStrength > 0.35) {
        // Increase aggression against weak players
        if (callAmount === 0 && Math.random() < adjustedParams.betNoBet * 1.5) {
          const betAmount = Math.min(Math.floor(totalPot * 0.75), player.chips);
          return { action: 'bet', amount: betAmount };
        } else if (callAmount > 0 && handStrength > 0.45 && Math.random() < adjustedParams.raiseMult * 1.5) {
          const raiseAmount = Math.min(currentBet * 2.5, player.chips);
          return { action: 'raise', amount: Math.floor(raiseAmount) };
        }
      }
    }
    
    // Value betting and standard play
    const betSizeModifier = this.applyDifficultyMultiplier(1.0, 'bet_size');
    const foldProbabilityModifier = this.applyDifficultyMultiplier(1.0, 'fold_probability');
    
    // Helper function for realistic bet sizing
    const getRealisticBetSize = (potFraction: number, randomness: number = 0.15): number => {
      const baseAmount = totalPot * potFraction;
      const variation = baseAmount * (Math.random() * randomness * 2 - randomness);
      const betAmount = Math.floor((baseAmount + variation) * betSizeModifier);
      // Round to nearest 5 or 10 for more realistic amounts
      const rounded = betAmount < 100 ? Math.round(betAmount / 5) * 5 : Math.round(betAmount / 10) * 10;
      return Math.min(Math.max(rounded, 10), player.chips);
    };
    
    if (callAmount === 0) { // No bet to call
      // Strong hand - value bet with varied sizing
      if (handStrength > 0.75) {
        // Mix between different bet sizes based on personality and board
        const sizeRoll = Math.random();
        let betAmount: number;
        
        if (personality === 'LAG' || personality === 'TAG') {
          // Aggressive players use larger sizes more often
          if (sizeRoll < 0.3) betAmount = getRealisticBetSize(0.5);      // 50% pot
          else if (sizeRoll < 0.6) betAmount = getRealisticBetSize(0.66);  // 2/3 pot
          else if (sizeRoll < 0.85) betAmount = getRealisticBetSize(0.75); // 75% pot
          else betAmount = getRealisticBetSize(1.0);                       // Pot sized
        } else {
          // Passive players use smaller sizes more often
          if (sizeRoll < 0.4) betAmount = getRealisticBetSize(0.33);  // 1/3 pot
          else if (sizeRoll < 0.7) betAmount = getRealisticBetSize(0.5); // 50% pot
          else if (sizeRoll < 0.9) betAmount = getRealisticBetSize(0.66); // 2/3 pot
          else betAmount = getRealisticBetSize(0.75);                    // 75% pot
        }
        
        return { action: 'bet', amount: betAmount };
      }
      
      // Medium hand - sometimes bet (based on personality)
      if (handStrength > adjustedParams.betNoBet) {
        // Continuation betting frequency
        const cbetChance = phase === 'flop' ? adjustedParams.cbetFrequency : adjustedParams.betNoBet;
        if (Math.random() < cbetChance) {
          // Use smaller sizes for continuation bets
          const sizeRoll = Math.random();
          let betAmount: number;
          
          if (phase === 'flop') {
            // Flop c-bets are typically smaller
            if (sizeRoll < 0.5) betAmount = getRealisticBetSize(0.33);  // 1/3 pot
            else if (sizeRoll < 0.8) betAmount = getRealisticBetSize(0.5); // 50% pot
            else betAmount = getRealisticBetSize(0.66);                     // 2/3 pot
          } else {
            // Turn and river bets are larger
            if (sizeRoll < 0.3) betAmount = getRealisticBetSize(0.5);   // 50% pot
            else if (sizeRoll < 0.7) betAmount = getRealisticBetSize(0.66); // 2/3 pot
            else betAmount = getRealisticBetSize(0.75);                    // 75% pot
          }
          
          return { action: 'bet', amount: betAmount };
        }
      }
      
      return { action: 'check' };
    }
    
    // Facing a bet
    const potOdds = callAmount / (totalPot + callAmount);
    
    // Very strong hand - raise for value with realistic sizing
    if (handStrength > 0.85) {
      // Calculate raise sizes more realistically
      const minRaise = currentBet * 2;
      const sizeRoll = Math.random();
      let raiseAmount: number;
      
      if (personality === 'LAG' || personality === 'TAG') {
        // Aggressive players make larger raises
        if (sizeRoll < 0.3) raiseAmount = Math.floor(minRaise);                    // Min raise
        else if (sizeRoll < 0.6) raiseAmount = Math.floor(currentBet * 2.5);      // 2.5x
        else if (sizeRoll < 0.85) raiseAmount = Math.floor(currentBet * 3);       // 3x
        else raiseAmount = Math.floor(currentBet * 3.5 + totalPot * 0.3);        // 3.5x + pot fraction
      } else {
        // Passive players make smaller raises
        if (sizeRoll < 0.5) raiseAmount = Math.floor(minRaise);                    // Min raise
        else if (sizeRoll < 0.8) raiseAmount = Math.floor(currentBet * 2.25);     // 2.25x
        else raiseAmount = Math.floor(currentBet * 2.5);                          // 2.5x
      }
      
      // Round to nearest 10 and cap at player chips
      raiseAmount = Math.min(Math.round(raiseAmount / 10) * 10, player.chips);
      return { action: 'raise', amount: Math.max(raiseAmount, minRaise) };
    }
    
    // Strong hand - call or raise based on personality
    if (handStrength > 0.65) {
      if (personality === 'LAG' || personality === 'TAG') {
        // Aggressive personalities raise more often
        if (Math.random() < 0.4) {
          // Use realistic raise sizes
          const minRaise = currentBet * 2;
          const sizeRoll = Math.random();
          let raiseAmount: number;
          
          if (sizeRoll < 0.5) raiseAmount = Math.floor(minRaise);              // Min raise
          else if (sizeRoll < 0.8) raiseAmount = Math.floor(currentBet * 2.5); // 2.5x
          else raiseAmount = Math.floor(currentBet * 3);                       // 3x
          
          raiseAmount = Math.min(Math.round(raiseAmount / 10) * 10, player.chips);
          return { action: 'raise', amount: Math.max(raiseAmount, minRaise) };
        }
      }
      return { action: 'call', amount: callAmount };
    }
    
    // Medium hand - consider pot odds and tendencies
    if (handStrength > 0.35) {
      // Use player tendencies to make decision
      let callThreshold = adjustedParams.callTightness;
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
      // Occasional bluff raise with realistic sizing
      const minRaise = currentBet * 2;
      const sizeRoll = Math.random();
      let raiseAmount: number;
      
      // Bluff raises tend to be larger to generate fold equity
      if (sizeRoll < 0.3) raiseAmount = Math.floor(currentBet * 2.5);      // 2.5x
      else if (sizeRoll < 0.7) raiseAmount = Math.floor(currentBet * 3);    // 3x
      else raiseAmount = Math.floor(currentBet * 3.5 + totalPot * 0.25);   // 3.5x + pot fraction
      
      raiseAmount = Math.min(Math.round(raiseAmount / 10) * 10, player.chips);
      return { action: 'raise', amount: Math.max(raiseAmount, minRaise) };
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
    
    // Helper function for realistic bluff sizing
    const getRealisticBluffSize = (potFraction: number): number => {
      const baseAmount = totalPot * potFraction;
      const variation = baseAmount * (Math.random() * 0.15 - 0.075); // ±7.5% variation
      const betAmount = Math.floor((baseAmount + variation) * this.applyDifficultyMultiplier(1.0, 'bet_size'));
      // Round to nearest 10 for more realistic amounts
      const rounded = Math.round(betAmount / 10) * 10;
      return Math.min(Math.max(rounded, 10), player.chips);
    };
    
    // Determine bluff sizing based on context
    let bluffAmount: number;
    const sizeRoll = Math.random();
    
    if (context.boardTexture && context.boardTexture.isDry) {
      // Smaller bluffs on dry boards (30-60% pot)
      if (sizeRoll < 0.5) bluffAmount = getRealisticBluffSize(0.33);      // 1/3 pot
      else if (sizeRoll < 0.8) bluffAmount = getRealisticBluffSize(0.5);  // 50% pot
      else bluffAmount = getRealisticBluffSize(0.6);                       // 60% pot
    } else if (context.boardTexture && context.boardTexture.isWet) {
      // Larger bluffs on wet boards to represent strength (60-100% pot)
      if (sizeRoll < 0.3) bluffAmount = getRealisticBluffSize(0.6);       // 60% pot
      else if (sizeRoll < 0.7) bluffAmount = getRealisticBluffSize(0.75); // 75% pot
      else bluffAmount = getRealisticBluffSize(1.0);                       // Pot sized
    } else {
      // Default mixed sizing
      if (sizeRoll < 0.35) bluffAmount = getRealisticBluffSize(0.5);     // 50% pot
      else if (sizeRoll < 0.7) bluffAmount = getRealisticBluffSize(0.66); // 2/3 pot
      else bluffAmount = getRealisticBluffSize(0.75);                      // 75% pot
    }
    
    // River bluffs are typically more polarized
    if (gameState.phase === 'river') {
      const riverRoll = Math.random();
      if (riverRoll < 0.4) {
        // Small blocking bets
        bluffAmount = getRealisticBluffSize(0.33);
      } else if (riverRoll < 0.7) {
        // Medium value-ish bets
        bluffAmount = getRealisticBluffSize(0.66);
      } else {
        // Large polarized bets
        bluffAmount = getRealisticBluffSize(Math.random() < 0.5 ? 1.0 : 1.25);
      }
    }
    
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
  
  private calculateMetaGameAdjustments(player: Player, gameState: GameState): MetaGameAdjustments {
    const adjustments: MetaGameAdjustments = {
      aggressionMultiplier: 1.0,
      callingStandardsAdjustment: 0,
      bluffFrequencyAdjustment: 0,
      targetedPlayers: [],
      defensivePlayers: [],
      strategyShift: 'default',
      exploitMode: false
    };
    
    if (!gameState.metaGameData) return adjustments;
    
    const metaData = gameState.metaGameData;
    const myMemory = metaData.botMemories.get(player.id);
    const tableDynamics = metaData.tableDynamics;
    
    // Adjust based on table dynamics
    if (tableDynamics.tableFlow === 'aggressive' || tableDynamics.tableFlow === 'maniac') {
      // Tighten up at aggressive tables
      adjustments.aggressionMultiplier *= 0.8;
      adjustments.callingStandardsAdjustment += 0.1; // Be more selective
      adjustments.strategyShift = 'tight-aggressive';
    } else if (tableDynamics.tableFlow === 'passive') {
      // Loosen up and be more aggressive at passive tables
      adjustments.aggressionMultiplier *= 1.3;
      adjustments.callingStandardsAdjustment -= 0.1; // Can play more hands
      adjustments.bluffFrequencyAdjustment += 0.15; // More bluffs work
      adjustments.strategyShift = 'loose-aggressive';
    }
    
    // Identify exploitable players
    const tableImages = Array.from(metaData.tableImages.values());
    tableImages.forEach(image => {
      if (image.playerId === player.id) {
        // Check if we're being exploited
        if (myMemory && image.exploitablePatterns.includes('FOLDS_TO_3BET')) {
          adjustments.exploitMode = true;
          adjustments.aggressionMultiplier *= 1.2; // Fight back
        }
      } else {
        // Find players to exploit
        if (image.exploitablePatterns.includes('FOLDS_TO_3BET')) {
          adjustments.targetedPlayers.push(image.playerId);
        }
        if (image.exploitablePatterns.includes('NEVER_BLUFFS')) {
          adjustments.targetedPlayers.push(image.playerId);
        }
        if (image.style === 'STATION' || image.style === 'LP') {
          adjustments.targetedPlayers.push(image.playerId);
        }
        
        // Be careful against aggressive players
        if (image.style === 'LAG' || image.style === 'MANIAC') {
          adjustments.defensivePlayers.push(image.playerId);
        }
      }
    });
    
    // Check our own memory for specific player adjustments
    if (myMemory) {
      myMemory.playerHistories.forEach((history, playerId) => {
        const playerImage = metaData.tableImages.get(playerId);
        if (!playerImage) return;
        
        // If this player has been successfully bluffing us
        if (history.caughtBluffing > history.successfulBluffs * 2) {
          adjustments.defensivePlayers.push(playerId);
        }
        
        // If we've been dominating this player
        if (history.moneyWon > history.moneyLost * 2) {
          adjustments.targetedPlayers.push(playerId);
        }
      });
      
      // Adjust strategy based on our perceived image
      if (myMemory.myTableImage) {
        if (myMemory.myTableImage.style === 'NIT' || myMemory.myTableImage.style === 'ROCK') {
          // We're seen as too tight, need to loosen up
          adjustments.bluffFrequencyAdjustment += 0.2;
          adjustments.strategyShift = 'loose-aggressive';
        } else if (myMemory.myTableImage.style === 'MANIAC') {
          // We're seen as too loose, tighten up
          adjustments.callingStandardsAdjustment += 0.15;
          adjustments.strategyShift = 'tight-aggressive';
        }
      }
      
      // Table captain awareness
      if (tableDynamics.tableCaptains.includes(player.id)) {
        // We're the table captain, maintain dominance
        adjustments.aggressionMultiplier *= 1.1;
      } else if (tableDynamics.tableCaptains.length > 0) {
        // Someone else is dominating, adjust accordingly
        const captainInHand = gameState.players.some(p => 
          !p.folded && tableDynamics.tableCaptains.includes(p.id)
        );
        if (captainInHand) {
          adjustments.callingStandardsAdjustment += 0.05;
        }
      }
    }
    
    // Momentum-based adjustments
    if (tableDynamics.momentum === 'building') {
      // Action is heating up, be more selective
      adjustments.callingStandardsAdjustment += 0.05;
    } else if (tableDynamics.momentum === 'cooling') {
      // Table is tightening up, increase aggression
      adjustments.aggressionMultiplier *= 1.15;
      adjustments.bluffFrequencyAdjustment += 0.1;
    }
    
    return adjustments;
  }
  
  private applyMetaGameAdjustments(params: any, adjustments: MetaGameAdjustments): any {
    const adjusted = { ...params };
    
    // Apply aggression multiplier
    adjusted.raiseMult *= adjustments.aggressionMultiplier;
    adjusted.betNoBet *= adjustments.aggressionMultiplier;
    
    // Apply calling standards adjustment
    adjusted.callTightness += adjustments.callingStandardsAdjustment;
    
    // Apply bluff frequency adjustment
    adjusted.bluffBase += adjustments.bluffFrequencyAdjustment;
    adjusted.bluffFrequency += adjustments.bluffFrequencyAdjustment;
    adjusted.cbetFrequency *= (1 + adjustments.bluffFrequencyAdjustment);
    
    // Ensure values stay within reasonable bounds
    adjusted.raiseMult = Math.max(0.2, Math.min(1.0, adjusted.raiseMult));
    adjusted.betNoBet = Math.max(0.1, Math.min(0.7, adjusted.betNoBet));
    adjusted.callTightness = Math.max(0.1, Math.min(0.7, adjusted.callTightness));
    adjusted.bluffBase = Math.max(0, Math.min(0.3, adjusted.bluffBase));
    adjusted.bluffFrequency = Math.max(0, Math.min(0.5, adjusted.bluffFrequency));
    
    return adjusted;
  }
  
  private getCounterExploitAction(
    player: Player, 
    gameState: GameState, 
    params: any, 
    handStrength: number,
    adjustments: MetaGameAdjustments
  ): BotAction {
    const { currentBet, pots } = gameState;
    const totalPot = pots.reduce((acc, pot) => acc + pot.amount, 0);
    const callAmount = currentBet - player.bet;
    
    // Counter-exploit strategy: become unexploitable
    
    // If we're being 3-bet too often, start 4-betting light occasionally
    if (adjustments.exploitMode && gameState.phase === 'pre-flop' && gameState.roundActionCount > 2) {
      if (handStrength > 0.3 && Math.random() < 0.25) { // 25% 4-bet frequency with decent hands
        const fourBetAmount = Math.min(currentBet * 2.5, player.chips);
        if (fourBetAmount > currentBet) {
          return { action: 'raise', amount: Math.floor(fourBetAmount) };
        }
      }
    }
    
    // If someone is targeting our blinds, defend more frequently
    const isBlindDefense = (gameState.dealerIndex + 1) % gameState.players.length === player.position ||
                          (gameState.dealerIndex + 2) % gameState.players.length === player.position;
    
    if (isBlindDefense && adjustments.defensivePlayers.length > 0) {
      const raiserIsTargeting = adjustments.defensivePlayers.some(id => {
        const p = gameState.players.find(pl => pl.id === id);
        return p && !p.folded && p.bet > 0;
      });
      
      if (raiserIsTargeting && handStrength > 0.25) { // Defend wider
        if (callAmount > 0 && callAmount <= totalPot * 0.3) {
          return { action: 'call' };
        }
      }
    }
    
    // Mix in some check-raises when out of position against aggressive players
    if (callAmount === 0 && handStrength > 0.4 && Math.random() < 0.2) {
      return { action: 'check' }; // Set up for check-raise
    }
    
    // Default to standard play with adjustments
    if (handStrength > 0.6 - params.callTightness) {
      if (callAmount > 0) {
        const raiseChance = params.raiseMult * 1.2; // Slightly more aggressive
        if (Math.random() < raiseChance && currentBet < player.chips) {
          const raiseAmount = Math.min(currentBet * 2 + totalPot * 0.5, player.chips);
          return { action: 'raise', amount: Math.floor(raiseAmount) };
        }
        return { action: 'call' };
      } else {
        if (Math.random() < params.betNoBet * 1.3) {
          const betAmount = Math.min(Math.floor(totalPot * 0.6), player.chips);
          return { action: 'bet', amount: betAmount };
        }
        return { action: 'check' };
      }
    }
    
    // Otherwise play defensively
    if (callAmount > 0) {
      return { action: 'fold' };
    }
    return { action: 'check' };
  }
}

export const botAI = new BotAI();