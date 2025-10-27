import { useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { TrendingUp, History, BarChart3, Activity } from 'lucide-react';
import { MobileStatsCompact } from './MobileStatsCompact';
import { SessionStats } from './SessionStats';
import { ActionHistory } from './ActionHistory';
import { HandDistributionChart } from './HandDistributionChart';
import { AchievementsList } from './AchievementsList';
import { HandStrengthIndicator } from './HandStrengthIndicator';
import { PotOddsDisplay } from './PotOddsDisplay';
import { GameState } from '@shared/schema';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Calculator, HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface MobileBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameState: GameState | null;
}

export function MobileBottomSheet({ 
  open, 
  onOpenChange, 
  gameState 
}: MobileBottomSheetProps) {
  const touchStartY = useRef<number>(0);
  const touchEndY = useRef<number>(0);
  const [handStrengthOpen, setHandStrengthOpen] = useState(true);
  const [potOddsOpen, setPotOddsOpen] = useState(true);
  const [helperOpen, setHelperOpen] = useState(true);

  const handleHeaderTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchEndY.current = e.touches[0].clientY;
  };

  const handleHeaderTouchMove = (e: React.TouchEvent) => {
    touchEndY.current = e.touches[0].clientY;
    const deltaY = touchEndY.current - touchStartY.current;
    
    if (deltaY > 0) {
      e.preventDefault();
    }
  };

  const handleHeaderTouchEnd = () => {
    const deltaY = touchEndY.current - touchStartY.current;
    
    if (deltaY > 80) {
      onOpenChange(false);
    }
    
    touchStartY.current = 0;
    touchEndY.current = 0;
  };

  const currentChips = gameState?.players[0]?.chips || 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-[calc(var(--safe-area-bottom)+5.5rem)] right-[calc(1rem+var(--safe-area-right))] z-50 h-14 w-14 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 xs:flex lg:hidden"
          data-testid="button-mobile-menu"
        >
          <TrendingUp className="w-6 h-6" />
        </Button>
      </SheetTrigger>
      
      <SheetContent 
        side="bottom" 
        className="h-[75vh] max-h-[75vh] rounded-t-3xl pb-[var(--safe-area-bottom)] z-[100] overflow-hidden"
        data-testid="mobile-bottom-sheet"
        aria-label="Game information panel"
        aria-describedby="mobile-sheet-description"
      >
        <div 
          className="absolute top-0 left-0 right-0 h-16 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
          onTouchStart={handleHeaderTouchStart}
          onTouchMove={handleHeaderTouchMove}
          onTouchEnd={handleHeaderTouchEnd}
          data-testid="swipe-area"
          role="button"
          aria-label="Swipe down to close panel"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Escape' || e.key === 'ArrowDown') {
              onOpenChange(false);
            }
          }}
        >
          <div 
            className="w-12 h-1.5 bg-muted-foreground/30 rounded-full"
            data-testid="swipe-handle"
            aria-hidden="true"
          />
        </div>
        
        <SheetHeader className="mt-2">
          <SheetTitle className="text-center" id="mobile-sheet-description">Game Info</SheetTitle>
        </SheetHeader>
        
        <Tabs defaultValue="hand-analysis" className="mt-4 h-[calc(100%-4rem)] overflow-hidden">
          <TabsList className="grid w-full grid-cols-4 mb-4 h-11" aria-label="Game information tabs">
            <TabsTrigger 
              value="hand-analysis" 
              data-testid="tab-hand-analysis" 
              className="text-xs sm:text-sm min-h-11 px-2"
              aria-label="Hand analysis tab"
            >
              <Activity className="w-3.5 h-3.5 mr-1 sm:w-4 sm:h-4 sm:mr-1.5" aria-hidden="true" />
              <span className="truncate">Analysis</span>
            </TabsTrigger>
            <TabsTrigger 
              value="essential" 
              data-testid="tab-essential" 
              className="text-xs sm:text-sm min-h-11 px-2"
              aria-label="Essential stats tab"
            >
              <TrendingUp className="w-3.5 h-3.5 mr-1 sm:w-4 sm:h-4 sm:mr-1.5" aria-hidden="true" />
              <span className="truncate">Stats</span>
            </TabsTrigger>
            <TabsTrigger 
              value="detailed" 
              data-testid="tab-detailed" 
              className="text-xs sm:text-sm min-h-11 px-2"
              aria-label="Detailed stats and achievements tab"
            >
              <BarChart3 className="w-3.5 h-3.5 mr-1 sm:w-4 sm:h-4 sm:mr-1.5" aria-hidden="true" />
              <span className="truncate">Detail</span>
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              data-testid="tab-history" 
              className="text-xs sm:text-sm min-h-11 px-2"
              aria-label="Action history tab"
            >
              <History className="w-3.5 h-3.5 mr-1 sm:w-4 sm:h-4 sm:mr-1.5" aria-hidden="true" />
              <span className="truncate">History</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="hand-analysis" className="h-[calc(100%-3.5rem)] overflow-y-auto mt-0 px-3">
            <div className="space-y-4 pb-4">
              {gameState && (
                <>
                  {/* Hand Strength Section */}
                  <Collapsible open={handStrengthOpen} onOpenChange={setHandStrengthOpen}>
                    <CollapsibleTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-between p-3 h-auto hover-elevate"
                        data-testid="button-toggle-hand-strength-mobile"
                      >
                        <div className="flex items-center gap-2">
                          {handStrengthOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          <span className="font-medium">Current Hand</span>
                        </div>
                        {gameState.currentPlayerIndex === 0 && (
                          <Badge variant="secondary" className="animate-pulse">Your Turn</Badge>
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-2">
                      {gameState.players[0].hand && gameState.players[0].hand.length > 0 ? (
                        <HandStrengthIndicator
                          hand={gameState.players[0].hand}
                          communityCards={gameState.communityCards}
                        />
                      ) : (
                        <div className="text-sm text-muted-foreground text-center py-4">
                          Waiting for cards...
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                  
                  {/* Pot Odds Section */}
                  <Collapsible open={potOddsOpen} onOpenChange={setPotOddsOpen}>
                    <CollapsibleTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-between p-3 h-auto hover-elevate"
                        data-testid="button-toggle-pot-odds-mobile"
                      >
                        <div className="flex items-center gap-2">
                          {potOddsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          <Calculator className="w-4 h-4" />
                          <span className="font-medium">Pot Odds</span>
                        </div>
                        {gameState.pots.length > 0 && (
                          <Badge variant="outline">${gameState.pots.reduce((total, pot) => total + pot.amount, 0)}</Badge>
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-2">
                      <PotOddsDisplay 
                        amountToCall={Math.max(0, gameState.currentBet - gameState.players[0].bet)}
                        potSize={gameState.pots.reduce((total, pot) => total + pot.amount, 0)}
                        playerCards={gameState.players[0].hand}
                        communityCards={gameState.communityCards}
                        numOpponents={gameState.players.filter(p => !p.folded && p.id !== gameState.players[0].id).length}
                      />
                    </CollapsibleContent>
                  </Collapsible>
                  
                  {/* Quick Stats */}
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Stack:</span>
                        <span className="ml-2 font-mono font-semibold">
                          ${gameState.players[0].chips}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">To Call:</span>
                        <span className="ml-2 font-mono font-semibold">
                          ${Math.max(0, gameState.currentBet - gameState.players[0].bet)}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="essential" className="h-[calc(100%-3.5rem)] overflow-y-auto mt-0 px-1">
            <div className="pb-4">
              {gameState && (
                <MobileStatsCompact 
                  stats={gameState.sessionStats} 
                  currentChips={currentChips}
                />
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="detailed" className="h-[calc(100%-3.5rem)] overflow-y-auto mt-0 px-1">
            <div className="space-y-6 pb-4">
              {gameState && (
                <>
                  <SessionStats stats={gameState.sessionStats} />
                  <HandDistributionChart data={gameState.sessionStats.handDistribution} />
                  <AchievementsList achievements={gameState.achievements} />
                </>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="history" className="h-[calc(100%-3.5rem)] overflow-y-auto mt-0 px-1">
            {gameState && <ActionHistory history={gameState.actionHistory} />}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
