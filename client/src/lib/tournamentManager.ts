import {
  TournamentType,
  TournamentStatus,
  TournamentPlayerStatus,
  BlindLevel,
  PayoutPosition,
  GameState,
  Player,
} from '@shared/schema';
import { GameEngine } from './gameEngine';

// Tournament configuration types
export interface TournamentConfig {
  name: string;
  type: TournamentType;
  buyIn: number;
  startingChips: number;
  maxPlayers: number;
  blindStructureType: 'turbo' | 'normal' | 'deep-stack' | 'custom';
  customBlindStructure?: BlindLevel[];
  customPayoutStructure?: PayoutPosition[];
  startTime?: Date;
}

export interface TournamentPlayer {
  id: string;
  name: string;
  chipCount: number;
  status: TournamentPlayerStatus;
  position?: number;
  tableId?: string;
  seatNumber?: number;
  eliminatedAt?: number;
  winnings: number;
}

export interface TournamentTable {
  id: string;
  tableNumber: number;
  gameEngine: GameEngine;
  gameState: GameState;
  playerSeats: Map<number, string>; // seat number -> player id
  maxSeats: number;
}

export interface TournamentState {
  id: string;
  name: string;
  type: TournamentType;
  status: TournamentStatus;
  buyIn: number;
  startingChips: number;
  maxPlayers: number;
  currentPlayers: number;
  prizePool: number;
  blindStructure: BlindLevel[];
  payoutStructure: PayoutPosition[];
  currentBlindLevel: number;
  blindTimer?: number; // milliseconds remaining
  nextBlindTime?: number; // timestamp when next blind level starts
  players: Map<string, TournamentPlayer>;
  tables: Map<string, TournamentTable>;
  startTime?: number;
  endTime?: number;
  eliminationOrder: string[]; // Player IDs in order of elimination
}

// Event types for UI updates
export type TournamentEventType = 
  | 'player-registered'
  | 'tournament-started'
  | 'blind-level-changed'
  | 'player-eliminated'
  | 'table-balanced'
  | 'tournament-completed'
  | 'payout-calculated'
  | 'timer-update';

export interface TournamentEvent {
  type: TournamentEventType;
  data: any;
  timestamp: number;
}

// Callback type for event handling
export type TournamentEventCallback = (event: TournamentEvent) => void;

// Default blind structures
const BLIND_STRUCTURES = {
  turbo: [
    { level: 1, duration: 3, smallBlind: 10, bigBlind: 20 },
    { level: 2, duration: 3, smallBlind: 15, bigBlind: 30 },
    { level: 3, duration: 3, smallBlind: 25, bigBlind: 50 },
    { level: 4, duration: 3, smallBlind: 50, bigBlind: 100 },
    { level: 5, duration: 3, smallBlind: 75, bigBlind: 150, ante: 25 },
    { level: 6, duration: 3, smallBlind: 100, bigBlind: 200, ante: 30 },
    { level: 7, duration: 3, smallBlind: 150, bigBlind: 300, ante: 40 },
    { level: 8, duration: 3, smallBlind: 200, bigBlind: 400, ante: 50 },
    { level: 9, duration: 3, smallBlind: 300, bigBlind: 600, ante: 75 },
    { level: 10, duration: 3, smallBlind: 500, bigBlind: 1000, ante: 100 },
  ],
  normal: [
    { level: 1, duration: 10, smallBlind: 25, bigBlind: 50 },
    { level: 2, duration: 10, smallBlind: 50, bigBlind: 100 },
    { level: 3, duration: 10, smallBlind: 75, bigBlind: 150 },
    { level: 4, duration: 10, smallBlind: 100, bigBlind: 200 },
    { level: 5, duration: 10, smallBlind: 150, bigBlind: 300, ante: 25 },
    { level: 6, duration: 10, smallBlind: 200, bigBlind: 400, ante: 50 },
    { level: 7, duration: 10, smallBlind: 300, bigBlind: 600, ante: 75 },
    { level: 8, duration: 10, smallBlind: 400, bigBlind: 800, ante: 100 },
    { level: 9, duration: 10, smallBlind: 500, bigBlind: 1000, ante: 125 },
    { level: 10, duration: 10, smallBlind: 600, bigBlind: 1200, ante: 150 },
    { level: 11, duration: 10, smallBlind: 800, bigBlind: 1600, ante: 200 },
    { level: 12, duration: 10, smallBlind: 1000, bigBlind: 2000, ante: 250 },
  ],
  'deep-stack': [
    { level: 1, duration: 15, smallBlind: 25, bigBlind: 50 },
    { level: 2, duration: 15, smallBlind: 50, bigBlind: 100 },
    { level: 3, duration: 15, smallBlind: 75, bigBlind: 150 },
    { level: 4, duration: 15, smallBlind: 100, bigBlind: 200 },
    { level: 5, duration: 15, smallBlind: 125, bigBlind: 250 },
    { level: 6, duration: 15, smallBlind: 150, bigBlind: 300, ante: 25 },
    { level: 7, duration: 15, smallBlind: 200, bigBlind: 400, ante: 50 },
    { level: 8, duration: 15, smallBlind: 250, bigBlind: 500, ante: 50 },
    { level: 9, duration: 15, smallBlind: 300, bigBlind: 600, ante: 75 },
    { level: 10, duration: 15, smallBlind: 400, bigBlind: 800, ante: 100 },
    { level: 11, duration: 15, smallBlind: 500, bigBlind: 1000, ante: 100 },
    { level: 12, duration: 15, smallBlind: 600, bigBlind: 1200, ante: 150 },
    { level: 13, duration: 15, smallBlind: 800, bigBlind: 1600, ante: 200 },
    { level: 14, duration: 15, smallBlind: 1000, bigBlind: 2000, ante: 250 },
    { level: 15, duration: 15, smallBlind: 1500, bigBlind: 3000, ante: 400 },
  ],
};

