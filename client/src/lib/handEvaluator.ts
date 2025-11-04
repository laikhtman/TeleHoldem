import { Card, Rank, HandRank, getRankValue, Suit } from '@shared/schema';

interface HandResult {
  rank: HandRank;
  value: number;
  description: string;
  winningCards: Card[];
}

export interface DrawInfo {
  flushDraw?: {
    suit: Suit;
    outs: number;
  };
  straightDraw?: {
    type: 'open-ended' | 'gutshot';
    outs: number;
  };
}

export interface HandEvaluation {
  hand: HandResult;
  draws: DrawInfo;
}

export interface BoardTextureInfo {
  suits: Record<string, number>;
  isMonotone: boolean;
  isTwoTone: boolean;
  spread: number; // maxRank - minRank
  isConnected: boolean; // tight rank spread (<= 4)
  highCard: number;
  isDry: boolean; // Dry board (few draws possible)
  isWet: boolean; // Wet board (many draws possible)
  isPaired: boolean; // Board has a pair
  hasFlushDraw: boolean; // Board has flush draw potential
  hasStraightDraw: boolean; // Board has straight draw potential
  scaryCards: Card[]; // Cards that complete draws
  boardStrength: 'dry' | 'semi-dry' | 'semi-wet' | 'wet'; // Overall board texture
}

