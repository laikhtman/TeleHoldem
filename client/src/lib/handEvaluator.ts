import { Card, Rank, HandRank, getRankValue } from '@shared/schema';

interface HandResult {
  rank: HandRank;
  value: number;
  description: string;
  winningCards: Card[];
}

export class HandEvaluator {
  evaluateHand(hand: Card[], communityCards: Card[]): HandResult {
    const allCards = [...hand, ...communityCards];
    
    // Get best 5-card combination
    const combinations = this.getCombinations(allCards, 5);
    let bestHand: HandResult = { rank: 'high-card', value: 0, description: 'High Card', winningCards: [] };
    
    for (const combo of combinations) {
      const result = this.evaluateFiveCards(combo);
      if (result.value > bestHand.value) {
        bestHand = result;
      }
    }
    
    return bestHand;
  }

  private getCombinations(arr: Card[], k: number): Card[][] {
    if (k === 1) return arr.map(card => [card]);
    const combinations: Card[][] = [];
    
    for (let i = 0; i <= arr.length - k; i++) {
      const head = arr[i];
      const tailCombos = this.getCombinations(arr.slice(i + 1), k - 1);
      for (const combo of tailCombos) {
        combinations.push([head, ...combo]);
      }
    }
    
    return combinations;
  }

  private evaluateFiveCards(cards: Card[]): HandResult {
    const ranks = cards.map(c => c.rank);
    const suits = cards.map(c => c.suit);
    const rankValues = ranks.map(r => getRankValue(r)).sort((a, b) => b - a);
    
    // Count occurrences
    const rankCounts = new Map<Rank, number>();
    ranks.forEach(rank => {
      rankCounts.set(rank, (rankCounts.get(rank) || 0) + 1);
    });
    
    const counts = Array.from(rankCounts.values()).sort((a, b) => b - a);
    const isFlush = suits.every(s => s === suits[0]);
    
    // Get unique rank values for straight detection
    const uniqueRankValues = Array.from(new Set(rankValues)).sort((a, b) => b - a);
    const straightResult = this.isStraight(uniqueRankValues);
    
    // Royal Flush  
    if (isFlush && straightResult.isStraight && straightResult.highCard === 14) {
      return { rank: 'royal-flush', value: 9000000, description: 'Royal Flush', winningCards: cards };
    }
    
    // Straight Flush
    if (isFlush && straightResult.isStraight) {
      return { rank: 'straight-flush', value: 8000000 + straightResult.highCard, description: 'Straight Flush', winningCards: cards };
    }
    
    // Four of a Kind
    if (counts[0] === 4) {
      const quadRank = Array.from(rankCounts.entries()).find(([_, count]) => count === 4)![0];
      const quadValue = getRankValue(quadRank);
      const kicker = uniqueRankValues.find(v => v !== quadValue) || 0;
      return { rank: 'four-of-a-kind', value: 7000000 + quadValue * 100 + kicker, description: 'Four of a Kind', winningCards: cards };
    }
    
    // Full House
    if (counts[0] === 3 && counts[1] === 2) {
      const tripRank = Array.from(rankCounts.entries()).find(([_, count]) => count === 3)![0];
      const pairRank = Array.from(rankCounts.entries()).find(([_, count]) => count === 2)![0];
      const tripValue = getRankValue(tripRank);
      const pairValue = getRankValue(pairRank);
      return { rank: 'full-house', value: 6000000 + tripValue * 100 + pairValue, description: `Full House, ${tripRank}s over ${pairRank}s`, winningCards: cards };
    }
    
    // Flush
    if (isFlush) {
      // Use weighted sum ensuring max value < 1,000,000
      const flushValue = uniqueRankValues.slice(0, 5).reduce((sum, val, idx) => sum + val * Math.pow(15, 4 - idx), 0);
      return { rank: 'flush', value: 5000000 + flushValue, description: 'Flush', winningCards: cards };
    }
    
    // Straight
    if (straightResult.isStraight) {
      return { rank: 'straight', value: 4000000 + straightResult.highCard, description: 'Straight', winningCards: cards };
    }
    
    // Three of a Kind
    if (counts[0] === 3) {
      const tripRank = Array.from(rankCounts.entries()).find(([_, count]) => count === 3)![0];
      const tripValue = getRankValue(tripRank);
      // Add top 2 kickers for tie-breaking  
      const kickers = uniqueRankValues.filter(v => v !== tripValue).slice(0, 2);
      const kickerValue = kickers.reduce((sum, val, idx) => sum + val * Math.pow(15, 1 - idx), 0);
      return { rank: 'three-of-a-kind', value: 3000000 + tripValue * 1000 + kickerValue, description: `Three ${tripRank}s`, winningCards: cards };
    }
    
    // Two Pair
    if (counts[0] === 2 && counts[1] === 2) {
      const pairRanks = Array.from(rankCounts.entries())
        .filter(([_, count]) => count === 2)
        .map(([rank, _]) => getRankValue(rank))
        .sort((a, b) => b - a);
      // Add kicker for tie-breaking
      const kicker = uniqueRankValues.find(v => v !== pairRanks[0] && v !== pairRanks[1]) || 0;
      return { rank: 'two-pair', value: 2000000 + pairRanks[0] * 1000 + pairRanks[1] * 50 + kicker, description: 'Two Pair', winningCards: cards };
    }
    
    // One Pair
    if (counts[0] === 2) {
      const pairRank = Array.from(rankCounts.entries()).find(([_, count]) => count === 2)![0];
      const pairValue = getRankValue(pairRank);
      // Add kicker values for tie-breaking
      const kickers = uniqueRankValues.filter(v => v !== pairValue).slice(0, 3);
      const kickerValue = kickers.reduce((sum, val, idx) => sum + val * Math.pow(15, 2 - idx), 0);
      return { rank: 'pair', value: 1000000 + pairValue * 10000 + kickerValue, description: `Pair of ${pairRank}s`, winningCards: cards };
    }
    
    // High Card
    const highCardValue = uniqueRankValues.slice(0, 5).reduce((sum, val, idx) => sum + val * Math.pow(15, 4 - idx), 0);
    return { rank: 'high-card', value: highCardValue, description: `${ranks[0]} High`, winningCards: cards };
  }

