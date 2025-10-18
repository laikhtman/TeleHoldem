import { Card, BotAction, Player, GameState } from '@shared/schema';
import { handEvaluator } from './handEvaluator';

export class BotAI {
  getAction(player: Player, gameState: GameState): BotAction {
    const { currentBet, phase, pot } = gameState;
    const callAmount = currentBet - player.bet;
    
    // Evaluate hand strength
    const handStrength = this.evaluateHandStrength(player.hand, gameState.communityCards);
    
    // Calculate pot odds
    const potOdds = callAmount > 0 ? callAmount / (pot + callAmount) : 0;
    
    // If there's no bet to call
    if (callAmount === 0) {
      // Strong hand - bet
      if (handStrength > 0.7) {
        const betAmount = Math.min(
          Math.floor(pot * 0.5 + Math.random() * pot * 0.3),
          player.chips
        );
        return { action: 'bet', amount: Math.max(betAmount, 20) };
      }
      // Medium hand - sometimes bet, sometimes check
      if (handStrength > 0.4) {
        if (Math.random() < 0.4) {
          const betAmount = Math.min(20 + Math.floor(Math.random() * 30), player.chips);
          return { action: 'bet', amount: betAmount };
        }
      }
      // Weak hand - mostly check
      return { action: 'check' };
    }
    
    // If there's a bet to call
    // Very strong hand - raise
    if (handStrength > 0.8) {
      const raiseAmount = Math.min(
        callAmount + Math.floor(pot * 0.4),
        player.chips
      );
      return { action: 'raise', amount: raiseAmount };
    }
    
    // Strong hand - call or raise
    if (handStrength > 0.6) {
      if (Math.random() < 0.7) {
        return { action: 'call', amount: callAmount };
      } else {
        const raiseAmount = Math.min(
          callAmount + Math.floor(pot * 0.3),
          player.chips
        );
        return { action: 'raise', amount: raiseAmount };
      }
    }
    
    // Medium hand - call if pot odds are good, otherwise fold
    if (handStrength > 0.35) {
      if (potOdds < 0.3 || callAmount < player.chips * 0.2) {
        return { action: 'call', amount: callAmount };
      }
      return { action: 'fold' };
    }
    
    // Weak hand - mostly fold, occasionally bluff
    if (Math.random() < 0.1 && phase === 'pre-flop') {
      return { action: 'call', amount: callAmount };
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