// Default payout structures based on player count
const DEFAULT_PAYOUT_STRUCTURES: Record<string, PayoutPosition[]> = {
  '2-5': [
    { position: 1, percentage: 100 },
  ],
  '6-9': [
    { position: 1, percentage: 50 },
    { position: 2, percentage: 30 },
    { position: 3, percentage: 20 },
  ],
  '10-20': [
    { position: 1, percentage: 40 },
    { position: 2, percentage: 25 },
    { position: 3, percentage: 18 },
    { position: 4, percentage: 12 },
    { position: 5, percentage: 5 },
  ],
  '21-50': [
    { position: 1, percentage: 30 },
    { position: 2, percentage: 20 },
    { position: 3, percentage: 13 },
    { position: 4, percentage: 10 },
    { position: 5, percentage: 8 },
    { position: 6, percentage: 6 },
    { position: 7, percentage: 5 },
    { position: 8, percentage: 4 },
    { position: 9, percentage: 4 },
  ],
  '51+': [
    { position: 1, percentage: 25 },
    { position: 2, percentage: 16 },
    { position: 3, percentage: 11 },
    { position: 4, percentage: 8 },
    { position: 5, percentage: 6.5 },
    { position: 6, percentage: 5 },
    { position: 7, percentage: 4 },
    { position: 8, percentage: 3.5 },
    { position: 9, percentage: 3 },
    { position: 10, percentage: 2.5 },
    { position: 11, percentage: 2.5 },
    { position: 12, percentage: 2.5 },
    { position: 13, percentage: 2 },
    { position: 14, percentage: 2 },
    { position: 15, percentage: 2 },
    { position: 16, percentage: 1.5 },
    { position: 17, percentage: 1.5 },
    { position: 18, percentage: 1.5 },
  ],
};

