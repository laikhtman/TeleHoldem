import { Card, Player, GameState, SUITS, RANKS, GamePhase, Pot, ACHIEVEMENT_LIST, Achievement, AchievementId, DifficultySettings, PerformanceMetrics, PlayerTendencies, PlayerAction, MetaGameData, TableImage, TableDynamics, BotMemory, PlayerStyle, TightnessLevel, AggressionLevel } from '@shared/schema';
import { handEvaluator } from './handEvaluator';
import { achievementEngine } from './achievementEngine';

const BOT_NAMES = [
  'Sarah Chen',
  'Marcus Rivera',
  'Elena Volkov',
  'Raj Patel',
  'Sofia Martinez'
];

// Chip animation event types for physics system
export interface ChipAnimationEvent {
  type: 'bet' | 'call' | 'raise' | 'all-in' | 'pot-win' | 'split-pot' | 'blind';
  playerId: string;
  playerPosition?: { x: number; y: number };
  potPosition?: { x: number; y: number };
  amount: number;
  isAllIn?: boolean;
  isSplitPot?: boolean;
  splitCount?: number;
  winnerId?: string;
  winnerPosition?: { x: number; y: number };
  winType?: string; // Added for special effects based on hand type
}

// Callback for chip animations
type ChipAnimationCallback = (event: ChipAnimationEvent) => void;

export class GameEngine {
  private chipAnimationCallback?: ChipAnimationCallback;

  // Register callback for chip animations
  onChipAnimation(callback: ChipAnimationCallback) {
    this.chipAnimationCallback = callback;
  }

