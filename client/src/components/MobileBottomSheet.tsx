import { useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { TrendingUp, History, BarChart3 } from 'lucide-react';
import { MobileStatsCompact } from './MobileStatsCompact';
import { SessionStats } from './SessionStats';
import { ActionHistory } from './ActionHistory';
import { HandDistributionChart } from './HandDistributionChart';
import { AchievementsList } from './AchievementsList';
import { GameState } from '@shared/schema';

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
        
        <Tabs defaultValue="essential" className="mt-4 h-[calc(100%-4rem)] overflow-hidden">
          <TabsList className="grid w-full grid-cols-3 mb-4 h-11" aria-label="Game information tabs">
            <TabsTrigger 
              value="essential" 
              data-testid="tab-essential" 
              className="text-sm min-h-11"
              aria-label="Essential stats tab"
            >
              <TrendingUp className="w-4 h-4 mr-1.5" aria-hidden="true" />
              Essential
            </TabsTrigger>
            <TabsTrigger 
              value="detailed" 
              data-testid="tab-detailed" 
              className="text-sm min-h-11"
              aria-label="Detailed stats and achievements tab"
            >
              <BarChart3 className="w-4 h-4 mr-1.5" aria-hidden="true" />
              Detailed
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              data-testid="tab-history" 
              className="text-sm min-h-11"
              aria-label="Action history tab"
            >
              <History className="w-4 h-4 mr-1.5" aria-hidden="true" />
              History
            </TabsTrigger>
          </TabsList>
          
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
