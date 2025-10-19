import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { TrendingUp, History } from 'lucide-react';
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
        className="h-[70vh] rounded-t-3xl pb-[var(--safe-area-bottom)]"
        data-testid="mobile-bottom-sheet"
      >
        <SheetHeader>
          <SheetTitle>Game Info</SheetTitle>
        </SheetHeader>
        
        <Tabs defaultValue="stats" className="mt-4 h-[calc(100%-4rem)] overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="stats" data-testid="tab-stats">
              <TrendingUp className="w-4 h-4 mr-2" />
              Stats
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">
              <History className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="stats" className="h-[calc(100%-3rem)] overflow-y-auto mt-4">
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
          
          <TabsContent value="history" className="h-[calc(100%-3rem)] overflow-y-auto mt-4">
            {gameState && <ActionHistory history={gameState.actionHistory} />}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
