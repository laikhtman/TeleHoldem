import { Card } from '@shared/schema';
import { handEvaluator } from './handEvaluator';

// Simplified win probability based on hand strength
export function calculateSimpleWinProbability(
  holeCards: Card[],
  communityCards: Card[] = [],
  numOpponents: number = 1
): number {
  if (!holeCards || holeCards.length !== 2) return 0;
  
  // Ensure communityCards is an array
  const safeCommCards = communityCards || [];
  
  // Evaluate current hand strength
  const evaluation = handEvaluator.evaluateHand(holeCards, safeCommCards);
  
  // Get base win probability based on hand rank
  const baseProb = getBaseWinProbability(evaluation.rank);
  
  // Adjust for number of opponents (each opponent reduces win probability)
  const adjustedProb = Math.pow(baseProb, numOpponents);
  
  // Adjust for number of community cards revealed
  const stageMultiplier = getStageMultiplier(safeCommCards.length);
  
  return Math.round(adjustedProb * stageMultiplier * 100);
}

function getBaseWinProbability(handRank: string): number {
  // Base win probabilities for each hand rank
  const probabilities: Record<string, number> = {
    'high-card': 0.17,
    'pair': 0.42,
    'two-pair': 0.64,
    'three-of-a-kind': 0.78,
    'straight': 0.85,
    'flush': 0.88,
    'full-house': 0.93,
    'four-of-a-kind': 0.98,
    'straight-flush': 0.99,
    'royal-flush': 0.99
  };
  
  return probabilities[handRank] || 0.5;
}

function getStageMultiplier(communityCardsCount: number): number {
  // Confidence increases as more cards are revealed
  switch (communityCardsCount) {
    case 0: return 0.7;  // Pre-flop
    case 3: return 0.85; // Flop
    case 4: return 0.95; // Turn
    case 5: return 1.0;  // River
    default: return 0.8;
  }
}

// Calculate pot equity for decision making
export function calculatePotEquity(
  winProbability: number,
  amountToCall: number,
  potSize: number
): { shouldCall: boolean; expectedValue: number } {
  const totalPot = potSize + amountToCall;
  const potOdds = amountToCall / totalPot;
  const equity = winProbability / 100;
  
  const expectedValue = (equity * totalPot) - amountToCall;
  const shouldCall = equity > potOdds;
  
  return { shouldCall, expectedValue };
}