  // Trigger chip animation
  private triggerChipAnimation(event: ChipAnimationEvent) {
    if (this.chipAnimationCallback) {
      // Add a small delay to make animations sequential
      setTimeout(() => this.chipAnimationCallback!(event), 0);
    }
  }
  createDeck(): Card[] {
    const deck: Card[] = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({
          rank,
          suit,
          id: `${rank}${suit}`
        });
      }
    }
    return this.shuffleDeck(deck);
  }

  shuffleDeck(deck: Card[]): Card[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  dealCards(deck: Card[], numCards: number): { dealtCards: Card[]; remainingDeck: Card[] } {
    const dealtCards = deck.slice(0, numCards);
    const remainingDeck = deck.slice(numCards);
    return { dealtCards, remainingDeck };
  }

  createInitialGameState(numPlayers: number): GameState {
    const players: Player[] = Array.from({ length: numPlayers }, (_, i) => ({
      id: String(i),
      name: i === 0 ? 'You' : BOT_NAMES[i - 1] || `Bot ${i}`,
      chips: 1000,
      hand: [],
      bet: 0,
      folded: false,
      allIn: false,
      isHuman: i === 0,
      position: i,
      stats: {
        handsWon: 0,
        biggestPot: 0,
      },
    }));

    // Load saved difficulty settings
    const savedDifficulty = localStorage.getItem('pokerDifficulty');
    const difficultySettings: DifficultySettings = savedDifficulty 
      ? {
          mode: JSON.parse(savedDifficulty).mode || 'auto',
          currentLevel: JSON.parse(savedDifficulty).level || 'normal',
          multiplier: 1.0
        }
      : {
          mode: 'auto',
          currentLevel: 'normal',
          multiplier: 1.0
        };

    // Initialize performance metrics
    const performanceMetrics: PerformanceMetrics = {
      recentHands: [],
      bankrollHistory: [{
        amount: 1000, // Starting bankroll
        timestamp: Date.now()
      }],
      winRate: 0.5,
      bankrollTrend: 'stable',
      consecutiveWins: 0,
      consecutiveLosses: 0,
      averagePotWin: 0,
      lastDifficultyAdjustment: Date.now()
    };

    // Initialize player tendencies
    const playerTendencies: PlayerTendencies = {
      totalActions: 0,
      foldCount: 0,
      callCount: 0,
      checkCount: 0,
      betCount: 0,
      raiseCount: 0,
      foldToBetFrequency: 0,
      callToBetFrequency: 0,
      raiseToBetFrequency: 0,
      aggressionFactor: 0,
      vpip: 0,
      pfr: 0,
      wtsd: 0,
      showdownWinRate: 0,
      recentActions: [],
      streetAggression: {
        preFlop: 0,
        flop: 0,
        turn: 0,
        river: 0,
      },
    };

    // Initialize meta-game data
    const metaGameData = this.initializeMetaGameData(players);

    return {
      players,
      deck: this.createDeck(),
      communityCards: [],
      pots: [{ amount: 0, eligiblePlayerIds: players.map(p => p.id) }],
      currentPlayerIndex: 0,
      dealerIndex: 0,
      phase: 'waiting',
      currentBet: 0,
      lastAction: null,
      actionHistory: [],
      roundActionCount: 0,
      sessionStats: {
        handsPlayed: 0,
        handsWonByPlayer: 0,
        handDistribution: {},
      },
      achievements: Object.fromEntries(
        Object.entries(ACHIEVEMENT_LIST).map(([id, ach]) => [id, { ...ach, unlockedAt: undefined }])
      ) as Record<AchievementId, Achievement>,
      difficultySettings,
      performanceMetrics,
      playerTendencies,
      metaGameData,
    };
  }

  private initializeMetaGameData(players: Player[]): MetaGameData {
    const tableImages = new Map<string, TableImage>();
    const botMemories = new Map<string, BotMemory>();
    
    // Initialize table images for all players
    players.forEach(player => {
      tableImages.set(player.id, this.createInitialTableImage(player));
      
      // Initialize bot memories for non-human players
      if (!player.isHuman) {
        botMemories.set(player.id, this.createInitialBotMemory(player));
      }
    });
    
    // Initialize table dynamics
    const tableDynamics: TableDynamics = {
      overallAggression: 0.5,
      averagePotSize: 0,
      averageVPIP: 0,
      averagePFR: 0,
      tableTightness: 'normal',
      tableFlow: 'normal',
      tableCaptains: [],
      weakPlayers: [],
      recentBigPots: [],
      momentum: 'steady'
    };
    
    return {
      tableImages,
      botMemories,
      tableDynamics,
      handCounter: 0,
      lastDynamicsUpdate: Date.now()
    };
  }

  private createInitialTableImage(player: Player): TableImage {
    return {
      playerId: player.id,
      playerName: player.name,
      style: 'UNKNOWN',
      tightness: 'neutral',
      aggression: 'neutral',
      vpip: 0,
      pfr: 0,
      threeBetFrequency: 0,
      cBetFrequency: 0,
      foldToThreeBet: 0,
      wtsd: 0,
      handsSeen: 0,
      lastUpdated: Date.now(),
      recentHandsWeight: 0.7, // Weight recent hands 70%
      blindStealAttempts: 0,
      blindDefenseRate: 0,
      isolationRaiseFrequency: 0,
      checkRaiseFrequency: 0,
      floatFrequency: 0,
      exploitablePatterns: [],
      adjustmentsMade: []
    };
  }

  private createInitialBotMemory(player: Player): BotMemory {
    return {
      playerHistories: new Map(),
      identifiedPatterns: new Map(),
      tableAggression: 0.5,
      averagePotSize: 0,
      tableCaptain: null,
      scaredMoney: false,
      myTableImage: null,
      currentStrategy: 'balanced',
      strategyShiftTimer: 0
    };
  }

  postBlinds(gameState: GameState, smallBlindAmount: number, bigBlindAmount: number): GameState {
    let newState = { ...gameState };
    const players = newState.players;
    const dealerIndex = newState.dealerIndex;
    
    const smallBlindIndex = (dealerIndex + 1) % players.length;
    const bigBlindIndex = (dealerIndex + 2) % players.length;

    // Post small blind
    const sbPlayer = players[smallBlindIndex];
    const smallBlindBet = Math.min(smallBlindAmount, sbPlayer.chips);
    newState = this.playerBet(newState, smallBlindIndex, smallBlindBet, true);

    // Post big blind
    const bbPlayer = players[bigBlindIndex];
    const bigBlindBet = Math.min(bigBlindAmount, bbPlayer.chips);
    newState = this.playerBet(newState, bigBlindIndex, bigBlindBet, true);
    
    newState.currentBet = bigBlindAmount;
    newState.lastAction = `Blinds posted: $${smallBlindAmount}/$${bigBlindAmount}`;
    
    // The pot is already updated by playerBet calls above since we added calculatePots there
    // No additional action needed here
    
    return newState;
  }

  startNewHand(gameState: GameState): GameState {
    // First, check if human player is eliminated (has 0 chips)
    const humanPlayer = gameState.players.find(p => p.isHuman);
    if (humanPlayer && humanPlayer.chips === 0) {
      // Return game over state, preserving all session data and players
      return { 
        ...gameState, 
        lastAction: "Game Over! You are out of chips.", 
        phase: 'waiting',
        // Add a flag to indicate game over state
        gameOver: true 
      };
    }

    // Give rebuys to any bots that are out of chips
    let playersWithRebuys = gameState.players.map(p => {
      if (!p.isHuman && p.chips === 0) {
        return { ...p, chips: 1000 }; // Give bot a rebuy of 1000 chips
      }
      return p;
    });

    // Count active players (those with chips > 0)
    const activePlayers = playersWithRebuys.filter(p => p.chips > 0);
    
    if (activePlayers.length < 2) {
      return { ...gameState, lastAction: "Not enough players to start a new hand.", phase: 'waiting' };
    }

    // Reset hand state for ALL players (keep everyone in the game)
    const players = playersWithRebuys.map(p => ({
      ...p,
      hand: [],
      bet: 0,
      folded: p.chips === 0, // Auto-fold players with no chips
      allIn: false
    }));

    const deck = this.createDeck();
    let currentDeck = deck;
    
    // Deal cards only to active players
    const updatedPlayers = players.map(player => {
      if (player.chips > 0) {
        const { dealtCards, remainingDeck } = this.dealCards(currentDeck, 2);
        currentDeck = remainingDeck;
        return { ...player, hand: dealtCards };
      } else {
        return { ...player, hand: [] }; // No cards for eliminated players
      }
    });

    // Calculate dealer index among active players only
    const activePlayerIndices = updatedPlayers
      .map((p, idx) => p.chips > 0 ? idx : null)
      .filter(idx => idx !== null) as number[];
    
    // Find the next dealer among active players
    let newDealerIndex = gameState.dealerIndex;
    do {
      newDealerIndex = (newDealerIndex + 1) % updatedPlayers.length;
    } while (!activePlayerIndices.includes(newDealerIndex));

    return {
      ...gameState,
      players: updatedPlayers,
      deck: currentDeck,
      communityCards: [],
      pots: [{ amount: 0, eligiblePlayerIds: updatedPlayers.filter(p => p.chips > 0).map(p => p.id) }],
      currentBet: 0,
      dealerIndex: newDealerIndex,
      currentPlayerIndex: (newDealerIndex + 1) % updatedPlayers.length,
      phase: 'pre-flop',
      lastAction: 'New hand started',
      sessionStats: {
        ...gameState.sessionStats,
        handsPlayed: gameState.sessionStats.handsPlayed + 1,
      },
      gameOver: false // Clear any previous game over state
    };
  }

  dealCommunityCards(gameState: GameState, numCards: number): GameState {
    const { dealtCards, remainingDeck } = this.dealCards(gameState.deck, numCards);
    return {
      ...gameState,
      communityCards: [...gameState.communityCards, ...dealtCards],
      deck: remainingDeck
    };
  }

  advancePhase(gameState: GameState): GameState {
    const calculatedState = this.calculatePots(gameState);

    const phaseTransitions: Record<GamePhase, { next: GamePhase; dealCards: number }> = {
      'waiting': { next: 'pre-flop', dealCards: 0 },
      'pre-flop': { next: 'flop', dealCards: 3 },
      'flop': { next: 'turn', dealCards: 1 },
      'turn': { next: 'river', dealCards: 1 },
      'river': { next: 'showdown', dealCards: 0 },
      'showdown': { next: 'waiting', dealCards: 0 }
    };

    const transition = phaseTransitions[calculatedState.phase];
    let newState = { ...calculatedState, phase: transition.next };

    if (transition.dealCards > 0) {
      newState = this.dealCommunityCards(newState, transition.dealCards);
    }

    newState.currentBet = 0;
    newState.players = newState.players.map(p => ({ ...p, bet: 0 }));
    newState.roundActionCount = 0;

    return newState;
  }

  playerFold(gameState: GameState, playerIndex: number): GameState {
    const players = [...gameState.players];
    players[playerIndex] = { ...players[playerIndex], folded: true };
    
    // Update table image
    let newState = { 
      ...gameState, 
      players, 
      lastAction: `${players[playerIndex].name} folded`,
      roundActionCount: gameState.roundActionCount + 1
    };
    
    if (gameState.metaGameData) {
      newState = this.updateTableImageForAction(newState, playerIndex, 'fold');
    }
    
    return newState;
  }

  playerCheck(gameState: GameState, playerIndex: number): GameState {
    let newState = { 
      ...gameState, 
      lastAction: `${gameState.players[playerIndex].name} checked`,
      roundActionCount: gameState.roundActionCount + 1
    };
    
    if (gameState.metaGameData) {
      newState = this.updateTableImageForAction(newState, playerIndex, 'check');
    }
    
    return newState;
  }

  playerBet(gameState: GameState, playerIndex: number, amount: number, isBlind: boolean = false): GameState {
    const players = [...gameState.players];
    const player = players[playerIndex];
    
    const actualBet = Math.min(amount, player.chips);
    const newTotalBet = player.bet + actualBet;

    let actionText = '';
    let action: PlayerAction = 'bet';
    let chipAnimationType: ChipAnimationEvent['type'] = 'bet';
    
    if (!isBlind) {
      if (gameState.currentBet === 0) {
        actionText = `${player.name} bet $${actualBet}`;
        action = 'bet';
        chipAnimationType = 'bet';
      } else if (newTotalBet < gameState.currentBet) {
        actionText = `${player.name} called $${actualBet} (all-in)`;
        action = 'call';
        chipAnimationType = 'all-in';
      } else if (newTotalBet === gameState.currentBet) {
        actionText = `${player.name} called $${actualBet}`;
        action = 'call';
        chipAnimationType = 'call';
      } else {
        actionText = `${player.name} raised to $${newTotalBet}`;
        action = 'raise';
        chipAnimationType = 'raise';
      }
    } else {
      chipAnimationType = 'blind';
    }
    
    const isAllIn = player.chips - actualBet === 0;
    
    players[playerIndex] = {
      ...player,
      chips: player.chips - actualBet,
      bet: newTotalBet,
      allIn: isAllIn
    };

    // Trigger chip animation for betting action
    if (actualBet > 0) {
      this.triggerChipAnimation({
        type: chipAnimationType,
        playerId: player.id,
        amount: actualBet,
        isAllIn: isAllIn && !isBlind
      });
    }

    let newState = {
      ...gameState,
      players,
      currentBet: Math.max(gameState.currentBet, newTotalBet),
      lastAction: isBlind ? gameState.lastAction : actionText,
      roundActionCount: isBlind ? gameState.roundActionCount : gameState.roundActionCount + 1
    };
    
    // Update table image if not a blind
    if (!isBlind && gameState.metaGameData) {
      newState = this.updateTableImageForAction(newState, playerIndex, action);
    }
    
    // CRITICAL FIX: Calculate and update pots immediately after each bet
    // This ensures the pot display shows the correct amount as soon as players bet
    newState = this.calculatePots(newState);
    
    return newState;
  }
  
  private updateTableImageForAction(gameState: GameState, playerIndex: number, action: PlayerAction): GameState {
    if (!gameState.metaGameData) return gameState;
    
    const player = gameState.players[playerIndex];
    const playerId = player.id;
    const metaGameData = { ...gameState.metaGameData };
    const tableImage = metaGameData.tableImages.get(playerId);
    
    if (!tableImage) return gameState;
    
    // Clone the table image for updates
    const updatedImage = { ...tableImage };
    updatedImage.handsSeen++;
    updatedImage.lastUpdated = Date.now();
    
    // Update VPIP (Voluntarily Put In Pot)
    if (gameState.phase === 'pre-flop' && action !== 'fold' && action !== 'check') {
      const weight = updatedImage.recentHandsWeight;
      updatedImage.vpip = (updatedImage.vpip * (1 - weight) + weight) / updatedImage.handsSeen;
      
      if (action === 'raise') {
        updatedImage.pfr = (updatedImage.pfr * (1 - weight) + weight) / updatedImage.handsSeen;
      }
    }
    
    // Track aggression patterns
    const isAggressive = action === 'bet' || action === 'raise';
    const isPassive = action === 'call' || action === 'check';
    
    // Update aggression level based on recent actions
    if (isAggressive) {
      const aggressionUpdate = 0.1; // Incremental update
      updatedImage.aggression = this.adjustAggressionLevel(updatedImage.aggression, aggressionUpdate);
    } else if (isPassive) {
      const aggressionUpdate = -0.05; // Smaller decrement for passive play
      updatedImage.aggression = this.adjustAggressionLevel(updatedImage.aggression, aggressionUpdate);
    }
    
    // Update tightness based on folding frequency
    if (action === 'fold') {
      const tightnessUpdate = 0.05;
      updatedImage.tightness = this.adjustTightnessLevel(updatedImage.tightness, tightnessUpdate);
    } else if (action !== 'check' && gameState.phase === 'pre-flop') {
      const tightnessUpdate = -0.05;
      updatedImage.tightness = this.adjustTightnessLevel(updatedImage.tightness, tightnessUpdate);
    }
    
    // Classify player style based on accumulated stats
    updatedImage.style = this.classifyPlayerStyle(updatedImage);
    
    // Detect exploitable patterns
    this.detectExploitablePatterns(updatedImage, gameState, action);
    
    // Update the table image
    metaGameData.tableImages.set(playerId, updatedImage);
    
    // Update bot memories if this was observed by other bots
    this.updateBotMemories(metaGameData, playerId, action, gameState);
    
    // Update table dynamics periodically
    if (Date.now() - metaGameData.lastDynamicsUpdate > 5000) { // Every 5 seconds
      this.updateTableDynamics(metaGameData, gameState);
      metaGameData.lastDynamicsUpdate = Date.now();
    }
    
    return { ...gameState, metaGameData };
  }
  
  private adjustAggressionLevel(current: AggressionLevel, change: number): AggressionLevel {
    const levels: AggressionLevel[] = ['very-passive', 'passive', 'neutral', 'aggressive', 'very-aggressive'];
    const currentIndex = levels.indexOf(current);
    const newIndex = Math.max(0, Math.min(4, currentIndex + Math.round(change * 10)));
    return levels[newIndex];
  }
  
  private adjustTightnessLevel(current: TightnessLevel, change: number): TightnessLevel {
    const levels: TightnessLevel[] = ['very-loose', 'loose', 'neutral', 'tight', 'very-tight'];
    const currentIndex = levels.indexOf(current);
    const newIndex = Math.max(0, Math.min(4, currentIndex + Math.round(change * 10)));
    return levels[newIndex];
  }
  
  private classifyPlayerStyle(image: TableImage): PlayerStyle {
    const { vpip, pfr, aggression, tightness } = image;
    
    // Classification based on VPIP and PFR
    if (vpip < 0.15 && pfr < 0.10) {
      if (aggression === 'very-passive' || aggression === 'passive') return 'ROCK';
      return 'NIT';
    } else if (vpip < 0.25 && pfr < 0.20) {
      if (aggression === 'aggressive' || aggression === 'very-aggressive') return 'TAG';
      return 'TP';
    } else if (vpip > 0.35) {
      if (aggression === 'very-aggressive') return 'MANIAC';
      if (aggression === 'aggressive') return 'LAG';
      return 'STATION'; // Calls a lot
    } else {
      if (aggression === 'aggressive' || aggression === 'very-aggressive') {
        if (tightness === 'tight' || tightness === 'very-tight') return 'TAG';
        return 'LAG';
      } else {
        if (tightness === 'tight' || tightness === 'very-tight') return 'TP';
        return 'LP';
      }
    }
  }
  
  private detectExploitablePatterns(image: TableImage, gameState: GameState, action: PlayerAction): void {
    const patterns = image.exploitablePatterns;
    
    // Pattern: Always folds to 3-bets
    if (action === 'fold' && gameState.roundActionCount > 2 && gameState.phase === 'pre-flop') {
      image.foldToThreeBet = (image.foldToThreeBet * (image.handsSeen - 1) + 1) / image.handsSeen;
      if (image.foldToThreeBet > 0.7 && !patterns.includes('FOLDS_TO_3BET')) {
        patterns.push('FOLDS_TO_3BET');
      }
    }
    
    // Pattern: Never bluffs
    if (gameState.phase === 'river' && image.handsSeen > 10) {
      const bluffRatio = image.checkRaiseFrequency + image.floatFrequency;
      if (bluffRatio < 0.05 && !patterns.includes('NEVER_BLUFFS')) {
        patterns.push('NEVER_BLUFFS');
      }
    }
    
    // Pattern: Over-aggressive blind stealer
    const isStealPosition = gameState.currentPlayerIndex >= gameState.players.length - 3;
    if (isStealPosition && action === 'raise' && gameState.phase === 'pre-flop') {
      image.blindStealAttempts++;
      const stealFreq = image.blindStealAttempts / Math.max(1, image.handsSeen);
      if (stealFreq > 0.4 && !patterns.includes('BLIND_STEALER')) {
        patterns.push('BLIND_STEALER');
      }
    }
  }
  
  private updateBotMemories(metaGameData: MetaGameData, actingPlayerId: string, action: PlayerAction, gameState: GameState): void {
    // Update each bot's memory of the acting player
    metaGameData.botMemories.forEach((memory, botId) => {
      if (botId === actingPlayerId) return; // Don't track self
      
      let history = memory.playerHistories.get(actingPlayerId);
      if (!history) {
        history = {
          encounters: 0,
          lastPlayed: Date.now(),
          observedActions: [],
          successfulBluffs: 0,
          caughtBluffing: 0,
          showdownsWon: 0,
          showdownsLost: 0,
          moneyWon: 0,
          moneyLost: 0
        };
      }
      
      history.encounters++;
      history.lastPlayed = Date.now();
      history.observedActions.push(action);
      if (history.observedActions.length > 50) {
        history.observedActions.shift(); // Keep last 50 actions
      }
      
      memory.playerHistories.set(actingPlayerId, history);
    });
  }
  
  private updateTableDynamics(metaGameData: MetaGameData, gameState: GameState): void {
    const dynamics = metaGameData.tableDynamics;
    const tableImages = Array.from(metaGameData.tableImages.values());
    
    // Calculate average VPIP and PFR
    dynamics.averageVPIP = tableImages.reduce((sum, img) => sum + img.vpip, 0) / tableImages.length;
    dynamics.averagePFR = tableImages.reduce((sum, img) => sum + img.pfr, 0) / tableImages.length;
    
    // Calculate overall aggression
    let aggressionScore = 0;
    tableImages.forEach(img => {
      switch(img.aggression) {
        case 'very-aggressive': aggressionScore += 1.0; break;
        case 'aggressive': aggressionScore += 0.75; break;
        case 'neutral': aggressionScore += 0.5; break;
        case 'passive': aggressionScore += 0.25; break;
        case 'very-passive': aggressionScore += 0; break;
      }
    });
    dynamics.overallAggression = aggressionScore / tableImages.length;
    
    // Determine table tightness
    if (dynamics.averageVPIP < 0.15) dynamics.tableTightness = 'very-tight';
    else if (dynamics.averageVPIP < 0.22) dynamics.tableTightness = 'tight';
    else if (dynamics.averageVPIP < 0.30) dynamics.tableTightness = 'normal';
    else if (dynamics.averageVPIP < 0.40) dynamics.tableTightness = 'loose';
    else dynamics.tableTightness = 'very-loose';
    
    // Determine table flow
    if (dynamics.overallAggression < 0.3) dynamics.tableFlow = 'passive';
    else if (dynamics.overallAggression < 0.6) dynamics.tableFlow = 'normal';
    else if (dynamics.overallAggression < 0.8) dynamics.tableFlow = 'aggressive';
    else dynamics.tableFlow = 'maniac';
    
    // Identify table captains (most aggressive players)
    const aggressivePlayers = tableImages
      .filter(img => img.aggression === 'aggressive' || img.aggression === 'very-aggressive')
      .sort((a, b) => b.pfr - a.pfr)
      .slice(0, 2);
    dynamics.tableCaptains = aggressivePlayers.map(img => img.playerId);
    
    // Identify weak players (exploitable)
    const weakPlayers = tableImages
      .filter(img => img.exploitablePatterns.length > 0 || img.style === 'STATION' || img.style === 'LP')
      .map(img => img.playerId);
    dynamics.weakPlayers = weakPlayers;
    
    // Update momentum based on recent pot sizes
    const recentPots = dynamics.recentBigPots.filter(pot => Date.now() - pot.timestamp < 60000); // Last minute
    if (recentPots.length > 3) dynamics.momentum = 'building';
    else if (recentPots.length > 1) dynamics.momentum = 'steady';
    else dynamics.momentum = 'cooling';
  }

  getNextPlayerIndex(gameState: GameState): number {
    let nextIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
    let attempts = 0;
    while ((gameState.players[nextIndex].folded || gameState.players[nextIndex].allIn) && attempts < gameState.players.length) {
      nextIndex = (nextIndex + 1) % gameState.players.length;
      attempts++;
    }
    return nextIndex;
  }

  isRoundComplete(gameState: GameState): boolean {
    const activePlayers = gameState.players.filter(p => !p.folded && !p.allIn);
    const allInPlayers = gameState.players.filter(p => !p.folded && p.allIn);
    const totalInHand = gameState.players.filter(p => !p.folded).length;
    
    // If everyone is all-in or folded except maybe one player, round is complete
    // This handles the case where multiple players are all-in and can't act further
    if (activePlayers.length <= 1) {
      // But we need at least 2 players total (including all-ins) to continue
      if (totalInHand >= 2 || activePlayers.length === 1) {
        return true;
      }
    }
    
    // All active players must match the current bet
    const allMatchCurrentBet = activePlayers.every(p => p.bet === gameState.currentBet);
    
    // Check if enough players have acted
    // For a round to be complete, all active players must have acted at least once
    const minActionsNeeded = activePlayers.length;
    const hasEnoughActions = gameState.roundActionCount >= minActionsNeeded;
    
    // If current bet is 0 and everyone checked, we need to ensure everyone had a turn
    if (gameState.currentBet === 0) {
      // For checks, everyone needs to have acted at least once
      if (!hasEnoughActions) return false;
    }

    // In pre-flop, the big blind can still act if no one raised.
    if (gameState.phase === 'pre-flop') {
        const bigBlindIndex = (gameState.dealerIndex + 2) % gameState.players.length;
        const bbPlayer = gameState.players[bigBlindIndex];
        if (bbPlayer && !bbPlayer.folded && !bbPlayer.allIn && bbPlayer.bet === gameState.currentBet) {
            // Big blind hasn't had a chance to act after posting blind
            const raisesExist = gameState.players.some(p => p.bet > gameState.currentBet);
            // If no raises and BB hasn't acted yet (action count check)
            if (!raisesExist && gameState.roundActionCount < activePlayers.length) {
              return false;
            }
        }
    }

    return allMatchCurrentBet && hasEnoughActions;
  }

  getActivePlayers(gameState: GameState): Player[] {
    return gameState.players.filter(p => !p.folded);
  }

  updatePerformanceMetrics(gameState: GameState, humanWon: boolean, potSize: number): GameState {
    const newMetrics = { ...gameState.performanceMetrics } || {
      recentHands: [],
      bankrollHistory: [],
      winRate: 0.5,
      bankrollTrend: 'stable' as const
    };

    // Add new hand result
    const newHand = {
      handId: `hand-${Date.now()}`,
      won: humanWon,
      potSize,
      timestamp: Date.now()
    };

    // Update recent hands (keep last 25)
    newMetrics.recentHands = [...newMetrics.recentHands, newHand].slice(-25);

    // Calculate new win rate
    if (newMetrics.recentHands.length > 0) {
      const wins = newMetrics.recentHands.filter(h => h.won).length;
      newMetrics.winRate = wins / newMetrics.recentHands.length;
    }

    // Update bankroll history
    const humanPlayer = gameState.players.find(p => p.isHuman);
    if (humanPlayer) {
      const bankrollEntry = {
        amount: humanPlayer.chips,
        timestamp: Date.now()
      };
      newMetrics.bankrollHistory = [...newMetrics.bankrollHistory, bankrollEntry].slice(-30);

      // Calculate bankroll trend
      if (newMetrics.bankrollHistory.length >= 3) {
        const recent = newMetrics.bankrollHistory.slice(-10);
        const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
        const secondHalf = recent.slice(Math.floor(recent.length / 2));
        
        const avgFirst = firstHalf.reduce((sum, h) => sum + h.amount, 0) / firstHalf.length;
        const avgSecond = secondHalf.reduce((sum, h) => sum + h.amount, 0) / secondHalf.length;
        
        const changePercent = (avgSecond - avgFirst) / avgFirst;
        
        if (changePercent > 0.1) newMetrics.bankrollTrend = 'up';
        else if (changePercent < -0.1) newMetrics.bankrollTrend = 'down';
        else newMetrics.bankrollTrend = 'stable';
      }
    }

    return { ...gameState, performanceMetrics: newMetrics };
  }

  resolveShowdown(gameState: GameState): { winners: Player[]; winningHand: string; bestCombos: Record<string, Card[]> } {
    const activePlayers = this.getActivePlayers(gameState);
    if (activePlayers.length === 0) return { winners: [], winningHand: 'No players', bestCombos: {} };
    if (activePlayers.length === 1) return { winners: [activePlayers[0]], winningHand: 'All others folded', bestCombos: {} };

    const evaluations = activePlayers.map(player => ({
      player,
      ...handEvaluator.evaluateHand(player.hand, gameState.communityCards)
    }));

    const maxValue = Math.max(...evaluations.map(e => e.value));
    const winners = evaluations.filter(e => e.value === maxValue).map(e => e.player);
    const winningHand = evaluations.find(e => e.value === maxValue)?.description || 'Best Hand';
    const bestCombos: Record<string, Card[]> = {};
    evaluations.filter(e => e.value === maxValue).forEach(e => {
      bestCombos[e.player.id] = e.winningCards || [];
    });
    return { winners, winningHand, bestCombos };
  }

  calculatePots(gameState: GameState): GameState {
    const playersInHand = gameState.players.filter(p => !p.folded);
    // Create a working copy of player bets to avoid mutating original game state
    const playerBets = playersInHand.map(p => ({ id: p.id, bet: p.bet }));
    
    // Calculate the total amount bet in current round
    const currentRoundBets = playerBets.reduce((sum, p) => sum + p.bet, 0);
    
    const bets = [...playerBets].sort((a, b) => a.bet - b.bet);
    const pots: Pot[] = [];
    let lastBetLevel = 0;

    for (const betInfo of bets) {
        if (betInfo.bet <= lastBetLevel) continue;

        const currentBetLevel = betInfo.bet;
        const potAmount = (currentBetLevel - lastBetLevel) * playerBets.filter(p => p.bet >= currentBetLevel).length;
        
        const contributingPlayerIds = playerBets.filter(p => p.bet > lastBetLevel).map(p => p.id);
        
        // Update working copy of bets, not original player objects
        for (const p of playerBets) {
            if (p.bet > lastBetLevel) {
                p.bet -= Math.min(p.bet, currentBetLevel - lastBetLevel);
            }
        }

        pots.push({
            amount: potAmount,
            eligiblePlayerIds: contributingPlayerIds
        });

        lastBetLevel = currentBetLevel;
    }
    
    // Consolidate pots from previous rounds
    const totalPreviousPot = gameState.pots.reduce((sum, pot) => sum + pot.amount, 0);
    
    // If no new pots were created from current betting (everyone checked or no bets)
    if (pots.length === 0) {
      // But we should always have at least one pot if there's money from previous rounds or blinds
      if (totalPreviousPot > 0 || currentRoundBets > 0) {
        pots.push({
          amount: totalPreviousPot + currentRoundBets,
          eligiblePlayerIds: playersInHand.map(p => p.id)
        });
      }
    } else {
      // Add previous pot to the main pot
      pots[0].amount += totalPreviousPot;
    }
    
    // Ensure we always have at least one pot if there are players
    if (pots.length === 0 && playersInHand.length > 0) {
      pots.push({
        amount: 0,
        eligiblePlayerIds: playersInHand.map(p => p.id)
      });
    }

    return { ...gameState, pots };
  }

  awardPots(gameState: GameState): { newState: GameState, unlockedAchievements: AchievementId[] } {
    let players = [...gameState.players];
    let sessionStats = { ...gameState.sessionStats };
    let achievements = { ...gameState.achievements };
    let unlockedAchievements: AchievementId[] = [];
    
    for (const pot of gameState.pots) {
      const eligiblePlayers = players.filter(p => pot.eligiblePlayerIds.includes(p.id) && !p.folded);
      if (eligiblePlayers.length === 0) continue;

      const { winners, winningHand } = this.resolveShowdown({ ...gameState, players: eligiblePlayers });
      if (winners.length === 0) continue;

      const potShare = Math.floor(pot.amount / winners.length);
      const remainder = pot.amount % winners.length;
      const isSplitPot = winners.length > 1;

      winners.forEach((winner, idx) => {
        const winnerIndex = players.findIndex(p => p.id === winner.id);
        if (winnerIndex !== -1) {
          if (players[winnerIndex].isHuman) {
            sessionStats.handsWonByPlayer += 1;
            const currentCount = sessionStats.handDistribution[winningHand] || 0;
            sessionStats.handDistribution[winningHand] = currentCount + 1;
          }
          const extraChip = idx < remainder ? 1 : 0;
          const winAmount = potShare + extraChip;
          
          // Trigger chip animation for pot collection with win type for special effects
          if (winAmount > 0) {
            this.triggerChipAnimation({
              type: isSplitPot ? 'split-pot' : 'pot-win',
              playerId: winner.id,
              winnerId: winner.id,
              amount: winAmount,
              isSplitPot: isSplitPot,
              splitCount: winners.length,
              winType: winningHand // Pass the winning hand type for special effects
            });
          }
          
          players[winnerIndex] = {
            ...players[winnerIndex],
            chips: players[winnerIndex].chips + winAmount,
            stats: {
              handsWon: players[winnerIndex].stats.handsWon + 1,
              biggestPot: Math.max(players[winnerIndex].stats.biggestPot, winAmount),
            }
          };

          if (players[winnerIndex].isHuman) {
            const result = achievementEngine.checkAchievements({ ...gameState, achievements, sessionStats }, winningHand, winAmount);
            achievements = result.newState.achievements;
            unlockedAchievements.push(...result.unlockedAchievements);
          }
        }
      });
    }

    return { newState: { ...gameState, players, pots: [], sessionStats, achievements }, unlockedAchievements };
  }
  
  // Track player actions to update tendencies
  updatePlayerTendencies(gameState: GameState, playerIndex: number, action: PlayerAction): PlayerTendencies | undefined {
    const player = gameState.players[playerIndex];
    if (!player.isHuman || !gameState.playerTendencies) return gameState.playerTendencies;
    
    const tendencies = { ...gameState.playerTendencies };
    
    // Update action counts
    tendencies.totalActions++;
    switch (action) {
      case 'fold':
        tendencies.foldCount++;
        break;
      case 'call':
        tendencies.callCount++;
        break;
      case 'check':
        tendencies.checkCount++;
        break;
      case 'bet':
        tendencies.betCount++;
        break;
      case 'raise':
        tendencies.raiseCount++;
        break;
    }
    
    // Update recent actions (keep last 20)
    tendencies.recentActions = [...tendencies.recentActions, action].slice(-20);
    
    // Update frequencies when facing a bet
    if (gameState.currentBet > 0 && action !== 'bet') {
      const facingBetActions = tendencies.foldCount + tendencies.callCount + tendencies.raiseCount;
      if (facingBetActions > 0) {
        tendencies.foldToBetFrequency = tendencies.foldCount / facingBetActions;
        tendencies.callToBetFrequency = tendencies.callCount / facingBetActions;
        tendencies.raiseToBetFrequency = tendencies.raiseCount / facingBetActions;
      }
    }
    
    // Update aggression factor
    const aggressiveActions = tendencies.betCount + tendencies.raiseCount;
    const passiveActions = Math.max(1, tendencies.callCount);
    tendencies.aggressionFactor = aggressiveActions / passiveActions;
    
    // Update street aggression
    const streetKey = this.getStreetKey(gameState.phase);
    if (streetKey) {
      const currentAgg = tendencies.streetAggression[streetKey];
      const streetActions = gameState.roundActionCount || 1;
      const isAggressive = action === 'bet' || action === 'raise';
      tendencies.streetAggression[streetKey] = (currentAgg * (streetActions - 1) + (isAggressive ? 1 : 0)) / streetActions;
    }
    
    // Update VPIP (Voluntarily Put In Pot) for pre-flop
    if (gameState.phase === 'pre-flop' && action !== 'fold' && action !== 'check') {
      const preFlopActions = Math.floor(tendencies.totalActions / 4); // Rough estimate
      tendencies.vpip = (tendencies.betCount + tendencies.callCount + tendencies.raiseCount) / Math.max(1, preFlopActions);
      tendencies.pfr = tendencies.raiseCount / Math.max(1, preFlopActions);
    }
    
    return tendencies;
  }
  
  private getStreetKey(phase: GamePhase): keyof PlayerTendencies['streetAggression'] | null {
    switch (phase) {
      case 'pre-flop': return 'preFlop';
      case 'flop': return 'flop';
      case 'turn': return 'turn';
      case 'river': return 'river';
      default: return null;
    }
  }
}

export const gameEngine = new GameEngine();
