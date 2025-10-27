import { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Search, HelpCircle, Keyboard, Target, BookOpen, MessageSquare, RotateCcw, Spade, Heart, Diamond, Club } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useGameTips } from '@/hooks/useGameTips';

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { resetOnboarding, startOnboarding } = useOnboarding();
  const { resetTips, enableTips, tipsEnabled } = useGameTips();

  // Filter content based on search query
  const filterContent = (content: string) => {
    if (!searchQuery) return true;
    return content.toLowerCase().includes(searchQuery.toLowerCase());
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="container max-w-6xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/demo">
                <Button variant="ghost" size="icon" data-testid="button-back">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">Help & Documentation</h1>
            </div>
            <ThemeToggle />
          </div>
          
          {/* Search bar */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search help topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-help"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-6xl mx-auto p-4">
        <Tabs defaultValue="rules" className="mt-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-2 h-auto">
            <TabsTrigger value="rules" className="min-h-[44px]" data-testid="tab-rules">
              <BookOpen className="w-4 h-4 mr-2" />
              Rules
            </TabsTrigger>
            <TabsTrigger value="controls" className="min-h-[44px]" data-testid="tab-controls">
              <Target className="w-4 h-4 mr-2" />
              Controls
            </TabsTrigger>
            <TabsTrigger value="shortcuts" className="min-h-[44px]" data-testid="tab-shortcuts">
              <Keyboard className="w-4 h-4 mr-2" />
              Shortcuts
            </TabsTrigger>
            <TabsTrigger value="strategy" className="min-h-[44px]" data-testid="tab-strategy">
              <HelpCircle className="w-4 h-4 mr-2" />
              Strategy
            </TabsTrigger>
            <TabsTrigger value="faq" className="min-h-[44px]" data-testid="tab-faq">
              <MessageSquare className="w-4 h-4 mr-2" />
              FAQ
            </TabsTrigger>
          </TabsList>

          {/* Game Rules */}
          <TabsContent value="rules" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Texas Hold'em Rules</CardTitle>
                <CardDescription>Learn the basics of Texas Hold'em poker</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-6">
                    <section>
                      <h3 className="text-lg font-semibold mb-3">Game Overview</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Texas Hold'em is a community card poker game where each player receives two private cards (hole cards) and shares five community cards with other players. The goal is to make the best five-card hand using any combination of your hole cards and the community cards.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg font-semibold mb-3">Game Flow</h3>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                        <li><strong>Pre-flop:</strong> Each player receives two hole cards face down</li>
                        <li><strong>The Flop:</strong> Three community cards are dealt face up</li>
                        <li><strong>The Turn:</strong> A fourth community card is dealt</li>
                        <li><strong>The River:</strong> The fifth and final community card is dealt</li>
                        <li><strong>Showdown:</strong> Remaining players reveal their cards</li>
                      </ol>
                    </section>

                    <section>
                      <h3 className="text-lg font-semibold mb-3">Hand Rankings (from highest to lowest)</h3>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <span className="font-semibold text-sm">1. Royal Flush:</span>
                          <span className="text-sm text-muted-foreground">A, K, Q, J, 10 of the same suit</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="font-semibold text-sm">2. Straight Flush:</span>
                          <span className="text-sm text-muted-foreground">Five consecutive cards of the same suit</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="font-semibold text-sm">3. Four of a Kind:</span>
                          <span className="text-sm text-muted-foreground">Four cards of the same rank</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="font-semibold text-sm">4. Full House:</span>
                          <span className="text-sm text-muted-foreground">Three of a kind plus a pair</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="font-semibold text-sm">5. Flush:</span>
                          <span className="text-sm text-muted-foreground">Five cards of the same suit</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="font-semibold text-sm">6. Straight:</span>
                          <span className="text-sm text-muted-foreground">Five consecutive cards of different suits</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="font-semibold text-sm">7. Three of a Kind:</span>
                          <span className="text-sm text-muted-foreground">Three cards of the same rank</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="font-semibold text-sm">8. Two Pair:</span>
                          <span className="text-sm text-muted-foreground">Two different pairs</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="font-semibold text-sm">9. One Pair:</span>
                          <span className="text-sm text-muted-foreground">Two cards of the same rank</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="font-semibold text-sm">10. High Card:</span>
                          <span className="text-sm text-muted-foreground">Highest card when no other hand is made</span>
                        </div>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-lg font-semibold mb-3">Betting Actions</h3>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p><strong>Check:</strong> Pass the action to the next player without betting (only if no bet has been made)</p>
                        <p><strong>Bet:</strong> Place the first wager in a betting round</p>
                        <p><strong>Call:</strong> Match the current bet amount</p>
                        <p><strong>Raise:</strong> Increase the current bet amount</p>
                        <p><strong>Fold:</strong> Surrender your cards and exit the current hand</p>
                        <p><strong>All-In:</strong> Bet all your remaining chips</p>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-lg font-semibold mb-3">The Blinds</h3>
                      <p className="text-sm text-muted-foreground">
                        Texas Hold'em uses a system of forced bets called blinds. The two players to the left of the dealer button post the small blind and big blind before cards are dealt. This ensures there's always something to play for in each hand.
                      </p>
                    </section>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Controls Guide */}
          <TabsContent value="controls" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Controls Guide</CardTitle>
                <CardDescription>How to interact with the game</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <section>
                    <h3 className="text-lg font-semibold mb-3">Desktop Controls</h3>
                    <div className="space-y-3">
                      <div className="bg-muted/30 rounded-lg p-4">
                        <h4 className="font-medium mb-2">Mouse Controls</h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          <li>• Click action buttons to fold, check, call, or raise</li>
                          <li>• Use the slider to adjust bet amounts</li>
                          <li>• Click quick bet buttons for common amounts</li>
                          <li>• Hover over cards to see them better</li>
                        </ul>
                      </div>
                      
                      <div className="bg-muted/30 rounded-lg p-4">
                        <h4 className="font-medium mb-2">Keyboard Shortcuts</h4>
                        <p className="text-sm text-muted-foreground">See the Shortcuts tab for complete list</p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold mb-3">Mobile Controls</h3>
                    <div className="space-y-3">
                      <div className="bg-muted/30 rounded-lg p-4">
                        <h4 className="font-medium mb-2">Touch Gestures</h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          <li>• Tap action buttons to play</li>
                          <li>• Swipe left to fold</li>
                          <li>• Swipe right to check/call</li>
                          <li>• Drag slider to adjust bets</li>
                          <li>• Tap FAB button for menu options</li>
                        </ul>
                      </div>

                      <div className="bg-muted/30 rounded-lg p-4">
                        <h4 className="font-medium mb-2">Screen Orientation</h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          <li>• Portrait: Optimized layout for one-handed play</li>
                          <li>• Landscape: Full table view with all players visible</li>
                          <li>• Rotate device to switch between modes</li>
                        </ul>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold mb-3">UI Elements</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-muted/30 rounded-lg p-3">
                        <h4 className="font-medium text-sm mb-1">Hand Strength Panel</h4>
                        <p className="text-xs text-muted-foreground">Shows your current hand and win probability</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3">
                        <h4 className="font-medium text-sm mb-1">Action History</h4>
                        <p className="text-xs text-muted-foreground">Tracks all player actions in the current hand</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3">
                        <h4 className="font-medium text-sm mb-1">Statistics Panel</h4>
                        <p className="text-xs text-muted-foreground">View your performance metrics</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3">
                        <h4 className="font-medium text-sm mb-1">Pot Display</h4>
                        <p className="text-xs text-muted-foreground">Shows current pot size and side pots</p>
                      </div>
                    </div>
                  </section>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Keyboard Shortcuts */}
          <TabsContent value="shortcuts" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Keyboard Shortcuts</CardTitle>
                <CardDescription>Speed up your gameplay with keyboard controls</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <section>
                    <h3 className="text-lg font-semibold mb-3">Game Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex justify-between items-center bg-muted/30 rounded-lg p-3">
                        <span className="text-sm font-medium">Fold</span>
                        <kbd className="px-2 py-1 text-xs bg-background rounded border">F</kbd>
                      </div>
                      <div className="flex justify-between items-center bg-muted/30 rounded-lg p-3">
                        <span className="text-sm font-medium">Check/Call</span>
                        <kbd className="px-2 py-1 text-xs bg-background rounded border">C</kbd>
                      </div>
                      <div className="flex justify-between items-center bg-muted/30 rounded-lg p-3">
                        <span className="text-sm font-medium">Raise</span>
                        <kbd className="px-2 py-1 text-xs bg-background rounded border">R</kbd>
                      </div>
                      <div className="flex justify-between items-center bg-muted/30 rounded-lg p-3">
                        <span className="text-sm font-medium">All-In</span>
                        <kbd className="px-2 py-1 text-xs bg-background rounded border">A</kbd>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold mb-3">Navigation</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex justify-between items-center bg-muted/30 rounded-lg p-3">
                        <span className="text-sm font-medium">Open Help</span>
                        <kbd className="px-2 py-1 text-xs bg-background rounded border">?</kbd>
                      </div>
                      <div className="flex justify-between items-center bg-muted/30 rounded-lg p-3">
                        <span className="text-sm font-medium">Toggle Stats Panel</span>
                        <kbd className="px-2 py-1 text-xs bg-background rounded border">S</kbd>
                      </div>
                      <div className="flex justify-between items-center bg-muted/30 rounded-lg p-3">
                        <span className="text-sm font-medium">Toggle Hand Strength</span>
                        <kbd className="px-2 py-1 text-xs bg-background rounded border">H</kbd>
                      </div>
                      <div className="flex justify-between items-center bg-muted/30 rounded-lg p-3">
                        <span className="text-sm font-medium">Settings</span>
                        <kbd className="px-2 py-1 text-xs bg-background rounded border">ESC</kbd>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold mb-3">Bet Adjustments</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex justify-between items-center bg-muted/30 rounded-lg p-3">
                        <span className="text-sm font-medium">Increase Bet</span>
                        <div className="flex gap-1">
                          <kbd className="px-2 py-1 text-xs bg-background rounded border">↑</kbd>
                          <span className="text-xs text-muted-foreground">or</span>
                          <kbd className="px-2 py-1 text-xs bg-background rounded border">+</kbd>
                        </div>
                      </div>
                      <div className="flex justify-between items-center bg-muted/30 rounded-lg p-3">
                        <span className="text-sm font-medium">Decrease Bet</span>
                        <div className="flex gap-1">
                          <kbd className="px-2 py-1 text-xs bg-background rounded border">↓</kbd>
                          <span className="text-xs text-muted-foreground">or</span>
                          <kbd className="px-2 py-1 text-xs bg-background rounded border">-</kbd>
                        </div>
                      </div>
                      <div className="flex justify-between items-center bg-muted/30 rounded-lg p-3">
                        <span className="text-sm font-medium">Min Bet</span>
                        <kbd className="px-2 py-1 text-xs bg-background rounded border">M</kbd>
                      </div>
                      <div className="flex justify-between items-center bg-muted/30 rounded-lg p-3">
                        <span className="text-sm font-medium">Half Pot</span>
                        <kbd className="px-2 py-1 text-xs bg-background rounded border">P</kbd>
                      </div>
                    </div>
                  </section>

                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      <strong>Pro Tip:</strong> Using keyboard shortcuts can significantly speed up your play and help you make decisions faster!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Strategy Tips */}
          <TabsContent value="strategy" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Strategy Tips</CardTitle>
                <CardDescription>Improve your poker game with these strategic concepts</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="starting-hands">
                    <AccordionTrigger>Starting Hand Selection</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 text-sm text-muted-foreground">
                        <p>Your starting hand selection is crucial for long-term success. Here are general guidelines:</p>
                        <div className="bg-muted/30 rounded-lg p-3">
                          <h4 className="font-medium mb-2">Premium Hands</h4>
                          <p>AA, KK, QQ, JJ, AKs (s = suited)</p>
                          <p className="text-xs mt-1">Play these aggressively from any position</p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3">
                          <h4 className="font-medium mb-2">Strong Hands</h4>
                          <p>TT, 99, AQs, AJs, KQs, AK</p>
                          <p className="text-xs mt-1">Play most positions, be cautious against heavy action</p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3">
                          <h4 className="font-medium mb-2">Playable Hands</h4>
                          <p>88-22, ATs-A2s, KJs, QJs, JTs</p>
                          <p className="text-xs mt-1">Play in late position or when cheap to see flop</p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="position">
                    <AccordionTrigger>Position Strategy</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 text-sm text-muted-foreground">
                        <p>Position is one of the most important concepts in poker. Acting last gives you more information.</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li><strong>Early Position:</strong> Play only premium hands</li>
                          <li><strong>Middle Position:</strong> Widen your range slightly</li>
                          <li><strong>Late Position:</strong> Play more hands, steal blinds</li>
                          <li><strong>Button:</strong> Most profitable position, widest range</li>
                        </ul>
                        <p className="mt-3 text-xs bg-blue-500/10 border border-blue-500/20 rounded p-2">
                          Remember: "Position is power" - the later you act, the more information you have!
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="pot-odds">
                    <AccordionTrigger>Pot Odds & Expected Value</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 text-sm text-muted-foreground">
                        <p>Understanding pot odds helps you make mathematically correct decisions.</p>
                        <div className="bg-muted/30 rounded-lg p-3">
                          <h4 className="font-medium mb-2">Calculating Pot Odds</h4>
                          <p>Pot Odds = Amount to Call / (Pot Size + Amount to Call)</p>
                          <p className="text-xs mt-2">Example: $10 to call into a $30 pot = 10/40 = 25%</p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3">
                          <h4 className="font-medium mb-2">Rule of 2 and 4</h4>
                          <p>• After flop: Outs × 4 = approximate winning %</p>
                          <p>• After turn: Outs × 2 = approximate winning %</p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="betting-patterns">
                    <AccordionTrigger>Betting Patterns & Tells</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 text-sm text-muted-foreground">
                        <p>Pay attention to how opponents bet in different situations:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li><strong>Quick bets:</strong> Often indicate strong hands</li>
                          <li><strong>Hesitation:</strong> May suggest uncertainty</li>
                          <li><strong>Bet sizing:</strong> Large bets often mean strength or bluffs</li>
                          <li><strong>Check-raise:</strong> Usually indicates a very strong hand</li>
                        </ul>
                        <p className="mt-3 text-xs bg-amber-500/10 border border-amber-500/20 rounded p-2">
                          Against AI opponents, focus on their betting patterns across multiple hands to identify tendencies.
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="bankroll">
                    <AccordionTrigger>Bankroll Management</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 text-sm text-muted-foreground">
                        <p>Proper bankroll management ensures you can handle variance:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Never risk more than 5% of your bankroll in one game</li>
                          <li>Have at least 20 buy-ins for your stake level</li>
                          <li>Move down stakes during losing streaks</li>
                          <li>Don't chase losses with bigger bets</li>
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="bluffing">
                    <AccordionTrigger>Bluffing Strategy</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 text-sm text-muted-foreground">
                        <p>Effective bluffing requires the right conditions:</p>
                        <div className="bg-muted/30 rounded-lg p-3">
                          <h4 className="font-medium mb-2">Good Bluffing Spots</h4>
                          <ul className="list-disc list-inside space-y-1 text-xs">
                            <li>When the board is scary (straight/flush possible)</li>
                            <li>Against tight players</li>
                            <li>When you have position</li>
                            <li>When your story makes sense</li>
                          </ul>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3">
                          <h4 className="font-medium mb-2">Avoid Bluffing When</h4>
                          <ul className="list-disc list-inside space-y-1 text-xs">
                            <li>Multiple opponents are in the pot</li>
                            <li>Against calling stations</li>
                            <li>The pot is small</li>
                            <li>You've been caught bluffing recently</li>
                          </ul>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FAQ */}
          <TabsContent value="faq" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>Common questions and answers</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="q1">
                    <AccordionTrigger>How do I start playing?</AccordionTrigger>
                    <AccordionContent>
                      Simply click "New Game" on the main screen. The game will automatically deal cards and start the first betting round. You'll play against AI opponents that adapt to your playing style.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="q2">
                    <AccordionTrigger>What's the difference between Check and Call?</AccordionTrigger>
                    <AccordionContent>
                      <strong>Check</strong> means passing the action to the next player without betting (only available when no one has bet yet). <strong>Call</strong> means matching the current bet amount to stay in the hand.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="q3">
                    <AccordionTrigger>How does the AI difficulty work?</AccordionTrigger>
                    <AccordionContent>
                      The AI opponents have different playing styles - some are aggressive, some are tight, and some are unpredictable. They analyze the board texture, pot odds, and your betting patterns to make decisions.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="q4">
                    <AccordionTrigger>Can I play on mobile devices?</AccordionTrigger>
                    <AccordionContent>
                      Yes! The game is fully optimized for mobile devices. Use touch gestures like swiping to fold or check/call. The UI automatically adjusts for portrait and landscape orientations.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="q5">
                    <AccordionTrigger>How do I see my statistics?</AccordionTrigger>
                    <AccordionContent>
                      Click on the statistics panel on the right side of the screen (desktop) or use the FAB menu on mobile. You can view your win rate, biggest pot won, total hands played, and other metrics.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="q6">
                    <AccordionTrigger>What happens if I run out of chips?</AccordionTrigger>
                    <AccordionContent>
                      If you lose all your chips, you can rebuy to continue playing. Your statistics will continue to track across sessions. In tournament mode, running out of chips eliminates you from the tournament.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="q7">
                    <AccordionTrigger>Can I customize the game settings?</AccordionTrigger>
                    <AccordionContent>
                      Yes! Access the settings menu to adjust sound effects, animation speed, table themes, and more. You can also enable colorblind mode and reduce animations for better performance.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="q8">
                    <AccordionTrigger>Is my progress saved?</AccordionTrigger>
                    <AccordionContent>
                      In demo mode, your progress is saved locally in your browser. If you play through Telegram, your progress is saved to your account and synced across devices.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="q9">
                    <AccordionTrigger>How do side pots work?</AccordionTrigger>
                    <AccordionContent>
                      When a player goes all-in for less than the full bet, a side pot is created. The all-in player can only win the main pot (up to their all-in amount from each player). Other players continue betting in the side pot.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="q10">
                    <AccordionTrigger>What are achievements?</AccordionTrigger>
                    <AccordionContent>
                      Achievements are special milestones you can unlock by playing. Examples include winning with specific hands, winning large pots, or playing a certain number of hands. Check the achievements panel to see your progress.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Tutorial Controls */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Tutorial & Tips Settings</CardTitle>
            <CardDescription>Manage your learning experience</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <h4 className="font-medium text-sm">Replay Tutorial</h4>
                  <p className="text-xs text-muted-foreground">Start the onboarding tutorial again</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    resetOnboarding();
                    startOnboarding();
                  }}
                  data-testid="button-replay-tutorial"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Replay
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <h4 className="font-medium text-sm">Reset Tips</h4>
                  <p className="text-xs text-muted-foreground">Show all game tips again</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetTips}
                  data-testid="button-reset-tips"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <h4 className="font-medium text-sm">Game Tips</h4>
                  <p className="text-xs text-muted-foreground">Show helpful tips during gameplay</p>
                </div>
                <Button
                  variant={tipsEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => enableTips(!tipsEnabled)}
                  data-testid="button-toggle-tips"
                >
                  {tipsEnabled ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}