export class TournamentManager {
  private tournaments: Map<string, TournamentState> = new Map();
  private eventCallbacks: Map<string, Set<TournamentEventCallback>> = new Map();
  private timerIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.tournaments = new Map();
    this.eventCallbacks = new Map();
    this.timerIntervals = new Map();
  }

  // Create a new tournament
  createTournament(config: TournamentConfig): string {
    const tournamentId = `tournament-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    const blindStructure = config.customBlindStructure || 
      BLIND_STRUCTURES[config.blindStructureType === 'custom' ? 'normal' : config.blindStructureType];
    
    const payoutStructure = config.customPayoutStructure || 
      this.getDefaultPayoutStructure(config.maxPlayers);

    const tournament: TournamentState = {
      id: tournamentId,
      name: config.name,
      type: config.type,
      status: 'registering',
      buyIn: config.buyIn,
      startingChips: config.startingChips,
      maxPlayers: config.maxPlayers,
      currentPlayers: 0,
      prizePool: 0,
      blindStructure,
      payoutStructure,
      currentBlindLevel: 0,
      players: new Map(),
      tables: new Map(),
      startTime: config.startTime?.getTime(),
      eliminationOrder: [],
    };

    this.tournaments.set(tournamentId, tournament);
    
    this.emitEvent(tournamentId, {
      type: 'tournament-started',
      data: { tournamentId, config },
      timestamp: Date.now(),
    });

    return tournamentId;
  }

  // Register a player for the tournament
  registerPlayer(tournamentId: string, playerName: string, playerId?: string): boolean {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) return false;
    
    if (tournament.status !== 'registering') return false;
    if (tournament.currentPlayers >= tournament.maxPlayers) return false;

    const id = playerId || `player-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    const player: TournamentPlayer = {
      id,
      name: playerName,
      chipCount: tournament.startingChips,
      status: 'registered',
      winnings: 0,
    };

    tournament.players.set(id, player);
    tournament.currentPlayers++;
    tournament.prizePool += tournament.buyIn;

    this.emitEvent(tournamentId, {
      type: 'player-registered',
      data: { playerId: id, playerName, currentPlayers: tournament.currentPlayers },
      timestamp: Date.now(),
    });

    // Auto-start Sit & Go when full
    if (tournament.type === 'sit_and_go' && tournament.currentPlayers === tournament.maxPlayers) {
      this.startTournament(tournamentId);
    }

    return true;
  }

  // Start the tournament
  startTournament(tournamentId: string): boolean {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) return false;
    
    if (tournament.status !== 'registering') return false;
    if (tournament.currentPlayers < 2) return false;

    tournament.status = 'running';
    tournament.startTime = Date.now();
    
    // Update all players to playing status
    tournament.players.forEach(player => {
      player.status = 'playing';
    });

    // Create tables
    this.createTables(tournament);
    
    // Start blind timer
    this.startBlindTimer(tournamentId);

    this.emitEvent(tournamentId, {
      type: 'tournament-started',
      data: { 
        tournamentId, 
        playerCount: tournament.currentPlayers,
        tableCount: tournament.tables.size,
      },
      timestamp: Date.now(),
    });

    return true;
  }

  // Create tables for the tournament
  private createTables(tournament: TournamentState) {
    const playersPerTable = tournament.type === 'sit_and_go' ? tournament.maxPlayers : 9;
    const numTables = Math.ceil(tournament.currentPlayers / playersPerTable);
    
    const playerArray = Array.from(tournament.players.values());
    let playerIndex = 0;

    for (let i = 0; i < numTables; i++) {
      const tableId = `table-${i + 1}`;
      const gameEngine = new GameEngine();
      
      const table: TournamentTable = {
        id: tableId,
        tableNumber: i + 1,
        gameEngine,
        gameState: gameEngine.createInitialGameState(0), // Will add players separately
        playerSeats: new Map(),
        maxSeats: playersPerTable,
      };

      // Distribute players evenly across tables
      const playersForThisTable = Math.min(
        Math.ceil((tournament.currentPlayers - playerIndex) / (numTables - i)),
        playersPerTable
      );

      for (let seat = 0; seat < playersForThisTable && playerIndex < playerArray.length; seat++) {
        const player = playerArray[playerIndex++];
        player.tableId = tableId;
        player.seatNumber = seat;
        table.playerSeats.set(seat, player.id);
      }

      // Initialize game state with actual players
      const tablePlayers: Player[] = [];
      table.playerSeats.forEach((playerId, seatNumber) => {
        const tournamentPlayer = tournament.players.get(playerId)!;
        tablePlayers.push({
          id: playerId,
          name: tournamentPlayer.name,
          chips: tournamentPlayer.chipCount,
          hand: [],
          bet: 0,
          folded: false,
          allIn: false,
          isHuman: false, // Will be set based on actual player
          position: seatNumber,
          stats: {
            handsWon: 0,
            biggestPot: 0,
          },
        });
      });

      table.gameState = {
        ...table.gameState,
        players: tablePlayers,
      };

      tournament.tables.set(tableId, table);
    }
  }

  // Start blind level timer
  private startBlindTimer(tournamentId: string) {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) return;

    const currentLevel = tournament.blindStructure[tournament.currentBlindLevel];
    if (!currentLevel) return;

    const duration = currentLevel.duration * 60 * 1000; // Convert minutes to milliseconds
    tournament.blindTimer = duration;
    tournament.nextBlindTime = Date.now() + duration;

    // Clear any existing timer
    const existingTimer = this.timerIntervals.get(tournamentId);
    if (existingTimer) clearInterval(existingTimer);

    // Set up new timer
    const timer = setInterval(() => {
      this.updateBlindTimer(tournamentId);
    }, 1000); // Update every second

    this.timerIntervals.set(tournamentId, timer);
  }

  // Update blind timer
  private updateBlindTimer(tournamentId: string) {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament || tournament.status !== 'running') {
      this.stopBlindTimer(tournamentId);
      return;
    }

    const now = Date.now();
    if (tournament.nextBlindTime && now >= tournament.nextBlindTime) {
      this.advanceBlindLevel(tournamentId);
    } else if (tournament.nextBlindTime) {
      tournament.blindTimer = tournament.nextBlindTime - now;
      
      this.emitEvent(tournamentId, {
        type: 'timer-update',
        data: { 
          timeRemaining: tournament.blindTimer,
          currentLevel: tournament.currentBlindLevel,
        },
        timestamp: now,
      });
    }
  }

  // Stop blind timer
  private stopBlindTimer(tournamentId: string) {
    const timer = this.timerIntervals.get(tournamentId);
    if (timer) {
      clearInterval(timer);
      this.timerIntervals.delete(tournamentId);
    }
  }

  // Advance to next blind level
  advanceBlindLevel(tournamentId: string): boolean {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) return false;
    
    if (tournament.currentBlindLevel >= tournament.blindStructure.length - 1) {
      return false; // Already at max level
    }

    tournament.currentBlindLevel++;
    const newLevel = tournament.blindStructure[tournament.currentBlindLevel];
    
    // Update blind timer for new level
    this.startBlindTimer(tournamentId);

    // Update all tables with new blind levels
    tournament.tables.forEach(table => {
      // You would update the game state here with new blinds
      // This would be integrated with the GameEngine
    });

    this.emitEvent(tournamentId, {
      type: 'blind-level-changed',
      data: {
        level: tournament.currentBlindLevel + 1,
        smallBlind: newLevel.smallBlind,
        bigBlind: newLevel.bigBlind,
        ante: newLevel.ante,
      },
      timestamp: Date.now(),
    });

    return true;
  }

  // Eliminate a player from the tournament
  eliminatePlayer(tournamentId: string, playerId: string): boolean {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) return false;

    const player = tournament.players.get(playerId);
    if (!player || player.status !== 'playing') return false;

    player.status = 'eliminated';
    player.eliminatedAt = Date.now();
    
    // Calculate position (reverse of elimination order)
    const remainingPlayers = Array.from(tournament.players.values())
      .filter(p => p.status === 'playing').length;
    player.position = remainingPlayers + 1;
    
    tournament.eliminationOrder.push(playerId);

    // Calculate winnings if in the money
    const payout = this.calculatePlayerPayout(tournament, player.position);
    if (payout > 0) {
      player.winnings = payout;
    }

    // Remove from table
    if (player.tableId) {
      const table = tournament.tables.get(player.tableId);
      if (table && player.seatNumber !== undefined) {
        table.playerSeats.delete(player.seatNumber);
      }
    }

    // Check if we need to balance tables
    if (tournament.type === 'multi_table' && remainingPlayers > 1) {
      this.balanceTables(tournamentId);
    }

    // Check if tournament is complete
    if (remainingPlayers === 1) {
      this.finishTournament(tournamentId);
    }

    this.emitEvent(tournamentId, {
      type: 'player-eliminated',
      data: {
        playerId,
        playerName: player.name,
        position: player.position,
        winnings: player.winnings,
        remainingPlayers,
      },
      timestamp: Date.now(),
    });

    return true;
  }

  // Balance tables when players are eliminated
  balanceTables(tournamentId: string): boolean {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament || tournament.type !== 'multi_table') return false;

    const activeTables = Array.from(tournament.tables.values())
      .filter(table => table.playerSeats.size > 0);
    
    if (activeTables.length <= 1) return false;

    // Calculate ideal distribution
    const totalPlayers = activeTables.reduce((sum, table) => sum + table.playerSeats.size, 0);
    const idealPlayersPerTable = Math.ceil(totalPlayers / activeTables.length);

    // Find tables that need balancing
    const overloadedTables = activeTables.filter(t => t.playerSeats.size > idealPlayersPerTable);
    const underloadedTables = activeTables.filter(t => t.playerSeats.size < idealPlayersPerTable);

    // Move players from overloaded to underloaded tables
    for (const fromTable of overloadedTables) {
      for (const toTable of underloadedTables) {
        if (fromTable.playerSeats.size <= idealPlayersPerTable) break;
        if (toTable.playerSeats.size >= idealPlayersPerTable) continue;

        // Move one player
        const [seatToMove] = Array.from(fromTable.playerSeats.keys());
        const playerIdToMove = fromTable.playerSeats.get(seatToMove)!;
        
        // Find empty seat at destination table
        let newSeat = 0;
        while (toTable.playerSeats.has(newSeat) && newSeat < toTable.maxSeats) {
          newSeat++;
        }

        if (newSeat < toTable.maxSeats) {
          fromTable.playerSeats.delete(seatToMove);
          toTable.playerSeats.set(newSeat, playerIdToMove);
          
          // Update player's table assignment
          const player = tournament.players.get(playerIdToMove);
          if (player) {
            player.tableId = toTable.id;
            player.seatNumber = newSeat;
          }
        }
      }
    }

    // Close empty tables
    tournament.tables.forEach((table, tableId) => {
      if (table.playerSeats.size === 0) {
        tournament.tables.delete(tableId);
      }
    });

    this.emitEvent(tournamentId, {
      type: 'table-balanced',
      data: {
        tableCount: tournament.tables.size,
        playerDistribution: Array.from(tournament.tables.values())
          .map(t => ({ tableId: t.id, playerCount: t.playerSeats.size })),
      },
      timestamp: Date.now(),
    });

    return true;
  }

  // Calculate payout for a specific position
  private calculatePlayerPayout(tournament: TournamentState, position: number): number {
    const payoutPosition = tournament.payoutStructure.find(p => p.position === position);
    if (!payoutPosition) return 0;
    
    return Math.floor(tournament.prizePool * (payoutPosition.percentage / 100));
  }

  // Calculate all payouts
  calculatePayouts(tournamentId: string): Map<number, number> {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) return new Map();

    const payouts = new Map<number, number>();
    
    tournament.payoutStructure.forEach(({ position, percentage }) => {
      const amount = Math.floor(tournament.prizePool * (percentage / 100));
      payouts.set(position, amount);
    });

    this.emitEvent(tournamentId, {
      type: 'payout-calculated',
      data: {
        prizePool: tournament.prizePool,
        payouts: Array.from(payouts.entries()).map(([position, amount]) => ({
          position,
          amount,
        })),
      },
      timestamp: Date.now(),
    });

    return payouts;
  }

  // Finish the tournament
  finishTournament(tournamentId: string): boolean {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) return false;

    // Find the winner (last remaining player)
    const winner = Array.from(tournament.players.values())
      .find(p => p.status === 'playing');
    
    if (winner) {
      winner.position = 1;
      winner.status = 'eliminated'; // Mark as finished
      winner.winnings = this.calculatePlayerPayout(tournament, 1);
    }

    tournament.status = 'completed';
    tournament.endTime = Date.now();
    
    // Stop blind timer
    this.stopBlindTimer(tournamentId);

    this.emitEvent(tournamentId, {
      type: 'tournament-completed',
      data: {
        tournamentId,
        winner: winner ? { id: winner.id, name: winner.name, winnings: winner.winnings } : null,
        duration: tournament.endTime - (tournament.startTime || 0),
        finalStandings: this.getFinalStandings(tournamentId),
      },
      timestamp: Date.now(),
    });

    return true;
  }

  // Get tournament status and statistics
  getTournamentStatus(tournamentId: string): TournamentState | null {
    return this.tournaments.get(tournamentId) || null;
  }

  // Get current blind level info
  getCurrentBlindLevel(tournamentId: string): BlindLevel | null {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) return null;
    
    return tournament.blindStructure[tournament.currentBlindLevel] || null;
  }

  // Get final standings
  getFinalStandings(tournamentId: string): Array<{position: number, player: TournamentPlayer}> {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) return [];

    return Array.from(tournament.players.values())
      .filter(p => p.position !== undefined)
      .sort((a, b) => (a.position || 0) - (b.position || 0))
      .map(player => ({ position: player.position!, player }));
  }

  // Get active tournaments
  getActiveTournaments(): TournamentState[] {
    return Array.from(this.tournaments.values())
      .filter(t => t.status === 'running' || t.status === 'registering');
  }

  // Register event callback
  onEvent(tournamentId: string, callback: TournamentEventCallback): () => void {
    if (!this.eventCallbacks.has(tournamentId)) {
      this.eventCallbacks.set(tournamentId, new Set());
    }
    
    this.eventCallbacks.get(tournamentId)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.eventCallbacks.get(tournamentId);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  // Emit event to callbacks
  private emitEvent(tournamentId: string, event: TournamentEvent) {
    const callbacks = this.eventCallbacks.get(tournamentId);
    if (callbacks) {
      callbacks.forEach(callback => callback(event));
    }
  }

  // Get default payout structure based on player count
  private getDefaultPayoutStructure(playerCount: number): PayoutPosition[] {
    if (playerCount <= 5) return DEFAULT_PAYOUT_STRUCTURES['2-5'];
    if (playerCount <= 9) return DEFAULT_PAYOUT_STRUCTURES['6-9'];
    if (playerCount <= 20) return DEFAULT_PAYOUT_STRUCTURES['10-20'];
    if (playerCount <= 50) return DEFAULT_PAYOUT_STRUCTURES['21-50'];
    return DEFAULT_PAYOUT_STRUCTURES['51+'];
  }

  // Helper function to create a quick Sit & Go tournament
  createSitAndGo(buyIn: number = 100, maxPlayers: number = 6): string {
    return this.createTournament({
      name: `Sit & Go - ${maxPlayers} Players`,
      type: 'sit_and_go',
      buyIn,
      startingChips: 1500,
      maxPlayers,
      blindStructureType: 'turbo',
    });
  }

  // Helper function to create a scheduled tournament
  createScheduledTournament(
    name: string,
    startTime: Date,
    buyIn: number = 100,
    maxPlayers: number = 50
  ): string {
    return this.createTournament({
      name,
      type: 'scheduled',
      buyIn,
      startingChips: 3000,
      maxPlayers,
      blindStructureType: 'normal',
      startTime,
    });
  }

  // Helper to update player chip counts from game state
  updatePlayerChips(tournamentId: string, tableId: string, gameState: GameState) {
    const tournament = this.tournaments.get(tournamentId);
    const table = tournament?.tables.get(tableId);
    
    if (!tournament || !table) return;

    // Update tournament player chip counts from game state
    gameState.players.forEach(gamePlayer => {
      const tournamentPlayer = tournament.players.get(gamePlayer.id);
      if (tournamentPlayer) {
        tournamentPlayer.chipCount = gamePlayer.chips;
        
        // Check if player is eliminated
        if (gamePlayer.chips === 0) {
          this.eliminatePlayer(tournamentId, gamePlayer.id);
        }
      }
    });
  }

  // Get table for a specific player
  getPlayerTable(tournamentId: string, playerId: string): TournamentTable | null {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) return null;

    const player = tournament.players.get(playerId);
    if (!player || !player.tableId) return null;

    return tournament.tables.get(player.tableId) || null;
  }

  // Check if tournament can start
  canStartTournament(tournamentId: string): boolean {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) return false;
    
    return tournament.status === 'registering' && tournament.currentPlayers >= 2;
  }

  // Cancel tournament (only if not started)
  cancelTournament(tournamentId: string): boolean {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament || tournament.status !== 'registering') return false;

    tournament.status = 'cancelled';
    this.stopBlindTimer(tournamentId);
    
    // Refund buy-ins would happen here in a real implementation
    
    return true;
  }

  // Clean up completed tournaments
  cleanup(olderThanHours: number = 24) {
    const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
    
    this.tournaments.forEach((tournament, id) => {
      if (tournament.status === 'completed' || tournament.status === 'cancelled') {
        if ((tournament.endTime || 0) < cutoffTime) {
          this.stopBlindTimer(id);
          this.eventCallbacks.delete(id);
          this.tournaments.delete(id);
        }
      }
    });
  }
}

// Export a singleton instance
export const tournamentManager = new TournamentManager();

// Export helper functions for React components
export function createTournament(config: TournamentConfig): string {
  return tournamentManager.createTournament(config);
}

export function registerForTournament(tournamentId: string, playerName: string): boolean {
  return tournamentManager.registerPlayer(tournamentId, playerName);
}

export function startTournament(tournamentId: string): boolean {
  return tournamentManager.startTournament(tournamentId);
}

export function getTournamentStatus(tournamentId: string): TournamentState | null {
  return tournamentManager.getTournamentStatus(tournamentId);
}

export function subscribeToTournamentEvents(
  tournamentId: string, 
  callback: TournamentEventCallback
): () => void {
  return tournamentManager.onEvent(tournamentId, callback);
}

export function getActiveTournaments(): TournamentState[] {
  return tournamentManager.getActiveTournaments();
}

export function createQuickSitAndGo(buyIn?: number, maxPlayers?: number): string {
  return tournamentManager.createSitAndGo(buyIn, maxPlayers);
}