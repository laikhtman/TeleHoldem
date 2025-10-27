import { Card, GameState } from '@shared/schema';
import { HandStrengthIndicator } from '@/components/HandStrengthIndicator';
import { PotOddsDisplay } from '@/components/PotOddsDisplay';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, TrendingUp, Calculator, HelpCircle, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface HandStrengthPanelProps {
  gameState: GameState | null;
  isTablet?: boolean;
  onClose?: () => void;
}

interface DecisionHelperProps {
  gameState: GameState;
}

function DecisionHelper({ gameState }: DecisionHelperProps) {
  const player = gameState.players[0];
  const potSize = gameState.pot;
  const toCall = gameState.currentBet - player.bet;
  const stackSize = player.chips;
  
  // Calculate pot odds
  const potOdds = toCall > 0 ? (toCall / (potSize + toCall)) * 100 : 0;
  
  // Simple decision logic based on position and stack size
  const getAdvice = () => {
    if (!player.hand || player.hand.length === 0) return null;
    
    const suggestions = [];
    
    // Stack size considerations
    const stackToPotRatio = potSize > 0 ? stackSize / potSize : Infinity;
    if (stackToPotRatio < 1) {
      suggestions.push({
        type: 'warning' as const,
        text: 'Short stack - consider going all-in with strong hands'
      });
    }
    
    // Position advice
    if (gameState.dealerIndex === 0) {
      suggestions.push({
        type: 'info' as const,
        text: 'You have position (dealer) - can play more hands'
      });
    } else if ((gameState.dealerIndex + 1) % gameState.players.length === 0) {
      suggestions.push({
        type: 'caution' as const,
        text: 'Small blind - be selective with hands'
      });
    }
    
    // Pot odds advice
    if (toCall > 0 && potOdds < 20) {
      suggestions.push({
        type: 'positive' as const,
        text: `Good pot odds (${potOdds.toFixed(1)}%) - consider calling with draws`
      });
    } else if (toCall > 0 && potOdds > 40) {
      suggestions.push({
        type: 'caution' as const,
        text: `Poor pot odds (${potOdds.toFixed(1)}%) - only continue with strong hands`
      });
    }
    
    // Phase-specific advice
    if (gameState.phase === 'pre-flop') {
      if (gameState.currentBet > gameState.bigBlind * 3) {
        suggestions.push({
          type: 'warning' as const,
          text: 'Large pre-flop raise - proceed with caution'
        });
      }
    } else if (gameState.phase === 'river') {
      suggestions.push({
        type: 'info' as const,
        text: 'River - no more cards coming, bet for value or bluff'
      });
    }
    
    return suggestions;
  };
  
  const advice = getAdvice();
  
  if (!advice || advice.length === 0) return null;
  
  const getAdviceColor = (type: string) => {
    switch(type) {
      case 'positive': return 'text-green-600 dark:text-green-400';
      case 'warning': return 'text-yellow-600 dark:text-yellow-400';
      case 'caution': return 'text-orange-600 dark:text-orange-400';
      default: return 'text-blue-600 dark:text-blue-400';
    }
  };
  
  return (
    <div className="space-y-2">
      {advice.map((item, index) => (
        <div 
          key={index}
          className={cn(
            "text-sm p-2 rounded-md bg-muted/50",
            getAdviceColor(item.type)
          )}
        >
          {item.text}
        </div>
      ))}
    </div>
  );
}

export function HandStrengthPanel({ 
  gameState, 
  isTablet = false,
  onClose 
}: HandStrengthPanelProps) {
  const [handStrengthOpen, setHandStrengthOpen] = useState(true);
  const [potOddsOpen, setPotOddsOpen] = useState(true);
  const [helperOpen, setHelperOpen] = useState(true);
  
  if (!gameState) return null;
  
  const player = gameState.players[0];
  const hasCards = player.hand && player.hand.length > 0;
  const isPlayerTurn = gameState.currentPlayerIndex === 0;
  
  const content = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Hand Analysis</h2>
        </div>
        {isTablet && onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
            data-testid="button-close-panel"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {/* Hand Strength Section */}
          <Collapsible 
            open={handStrengthOpen} 
            onOpenChange={setHandStrengthOpen}
          >
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-between p-2 h-auto hover-elevate"
                data-testid="button-toggle-hand-strength"
              >
                <div className="flex items-center gap-2">
                  {handStrengthOpen ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  <span className="font-medium">Current Hand</span>
                </div>
                {isPlayerTurn && (
                  <Badge variant="secondary" className="animate-pulse">
                    Your Turn
                  </Badge>
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              {hasCards ? (
                <HandStrengthIndicator
                  hand={player.hand}
                  communityCards={gameState.communityCards}
                />
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  Waiting for cards...
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
          
          <Separator />
          
          {/* Pot Odds Section */}
          <Collapsible 
            open={potOddsOpen} 
            onOpenChange={setPotOddsOpen}
          >
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-between p-2 h-auto hover-elevate"
                data-testid="button-toggle-pot-odds"
              >
                <div className="flex items-center gap-2">
                  {potOddsOpen ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  <Calculator className="w-4 h-4" />
                  <span className="font-medium">Pot Odds</span>
                </div>
                {gameState.pot > 0 && (
                  <Badge variant="outline">
                    ${gameState.pot}
                  </Badge>
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <PotOddsDisplay gameState={gameState} />
            </CollapsibleContent>
          </Collapsible>
          
          <Separator />
          
          {/* Decision Helper Section */}
          <Collapsible 
            open={helperOpen} 
            onOpenChange={setHelperOpen}
          >
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-between p-2 h-auto hover-elevate"
                data-testid="button-toggle-helper"
              >
                <div className="flex items-center gap-2">
                  {helperOpen ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  <HelpCircle className="w-4 h-4" />
                  <span className="font-medium">Decision Helper</span>
                </div>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              {hasCards && gameState.pot > 0 ? (
                <DecisionHelper gameState={gameState} />
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  Helper will be available when hand starts
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>
      
      {/* Footer with quick stats */}
      <div className="p-4 border-t bg-muted/30">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Stack:</span>
            <span className="ml-2 font-mono font-semibold">
              ${player.chips}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">To Call:</span>
            <span className="ml-2 font-mono font-semibold">
              ${Math.max(0, gameState.currentBet - player.bet)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
  
  // For tablet overlay
  if (isTablet) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ x: -320 }}
          animate={{ x: 0 }}
          exit={{ x: -320 }}
          transition={{ type: 'spring', damping: 25 }}
          className="fixed left-0 top-0 h-full w-80 bg-background border-r shadow-xl z-50"
          data-testid="hand-strength-panel-tablet"
        >
          {content}
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black z-40"
          onClick={onClose}
          data-testid="panel-backdrop"
        />
      </AnimatePresence>
    );
  }
  
  // Desktop sidebar
  return (
    <div className="h-full bg-background border-r" data-testid="hand-strength-panel-desktop">
      {content}
    </div>
  );
}