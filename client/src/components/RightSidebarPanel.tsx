import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ActionHistory } from './ActionHistory';
import { SessionStats } from './SessionStats';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, History, BarChart3 } from 'lucide-react';
import { GameState } from '@shared/schema';
import { cn } from '@/lib/utils';

interface RightSidebarPanelProps {
  gameState: GameState | null;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function RightSidebarPanel({ 
  gameState, 
  isCollapsed = false,
  onToggleCollapse 
}: RightSidebarPanelProps) {
  const [activeTab, setActiveTab] = useState<string>("history");

  if (!gameState) return null;

  return (
    <div 
      className={cn(
        "h-screen bg-background border-l transition-all duration-300 flex flex-col relative",
        isCollapsed ? "w-0 overflow-hidden" : "w-[320px]"
      )}
      data-testid="right-sidebar-panel"
    >
      {/* Collapse Toggle Button */}
      <Button
        variant="outline"
        size="icon"
        className="absolute -left-10 top-20 z-10 h-8 w-8 rounded-full shadow-lg bg-background/95 backdrop-blur-sm"
        onClick={onToggleCollapse}
        data-testid="button-toggle-right-sidebar"
        aria-label={isCollapsed ? "Show game info panel" : "Hide game info panel"}
      >
        {isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </Button>

      {!isCollapsed && (
        <div className="flex flex-col h-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            {/* Tab Navigation */}
            <div className="px-4 pt-4 pb-2 border-b">
              <TabsList className="grid w-full grid-cols-2 h-11">
                <TabsTrigger 
                  value="history" 
                  data-testid="tab-action-history-desktop"
                  className="flex items-center gap-2 min-h-10"
                >
                  <History className="w-4 h-4" aria-hidden="true" />
                  <span>History</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="stats" 
                  data-testid="tab-session-stats-desktop"
                  className="flex items-center gap-2 min-h-10"
                >
                  <BarChart3 className="w-4 h-4" aria-hidden="true" />
                  <span>Stats</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
              <TabsContent 
                value="history" 
                className="h-full m-0 p-0"
                forceMount={activeTab === "history" ? undefined : true}
                hidden={activeTab !== "history"}
              >
                <ScrollArea className="h-full">
                  <div className="p-4">
                    <ActionHistory 
                      history={gameState.actionHistory} 
                      currentPlayerName={gameState.players[0]?.name}
                    />
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent 
                value="stats" 
                className="h-full m-0 p-0"
                forceMount={activeTab === "stats" ? undefined : true}
                hidden={activeTab !== "stats"}
              >
                <ScrollArea className="h-full">
                  <div className="p-4">
                    <SessionStats stats={gameState.sessionStats} />
                    
                    {/* Additional Stats Info */}
                    <div className="mt-6 space-y-4">
                      <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 border border-card-border">
                        <h4 className="text-sm font-semibold mb-3 text-foreground">Current Session</h4>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Chips</span>
                            <span className="font-medium">${gameState.players[0]?.chips || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Biggest Win</span>
                            <span className="font-medium">${gameState.players[0]?.stats?.biggestPot || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Winnings</span>
                            <span className="font-medium">${0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Achievements</span>
                            <span className="font-medium">{Object.keys(gameState.achievements || {}).length}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 border border-card-border">
                        <h4 className="text-sm font-semibold mb-3 text-foreground">Performance Metrics</h4>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">VPIP</span>
                            <span className="font-medium">
                              {gameState.sessionStats.handsPlayed > 0 
                                ? Math.round((gameState.sessionStats.handsWonByPlayer / gameState.sessionStats.handsPlayed) * 100)
                                : 0}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Hands per Hour</span>
                            <span className="font-medium">
                              {gameState.sessionStats.handsPlayed || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Avg Pot Size</span>
                            <span className="font-medium">
                              ${0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      )}
    </div>
  );
}