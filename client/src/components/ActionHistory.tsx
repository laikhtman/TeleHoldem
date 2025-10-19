import { ActionHistoryEntry, GamePhase } from '@shared/schema';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XCircle, 
  CheckCircle, 
  Phone, 
  TrendingUp, 
  CircleDollarSign,
  Sparkles,
  Eye,
  Layers,
  Award
} from 'lucide-react';

interface ActionHistoryProps {
  history: ActionHistoryEntry[];
  currentPlayerName?: string;
}

const getActionIcon = (entry: ActionHistoryEntry) => {
  switch (entry.type) {
    case 'player-action':
      switch (entry.action) {
        case 'fold':
          return <XCircle className="w-4 h-4" />;
        case 'check':
          return <CheckCircle className="w-4 h-4" />;
        case 'call':
          return <Phone className="w-4 h-4" />;
        case 'bet':
        case 'raise':
          return <TrendingUp className="w-4 h-4" />;
        case 'all-in':
          return <CircleDollarSign className="w-4 h-4" />;
        default:
          return <Eye className="w-4 h-4" />;
      }
    case 'phase-change':
      return <Layers className="w-4 h-4" />;
    case 'cards-dealt':
      return <Sparkles className="w-4 h-4" />;
    case 'pot-award':
      return <Award className="w-4 h-4" />;
    case 'blinds-posted':
      return <CircleDollarSign className="w-4 h-4" />;
    default:
      return <Eye className="w-4 h-4" />;
  }
};

const getActionVariant = (entry: ActionHistoryEntry): "default" | "secondary" | "destructive" | "outline" => {
  switch (entry.type) {
    case 'player-action':
      switch (entry.action) {
        case 'fold':
          return 'destructive';
        case 'check':
          return 'secondary';
        case 'call':
        case 'bet':
        case 'raise':
          return 'default';
        case 'all-in':
          return 'default';
        default:
          return 'secondary';
      }
    case 'pot-award':
      return 'default';
    case 'phase-change':
    case 'cards-dealt':
      return 'outline';
    default:
      return 'secondary';
  }
};

const getPhaseLabel = (phase: GamePhase): string => {
  const labels: Record<GamePhase, string> = {
    'waiting': 'Waiting',
    'pre-flop': 'Pre-Flop',
    'flop': 'Flop',
    'turn': 'Turn',
    'river': 'River',
    'showdown': 'Showdown'
  };
  return labels[phase];
};

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });
};

export function ActionHistory({ history, currentPlayerName }: ActionHistoryProps) {
  const groupedHistory: { phase: GamePhase; entries: ActionHistoryEntry[] }[] = [];
  
  history.forEach(entry => {
    const lastGroup = groupedHistory[groupedHistory.length - 1];
    if (!lastGroup || lastGroup.phase !== entry.phase) {
      groupedHistory.push({ phase: entry.phase, entries: [entry] });
    } else {
      lastGroup.entries.push(entry);
    }
  });

  return (
    <div 
      className="flex flex-col h-full bg-card/80 backdrop-blur-sm border border-card-border rounded-lg"
      data-testid="action-history-sidebar"
    >
      <div className="p-4 border-b border-card-border">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Layers className="w-5 h-5 text-poker-chipGold" />
          Action History
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {history.length} {history.length === 1 ? 'action' : 'actions'}
        </p>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {groupedHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No actions yet. Start a new hand to begin.
            </div>
          ) : (
            <AnimatePresence>
              {groupedHistory.map((group, groupIndex) => (
                <motion.div
                  key={`${group.phase}-${groupIndex}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2"
                >
                  <div className="sticky top-0 z-10 bg-accent/50 backdrop-blur-sm px-3 py-1.5 rounded-md border border-accent/50">
                    <div className="flex items-center gap-2">
                      <Layers className="w-3 h-3 text-accent-foreground" />
                      <span className="text-xs font-bold text-accent-foreground uppercase tracking-wide">
                        {getPhaseLabel(group.phase)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pl-2">
                    {group.entries.map((entry, entryIndex) => {
                      const isCurrentPlayer = entry.playerName === currentPlayerName;
                      
                      return (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: entryIndex * 0.05 }}
                          className={`flex items-start gap-2 p-2 rounded-md transition-colors ${
                            isCurrentPlayer 
                              ? 'bg-poker-chipGold/10 border border-poker-chipGold/30' 
                              : 'hover-elevate'
                          }`}
                          data-testid={`action-history-entry-${entry.id}`}
                        >
                          <div className="mt-0.5">
                            <Badge 
                              variant={getActionVariant(entry)}
                              className="h-6 w-6 p-0 flex items-center justify-center"
                            >
                              {getActionIcon(entry)}
                            </Badge>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 flex-wrap">
                              {entry.playerName && (
                                <span 
                                  className={`text-sm font-semibold ${
                                    isCurrentPlayer ? 'text-poker-chipGold' : 'text-foreground'
                                  }`}
                                  data-testid={`action-player-name-${entry.id}`}
                                >
                                  {entry.playerName}
                                </span>
                              )}
                              <span 
                                className="text-xs text-muted-foreground"
                                data-testid={`action-message-${entry.id}`}
                              >
                                {entry.message}
                              </span>
                            </div>
                            
                            {entry.amount !== undefined && entry.amount > 0 && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <Badge 
                                  variant="outline" 
                                  className="text-xs h-5 bg-poker-chipGold/10 text-poker-chipGold border-poker-chipGold/30"
                                  data-testid={`action-amount-${entry.id}`}
                                >
                                  ${entry.amount}
                                </Badge>
                              </div>
                            )}
                          </div>

                          <div className="text-[10px] text-muted-foreground whitespace-nowrap mt-0.5">
                            {formatTime(entry.timestamp)}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
