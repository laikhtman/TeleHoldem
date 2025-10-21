import { Card } from '@shared/schema';
import { handEvaluator } from './handEvaluator';

// Simplified win probability based on hand strength
export function calculateSimpleWinProbability(
  holeCards: Card[],
  communityCards: Card[],
  numOpponents: number = 1
): number {
  if (holeCards.length !== 2) return 0;
  
  // Evaluate current hand strength
  const allCards = [...holeCards, ...communityCards];
  const evaluation = handEvaluator.evaluateHand(allCards);
  
  // Get base win probability based on hand rank
  const baseProb = getBaseWinProbability(evaluation.hand.rank);
  
  // Adjust for number of opponents (each opponent reduces win probability)
  const adjustedProb = Math.pow(baseProb, numOpponents);
  
  // Adjust for number of community cards revealed
  const stageMultiplier = getStageMultiplier(communityCards.length);
  
  return Math.round(adjustedProb * stageMultiplier * 100);
}

function getBaseWinProbability(handRank: number): number {
  // Base win probabilities for each hand rank
  const probabilities = [
    0.17,  // 0: High Card
    0.42,  // 1: One Pair
    0.64,  // 2: Two Pair
    0.78,  // 3: Three of a Kind
    0.85,  // 4: Straight
    0.88,  // 5: Flush
    0.93,  // 6: Full House
    0.98,  // 7: Four of a Kind
    0.99,  // 8: Straight Flush
  ];
  
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