  private isStraight(rankValues: number[]): { isStraight: boolean; highCard: number } {
    // Must have exactly 5 distinct ranks
    if (rankValues.length < 5) {
      return { isStraight: false, highCard: 0 };
    }

    // Check for wheel (A-2-3-4-5) - Ace acts as 1
    if (rankValues.length >= 5 &&
        rankValues[0] === 14 && rankValues[1] === 5 && 
        rankValues[2] === 4 && rankValues[3] === 3 && rankValues[4] === 2) {
      return { isStraight: true, highCard: 5 }; // Wheel has 5 as high card
    }

    // Check for regular straight (need exactly 5 consecutive values)
    const validStraight = rankValues.slice(0, 5).every((val, idx) => {
      if (idx === 0) return true;
      return rankValues[idx - 1] - val === 1;
    });

    if (validStraight) {
      return { isStraight: true, highCard: rankValues[0] };
    }

    return { isStraight: false, highCard: 0 };
  }

  // Simple hand strength evaluation for bot AI (0-1 scale)
  evaluateHandStrength(hand: Card[], communityCards: Card[]): number {
    const result = this.evaluateHand(hand, communityCards);
    
    // Normalize to 0-1 scale
    const maxValue = 9000000;
    const baseStrength = result.value / maxValue;
    
    // Add some randomness for unpredictability (±10%)
    const randomFactor = 0.9 + Math.random() * 0.2;
    return Math.min(1, baseStrength * randomFactor);
  }
}

export const handEvaluator = new HandEvaluator();
