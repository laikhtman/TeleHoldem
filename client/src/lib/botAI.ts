import { Card, BotAction, Player, GameState } from '@shared/schema';
import { handEvaluator } from './handEvaluator';

export class BotAI {
  private getPersonality(player: Player): 'TAG' | 'LAG' | 'TP' | 'LP' | 'BAL' {
    if (player.isHuman) return 'BAL';
    const idx = parseInt(player.id, 10) || 0;
    const personalities: Array<'TAG' | 'LAG' | 'TP' | 'LP' | 'BAL'> = ['TAG', 'LAG', 'TP', 'LP', 'BAL'];
    return personalities[idx % personalities.length];
  }

  private paramsFor(personality: ReturnType<BotAI['getPersonality']>, humanWinRateAdj: number = 0) {
    // humanWinRateAdj in [-0.1, 0.1], positive when human winning often
    switch (personality) {
      case 'TAG': return { bluffBase: 0.05 - humanWinRateAdj * 0.05, raiseMult: 0.5 + humanWinRateAdj * 0.1, betNoBet: 0.45 - humanWinRateAdj * 0.05, callTightness: 0.35 + humanWinRateAdj * 0.05 };
      case 'LAG': return { bluffBase: 0.15 - humanWinRateAdj * 0.08, raiseMult: 0.8 + humanWinRateAdj * 0.1, betNoBet: 0.5 - humanWinRateAdj * 0.06, callTightness: 0.25 + humanWinRateAdj * 0.04 };
      case 'TP':  return { bluffBase: 0.03 - humanWinRateAdj * 0.03, raiseMult: 0.35 + humanWinRateAdj * 0.08, betNoBet: 0.3 - humanWinRateAdj * 0.04, callTightness: 0.45 + humanWinRateAdj * 0.05 };
      case 'LP':  return { bluffBase: 0.08 - humanWinRateAdj * 0.05, raiseMult: 0.4 + humanWinRateAdj * 0.08, betNoBet: 0.2 - humanWinRateAdj * 0.03, callTightness: 0.5 + humanWinRateAdj * 0.05 };
      default:    return { bluffBase: 0.1  - humanWinRateAdj * 0.06, raiseMult: 0.6 + humanWinRateAdj * 0.1, betNoBet: 0.4 - humanWinRateAdj * 0.05, callTightness: 0.35 + humanWinRateAdj * 0.05 };
    }
  }
  getAction(player: Player, gameState: GameState): BotAction {
    const { currentBet, phase, pots, players } = gameState;
    const totalPot = pots.reduce((acc, pot) => acc + pot.amount, 0);
    const callAmount = currentBet - player.bet;
    const activePlayers = players.filter(p => !p.folded).length;

    const handStrength = this.evaluateHandStrength(player.hand, gameState.communityCards);
    const potOdds = callAmount > 0 ? callAmount / (totalPot + callAmount) : 0;

    const personality = this.getPersonality(player);
    // Rubber-band difficulty based on human win rate
    const played = Math.max(1, gameState.sessionStats.handsPlayed);
    const humanWR = gameState.sessionStats.handsWonByPlayer / played;
    const humanWinAdj = Math.max(-0.1, Math.min(0.1, (humanWR - 0.5))); // clamp [-0.1, 0.1]
    const p = this.paramsFor(personality, humanWinAdj);

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
    const lastActions = gameState.actionHistory.slice(-20).filter(e => e.playerName === gameState.players[0]?.name && e.type === 'player-action');
    const humanAggression = lastActions.filter(e => e.action === 'bet' || e.action === 'raise').length / Math.max(1, lastActions.length);
    const humanPassive = lastActions.filter(e => e.action === 'check' || e.action === 'call').length / Math.max(1, lastActions.length);
    const exploitAdj = (humanAggression - 0.5) * 0.05 - (humanPassive - 0.5) * 0.03; // slight tighten vs agg, slight loosen vs passive

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
