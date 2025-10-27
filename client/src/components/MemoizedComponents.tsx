import { memo } from 'react';
import { PlayerSeat as OriginalPlayerSeat } from './PlayerSeat';
import { CommunityCards as OriginalCommunityCards } from './CommunityCards';
import { ActionControls as OriginalActionControls } from './ActionControls';
import { PlayingCard as OriginalPlayingCard } from './PlayingCard';

// Memoized PlayerSeat - only re-renders when props actually change
export const PlayerSeat = memo(OriginalPlayerSeat, (prevProps, nextProps) => {
  return (
    prevProps.player.chips === nextProps.player.chips &&
    prevProps.player.bet === nextProps.player.bet &&
    prevProps.player.folded === nextProps.player.folded &&
    prevProps.player.allIn === nextProps.player.allIn &&
    prevProps.isCurrentPlayer === nextProps.isCurrentPlayer &&
    prevProps.isDealer === nextProps.isDealer &&
    prevProps.isWinner === nextProps.isWinner &&
    prevProps.phase === nextProps.phase &&
    prevProps.lastAction === nextProps.lastAction &&
    prevProps.winAmount === nextProps.winAmount &&
    prevProps.isProcessing === nextProps.isProcessing &&
    // Check if cards changed
    JSON.stringify(prevProps.player.hand) === JSON.stringify(nextProps.player.hand)
  );
});
PlayerSeat.displayName = 'MemoizedPlayerSeat';

// Memoized CommunityCards - only re-renders when cards change
export const CommunityCards = memo(OriginalCommunityCards, (prevProps, nextProps) => {
  return JSON.stringify(prevProps.cards) === JSON.stringify(nextProps.cards);
});
CommunityCards.displayName = 'MemoizedCommunityCards';

// Memoized ActionControls - prevent unnecessary re-renders
export const ActionControls = memo(OriginalActionControls, (prevProps, nextProps) => {
  return (
    prevProps.canCheck === nextProps.canCheck &&
    prevProps.minBet === nextProps.minBet &&
    prevProps.maxBet === nextProps.maxBet &&
    prevProps.amountToCall === nextProps.amountToCall &&
    prevProps.currentBet === nextProps.currentBet &&
    prevProps.minRaiseAmount === nextProps.minRaiseAmount &&
    prevProps.potSize === nextProps.potSize &&
    prevProps.playerChips === nextProps.playerChips &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.animationSpeed === nextProps.animationSpeed &&
    prevProps.playerFolded === nextProps.playerFolded
  );
});
ActionControls.displayName = 'MemoizedActionControls';

// Memoized PlayingCard - prevent re-renders when card doesn't change
export const PlayingCard = memo(OriginalPlayingCard, (prevProps, nextProps) => {
  return (
    prevProps.card?.id === nextProps.card?.id &&
    prevProps.faceDown === nextProps.faceDown &&
    prevProps.className === nextProps.className &&
    prevProps.animateFlip === nextProps.animateFlip &&
    prevProps.animateDeal === nextProps.animateDeal &&
    prevProps.dealDelay === nextProps.dealDelay &&
    prevProps.colorblindMode === nextProps.colorblindMode
  );
});
PlayingCard.displayName = 'MemoizedPlayingCard';