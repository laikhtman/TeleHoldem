import { Card, Rank, Suit } from '@shared/schema';
import { handEvaluator, HandEvaluation } from './handEvaluator';

// Monte Carlo simulation for calculating win probability
export function calculateWinProbability(
  holeCards: Card[],
  communityCards: Card[],
  numOpponents: number = 1,
  simulations: number = 100
): number {
  if (holeCards.length !== 2) return 0;
  
  // If all community cards are revealed, do exact calculation
  if (communityCards.length === 5) {
    return calculateExactWinProbability(holeCards, communityCards, numOpponents);
  }
  
  // Run Monte Carlo simulation for incomplete boards
  let wins = 0;
  let ties = 0;
  
  for (let i = 0; i < simulations; i++) {
    const result = simulateHand(holeCards, communityCards, numOpponents);
    if (result === 'win') wins++;
    else if (result === 'tie') ties++;
  }
  
  // Count ties as half wins
  return ((wins + ties * 0.5) / simulations) * 100;
}

function calculateExactWinProbability(
  holeCards: Card[],
  communityCards: Card[],
  numOpponents: number
): number {
  const playerEval = handEvaluator.evaluateHand([...holeCards, ...communityCards]);
  
  // Simplified calculation for complete board
  // In reality, this would calculate all possible opponent hands
  // For now, estimate based on hand strength
  const handStrengthMultiplier = getHandStrengthMultiplier(playerEval.hand.rank);
  const baseWinRate = handStrengthMultiplier;
  
  // Adjust for number of opponents
  // Each opponent reduces win probability
  const adjustedWinRate = Math.pow(baseWinRate, numOpponents);
  
  return adjustedWinRate * 100;
}

function simulateHand(
  holeCards: Card[],
  communityCards: Card[],
  numOpponents: number
): 'win' | 'lose' | 'tie' {
  // Create a deck without known cards
  const knownCards = [...holeCards, ...communityCards];
  const deck = createDeck().filter(card => 
    !knownCards.some(known => known.suit === card.suit && known.rank === card.rank)
  );
  
  // Shuffle deck for simulation
  const shuffled = shuffle([...deck]);
  
  // Deal remaining community cards
  const remainingCommunity = 5 - communityCards.length;
  const simulatedCommunity = [...communityCards];
  for (let i = 0; i < remainingCommunity; i++) {
    simulatedCommunity.push(shuffled.pop()!);
  }
  
  // Evaluate player hand
  const playerEval = evaluateHand([...holeCards, ...simulatedCommunity]);
  
  // Simulate opponent hands
  let bestOpponentScore = 0;
  for (let i = 0; i < numOpponents; i++) {
    const opponentHole = [shuffled.pop()!, shuffled.pop()!];
    const opponentEval = evaluateHand([...opponentHole, ...simulatedCommunity]);
    bestOpponentScore = Math.max(bestOpponentScore, getHandScore(opponentEval));
  }
  
  const playerScore = getHandScore(playerEval);
  
  if (playerScore > bestOpponentScore) return 'win';
  if (playerScore < bestOpponentScore) return 'lose';
  return 'tie';
}

function getHandScore(evaluation: HandEvaluation): number {
  // Convert hand evaluation to a comparable score
  // Higher rank = higher base score
  const baseScore = evaluation.rank * 1000000;
  
  // Add kicker values for tie-breaking
  let kickerScore = 0;
  evaluation.kickers.forEach((kicker, index) => {
    kickerScore += kicker * Math.pow(14, 4 - index);
  });
  
  return baseScore + kickerScore;
}

function getHandStrengthMultiplier(rank: number): number {
  // Estimate win probability based on hand rank
  const multipliers = [
    0.05,  // High Card
    0.15,  // One Pair
    0.35,  // Two Pair
    0.50,  // Three of a Kind
    0.60,  // Straight
    0.70,  // Flush
    0.80,  // Full House
    0.90,  // Four of a Kind
    0.95,  // Straight Flush
  ];
  
  return multipliers[rank] || 0.5;
}

function createDeck(): Card[] {
  const suits: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: Card['rank'][] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
  const deck: Card[] = [];
  
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank });
    }
  }
  
  return deck;
}

function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Calculate equity against a range of hands
export function calculateEquityVsRange(
  holeCards: Card[],
  communityCards: Card[],
  opponentRange: string = 'average' // 'tight', 'average', 'loose'
): number {
  // Simplified equity calculation
  // In a full implementation, this would consider specific hand ranges
  const baseWinProb = calculateWinProbability(holeCards, communityCards, 1, 500);
  
  // Adjust based on opponent range
  const rangeMultipliers = {
    tight: 0.8,    // Tight players have stronger hands
    average: 1.0,  // Average range
    loose: 1.2,    // Loose players have weaker hands
  };
  
  const multiplier = rangeMultipliers[opponentRange as keyof typeof rangeMultipliers] || 1.0;
  return Math.min(100, baseWinProb * multiplier);
}