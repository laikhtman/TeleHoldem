import { Card, BotAction, Player, GameState } from '@shared/schema';
import { handEvaluator } from './handEvaluator';

export class BotAI {
  getAction(player: Player, gameState: GameState): BotAction {
    const { currentBet, phase, pots, players } = gameState;
    const totalPot = pots.reduce((acc, pot) => acc + pot.amount, 0);
    const callAmount = currentBet - player.bet;
    const activePlayers = players.filter(p => !p.folded).length;

    const handStrength = this.evaluateHandStrength(player.hand, gameState.communityCards);
    const potOdds = callAmount > 0 ? callAmount / (totalPot + callAmount) : 0;

    // Bluffing logic
    const isLatePosition = player.position >= players.length - 2;
    const bluffChance = isLatePosition ? 0.15 : 0.05;
    if (Math.random() < bluffChance && handStrength < 0.4) {
      const raiseAmount = Math.min(
        callAmount + Math.floor(totalPot * (0.5 + Math.random() * 0.5)),
        player.chips
      );
      if (raiseAmount > callAmount) {
        return { action: 'raise', amount: raiseAmount };
      }
    }

    if (callAmount === 0) { // No bet to call
      if (handStrength > 0.7) {
        const betAmount = Math.min(
          Math.floor(totalPot * (0.4 + Math.random() * 0.3)),
          player.chips
        );
        return { action: 'bet', amount: Math.max(betAmount, 20) };
      }
      if (handStrength > 0.4) {
        if (Math.random() < 0.5) {
          const betAmount = Math.min(
            Math.floor(totalPot * (0.3 + Math.random() * 0.2)),
            player.chips
          );
          return { action: 'bet', amount: Math.max(betAmount, 20) };
        }
      }
      return { action: 'check' };
    }

    // Facing a bet
    if (handStrength > 0.85) {
      const raiseAmount = Math.min(
        callAmount + Math.floor(totalPot * (0.6 + Math.random() * 0.4)),
        player.chips
      );
      return { action: 'raise', amount: raiseAmount };
    }

    if (handStrength > 0.6) {
      if (Math.random() < 0.8) {
        return { action: 'call', amount: callAmount };
      }
      const raiseAmount = Math.min(
        callAmount + Math.floor(totalPot * (0.4 + Math.random() * 0.2)),
        player.chips
      );
      return { action: 'raise', amount: raiseAmount };
    }

    // Adjust calling strategy based on number of players
    const requiredStrengthToCall = 0.3 + (activePlayers * 0.05);
    if (handStrength > requiredStrengthToCall) {
      if (potOdds < 0.4) { // Good pot odds
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
