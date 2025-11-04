import { Card, BotAction, Player, GameState, DifficultyLevel, DifficultySettings } from '@shared/schema';
import { handEvaluator } from './handEvaluator';

export class BotAI {
  private difficultySettings: DifficultySettings = {
    mode: 'normal',
    currentLevel: 'normal',
    multiplier: 1.0
  };

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

  private applyDifficultyMultiplier(value: number, type: 'error' | 'aggression' | 'tightness'): number {
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
        return value * multiplier;
        
      case 'tightness':
        // Higher difficulty = tighter, more selective play
        if (level === 'easy') return value * 0.8; // Looser play
        if (level === 'hard') return value * 1.2; // Tighter play
        if (level === 'expert') return value * 1.4; // Much tighter play
        return value;
    }
  }

  private paramsFor(personality: ReturnType<BotAI['getPersonality']>, humanWinRateAdj: number = 0) {
    // Base parameters with human win rate adjustment
    let params = { bluffBase: 0, raiseMult: 0, betNoBet: 0, callTightness: 0, mistakeChance: 0 };
    
    switch (personality) {
      case 'TAG': 
        params = { 
          bluffBase: 0.05 - humanWinRateAdj * 0.05, 
          raiseMult: 0.5 + humanWinRateAdj * 0.1, 
          betNoBet: 0.45 - humanWinRateAdj * 0.05, 
          callTightness: 0.35 + humanWinRateAdj * 0.05,
          mistakeChance: 0.05
        };
        break;
      case 'LAG': 
        params = { 
          bluffBase: 0.15 - humanWinRateAdj * 0.08, 
          raiseMult: 0.8 + humanWinRateAdj * 0.1, 
          betNoBet: 0.5 - humanWinRateAdj * 0.06, 
          callTightness: 0.25 + humanWinRateAdj * 0.04,
          mistakeChance: 0.08
        };
        break;
      case 'TP':  
        params = { 
          bluffBase: 0.03 - humanWinRateAdj * 0.03, 
          raiseMult: 0.35 + humanWinRateAdj * 0.08, 
          betNoBet: 0.3 - humanWinRateAdj * 0.04, 
          callTightness: 0.45 + humanWinRateAdj * 0.05,
          mistakeChance: 0.04
        };
        break;
      case 'LP':  
        params = { 
          bluffBase: 0.08 - humanWinRateAdj * 0.05, 
          raiseMult: 0.4 + humanWinRateAdj * 0.08, 
          betNoBet: 0.2 - humanWinRateAdj * 0.03, 
          callTightness: 0.5 + humanWinRateAdj * 0.05,
          mistakeChance: 0.06
        };
        break;
      default:    
        params = { 
          bluffBase: 0.1 - humanWinRateAdj * 0.06, 
          raiseMult: 0.6 + humanWinRateAdj * 0.1, 
          betNoBet: 0.4 - humanWinRateAdj * 0.05, 
          callTightness: 0.35 + humanWinRateAdj * 0.05,
          mistakeChance: 0.07
        };
    }
    
    // Apply difficulty modifiers
    params.bluffBase = this.applyDifficultyMultiplier(params.bluffBase, 'aggression');
    params.raiseMult = this.applyDifficultyMultiplier(params.raiseMult, 'aggression');
    params.betNoBet = this.applyDifficultyMultiplier(params.betNoBet, 'tightness');
    params.callTightness = this.applyDifficultyMultiplier(params.callTightness, 'tightness');
    params.mistakeChance = this.applyDifficultyMultiplier(params.mistakeChance, 'error');
    
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
    const potOdds = callAmount > 0 ? callAmount / (totalPot + callAmount) : 0;

    const personality = this.getPersonality(player);
    
    // Dynamic difficulty adjustment based on performance metrics
    let humanWinAdj = 0;
    if (gameState.performanceMetrics) {
      const winRate = gameState.performanceMetrics.winRate;
      // Adjust difficulty if in auto mode
      if (this.difficultySettings.mode === 'auto') {
        humanWinAdj = Math.max(-0.15, Math.min(0.15, (winRate - 0.5) * 0.3));
      }
    } else {
      // Fallback to simple win rate calculation
      const played = Math.max(1, gameState.sessionStats.handsPlayed);
      const humanWR = gameState.sessionStats.handsWonByPlayer / played;
      humanWinAdj = Math.max(-0.1, Math.min(0.1, (humanWR - 0.5)));
    }
    
    const p = this.paramsFor(personality, humanWinAdj);

    // Make random mistakes based on difficulty
    if (Math.random() < p.mistakeChance) {
      // Easy mode: more likely to fold or check when should bet
      // Expert mode: very rare mistakes
      const mistakeType = Math.random();
      if (this.difficultySettings.currentLevel === 'easy') {
        if (mistakeType < 0.3 && callAmount > 0) return { action: 'fold' };
        if (mistakeType < 0.6 && callAmount === 0) return { action: 'check' };
      } else if (this.difficultySettings.currentLevel === 'normal') {
        if (mistakeType < 0.15 && callAmount > 0 && handStrength < 0.4) return { action: 'fold' };
      }
      // Hard and Expert modes make very few mistakes
    }

    // Simple board texture analysis (dry boards → slightly higher bluffing)
    let boardDrynessAdj = 0;
    if (gameState.communityCards.length >= 3) {
      const texture = handEvaluator.evaluateBoardTexture(gameState.communityCards as any);
      if (texture) {
        if (!texture.isMonotone && !texture.isTwoTone && !texture.isConnected) {
          boardDrynessAdj = 0.035; // dry board
        } else if (texture.isMonotone || texture.isConnected) {
          boardDrynessAdj = -0.025; // wet/monotone
        }
      }
    }

    // Exploit human tendencies from recent action history (last 20)
    let exploitAdj = 0;
    if (this.difficultySettings.currentLevel === 'hard' || this.difficultySettings.currentLevel === 'expert') {
      const lastActions = gameState.actionHistory.slice(-20).filter(e => e.playerName === gameState.players[0]?.name && e.type === 'player-action');
      const humanAggression = lastActions.filter(e => e.action === 'bet' || e.action === 'raise').length / Math.max(1, lastActions.length);
      const humanPassive = lastActions.filter(e => e.action === 'check' || e.action === 'call').length / Math.max(1, lastActions.length);
      exploitAdj = (humanAggression - 0.5) * 0.05 - (humanPassive - 0.5) * 0.03; // slight tighten vs agg, slight loosen vs passive
      
      // Expert mode has better exploitation
      if (this.difficultySettings.currentLevel === 'expert') {
        exploitAdj *= 1.5;
      }
    }

    // Bluffing logic with personality, board, and exploit adjustment
    const isLatePosition = player.position >= players.length - 2;
    const bluffChance = (isLatePosition ? p.bluffBase + 0.05 : p.bluffBase) + boardDrynessAdj - exploitAdj;
    if (Math.random() < bluffChance && handStrength < 0.4) {
      const raiseAmount = Math.min(
        callAmount + Math.floor(totalPot * (p.raiseMult + Math.random() * 0.4)),
        player.chips
      );
      if (raiseAmount > callAmount) {
        return { action: 'raise', amount: raiseAmount };
      }
    }

    if (callAmount === 0) { // No bet to call
      if (handStrength > (0.65 + (p.callTightness - 0.35))) {
        const betAmount = Math.min(
          Math.floor(totalPot * (p.raiseMult + Math.random() * 0.25)),
          player.chips
        );
        return { action: 'bet', amount: Math.max(betAmount, 20) };
      }
      if (handStrength > p.betNoBet) {
        if (Math.random() < 0.5 + (personality === 'LAG' ? 0.2 : 0)) {
          const betAmount = Math.min(
            Math.floor(totalPot * (0.3 + Math.random() * 0.25)),
            player.chips
          );
          return { action: 'bet', amount: Math.max(betAmount, 20) };
        }
      }
      return { action: 'check' };
    }

    // Facing a bet
    if (handStrength > (0.8 + (personality === 'TP' ? 0.05 : 0))) {
      const raiseAmount = Math.min(
        callAmount + Math.floor(totalPot * (p.raiseMult + Math.random() * 0.5)),
        player.chips
      );
      return { action: 'raise', amount: raiseAmount };
    }

    if (handStrength > (0.55 + (personality === 'LP' ? 0.1 : 0) + exploitAdj)) {
      if (Math.random() < (0.7 + (personality === 'TP' ? 0.1 : 0) - exploitAdj)) {
        return { action: 'call', amount: callAmount };
      }
      const raiseAmount = Math.min(
        callAmount + Math.floor(totalPot * (0.35 + Math.random() * 0.25)),
        player.chips
      );
      return { action: 'raise', amount: raiseAmount };
    }

    // Adjust calling strategy based on number of players
    const requiredStrengthToCall = (0.3 + (activePlayers * 0.05)) + (personality === 'TAG' ? 0.05 : 0) + (personality === 'LP' ? -0.03 : 0);
    if (handStrength > requiredStrengthToCall) {
      if (potOdds < (0.4 + (personality === 'TP' ? -0.05 : 0))) { // Good pot odds
        return { action: 'call', amount: callAmount };
      }
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
}

export const botAI = new BotAI();