export class HandEvaluator {
  evaluateHand(hand: Card[], communityCards: Card[] = []): HandResult {
    const allCards = [...hand, ...(communityCards || [])];
    
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

  evaluateHandWithDraws(hand: Card[], communityCards: Card[]): HandEvaluation {
    const currentHand = this.evaluateHand(hand, communityCards);
    const draws = this.detectDraws(hand, communityCards);
    
    return {
      hand: currentHand,
      draws
    };
  }

  evaluateBoardTexture(communityCards: Card[]): BoardTextureInfo | null {
    if (!communityCards || communityCards.length < 3) return null;
    
    const suits = new Map<Suit, number>();
    const ranks = new Map<Rank, number>();
    let minRank = 14, maxRank = 2;
    
    // Count suits and ranks
    communityCards.forEach(c => {
      suits.set(c.suit, (suits.get(c.suit) || 0) + 1);
      ranks.set(c.rank, (ranks.get(c.rank) || 0) + 1);
      const rv = getRankValue(c.rank);
      minRank = Math.min(minRank, rv);
      maxRank = Math.max(maxRank, rv);
    });
    
    const spread = maxRank - minRank;
    const isConnected = spread <= 4;
    const suitCounts: Record<string, number> = {};
    Array.from(suits.entries()).forEach(([s, cnt]) => suitCounts[s] = cnt);
    
    // Check for monotone (3+ of same suit) and two-tone (2 of same suit)
    const isMonotone = Object.values(suitCounts).some(v => v >= 3);
    const isTwoTone = Object.values(suitCounts).some(v => v === 2);
    const hasFlushDraw = isMonotone || isTwoTone;
    
    // Check if board is paired
    const isPaired = Array.from(ranks.values()).some(count => count >= 2);
    
    // Check for straight draw potential
    const hasStraightDraw = this.checkStraightPotential(communityCards);
    
    // Identify scary cards (high cards, flush/straight completers)
    const scaryCards = this.identifyScaryCards(communityCards);
    
    // Determine overall board texture
    let wetScore = 0;
    if (isMonotone) wetScore += 3;
    if (isTwoTone) wetScore += 1;
    if (isConnected) wetScore += 2;
    if (hasStraightDraw) wetScore += 1;
    if (isPaired) wetScore -= 1; // Paired boards are typically drier
    if (maxRank <= 10) wetScore -= 1; // Low boards are drier
    
    let boardStrength: 'dry' | 'semi-dry' | 'semi-wet' | 'wet';
    if (wetScore <= 1) boardStrength = 'dry';
    else if (wetScore <= 3) boardStrength = 'semi-dry';
    else if (wetScore <= 5) boardStrength = 'semi-wet';
    else boardStrength = 'wet';
    
    const isDry = boardStrength === 'dry' || boardStrength === 'semi-dry';
    const isWet = boardStrength === 'wet' || boardStrength === 'semi-wet';
    
    return {
      suits: suitCounts,
      isMonotone,
      isTwoTone,
      spread,
      isConnected,
      highCard: maxRank,
      isDry,
      isWet,
      isPaired,
      hasFlushDraw,
      hasStraightDraw,
      scaryCards,
      boardStrength
    };
  }
  
  private checkStraightPotential(cards: Card[]): boolean {
    if (cards.length < 3) return false;
    
    const rankValues = cards.map(c => getRankValue(c.rank));
    const uniqueRanks = Array.from(new Set(rankValues)).sort((a, b) => a - b);
    
    // Check for connected cards (3+ cards within a 4-rank spread)
    for (let i = 0; i < uniqueRanks.length - 2; i++) {
      if (uniqueRanks[i + 2] - uniqueRanks[i] <= 4) {
        return true;
      }
    }
    
    // Check for wheel potential (A-2-3-4-5)
    const hasAce = uniqueRanks.includes(14);
    const hasLowCards = uniqueRanks.filter(r => r <= 5).length >= 2;
    if (hasAce && hasLowCards) return true;
    
    return false;
  }
  
  private identifyScaryCards(communityCards: Card[]): Card[] {
    const scaryCards: Card[] = [];
    
    // High cards (K, A) are scary
    communityCards.forEach(card => {
      const rankValue = getRankValue(card.rank);
      if (rankValue >= 13) { // King or Ace
        scaryCards.push(card);
      }
    });
    
    // Cards that complete obvious draws
    if (communityCards.length >= 4) {
      const lastCard = communityCards[communityCards.length - 1];
      const previousCards = communityCards.slice(0, -1);
      
      // Check if last card completes flush
      const suitCount = previousCards.filter(c => c.suit === lastCard.suit).length;
      if (suitCount >= 2) {
        scaryCards.push(lastCard);
      }
      
      // Check if last card completes straight
      const prevRanks = previousCards.map(c => getRankValue(c.rank));
      const lastRankValue = getRankValue(lastCard.rank);
      if (this.couldCompleteStraight(prevRanks, lastRankValue)) {
        if (!scaryCards.includes(lastCard)) {
          scaryCards.push(lastCard);
        }
      }
    }
    
    return scaryCards;
  }
  
  private couldCompleteStraight(existingRanks: number[], newRank: number): boolean {
    const allRanks = [...existingRanks, newRank].sort((a, b) => a - b);
    
    // Check if adding this rank creates 4+ cards within a 4-rank spread
    for (let i = 0; i <= allRanks.length - 4; i++) {
      if (allRanks[i + 3] - allRanks[i] <= 4) {
        return true;
      }
    }
    
    return false;
  }

  private detectDraws(hand: Card[], communityCards: Card[]): DrawInfo {
    const allCards = [...hand, ...communityCards];
    const draws: DrawInfo = {};

    const flushDraw = this.detectFlushDraw(allCards);
    if (flushDraw) {
      draws.flushDraw = flushDraw;
    }

    const straightDraw = this.detectStraightDraw(allCards);
    if (straightDraw) {
      draws.straightDraw = straightDraw;
    }

    return draws;
  }

  private detectFlushDraw(cards: Card[]): { suit: Suit; outs: number } | null {
    const suitCounts = new Map<Suit, number>();
    
    cards.forEach(card => {
      suitCounts.set(card.suit, (suitCounts.get(card.suit) || 0) + 1);
    });

    for (const [suit, count] of Array.from(suitCounts.entries())) {
      if (count === 4) {
        return { suit, outs: 9 };
      }
    }

    return null;
  }

  private detectStraightDraw(cards: Card[]): { type: 'open-ended' | 'gutshot'; outs: number } | null {
    const rankValues = cards.map(c => getRankValue(c.rank));
    const uniqueRankValues = Array.from(new Set(rankValues)).sort((a, b) => b - a);

    if (uniqueRankValues.includes(14)) {
      const wheelValues = [14, 5, 4, 3, 2];
      const wheelCount = wheelValues.filter(v => uniqueRankValues.includes(v)).length;
      if (wheelCount === 4) {
        return { type: 'open-ended', outs: 8 };
      }
    }

    for (let i = 0; i <= uniqueRankValues.length - 4; i++) {
      const fourCards = uniqueRankValues.slice(i, i + 4);
      if (this.isConsecutive(fourCards)) {
        return { type: 'open-ended', outs: 8 };
      }
    }

    for (let i = 0; i <= uniqueRankValues.length - 3; i++) {
      for (let j = i + 1; j <= uniqueRankValues.length - 2; j++) {
        for (let k = j + 1; k <= uniqueRankValues.length - 1; k++) {
          for (let l = k + 1; l <= uniqueRankValues.length; l++) {
            const fourCards = [
              uniqueRankValues[i],
              uniqueRankValues[j],
              uniqueRankValues[k],
              uniqueRankValues[l]
            ].sort((a, b) => b - a);

            if (fourCards[0] - fourCards[3] === 4 && this.hasGap(fourCards)) {
              return { type: 'gutshot', outs: 4 };
            }
          }
        }
      }
    }

    return null;
  }

  private isConsecutive(values: number[]): boolean {
    for (let i = 0; i < values.length - 1; i++) {
      if (values[i] - values[i + 1] !== 1) {
        return false;
      }
    }
    return true;
  }

  private hasGap(values: number[]): boolean {
    for (let i = 0; i < values.length - 1; i++) {
      if (values[i] - values[i + 1] > 1) {
        return true;
      }
    }
    return false;
  }
}

export const handEvaluator = new HandEvaluator();
