import { GameState } from '@shared/schema';

function getPersonalityTag(id: string, isHuman: boolean): 'TAG' | 'LAG' | 'TP' | 'LP' | 'BAL' {
  if (isHuman) return 'BAL';
  const idx = parseInt(id, 10) || 0;
  const personalities: Array<'TAG' | 'LAG' | 'TP' | 'LP' | 'BAL'> = ['TAG', 'LAG', 'TP', 'LP', 'BAL'];
  return personalities[idx % personalities.length];
}

export function DevOverlay({ state }: { state: GameState | null }) {
  if (!state) return null;
  const totalPot = state.pots.reduce((s, p) => s + p.amount, 0);
  return (
    <div
      className="fixed top-2 left-2 z-[1000] bg-black/70 text-white rounded-md border border-white/20 p-3 text-xs min-w-[240px]"
      data-testid="dev-overlay"
    >
      <div className="font-bold text-sm mb-1">Dev Diagnostics</div>
      <div>Phase: {state.phase}</div>
      <div>Current Bet: ${state.currentBet}</div>
      <div>Pot: ${totalPot}</div>
      <div>Current Player: {state.currentPlayerIndex}</div>
      <div>Dealer: {state.dealerIndex}</div>
      <div>Last Action: {state.lastAction || '-'}</div>
      <div className="mt-2 font-semibold">Players</div>
      {state.players.map((p, i) => (
        <div key={p.id} className="flex items-center justify-between">
          <span>
            {i}. {p.name} {p.isHuman ? '(You)' : ''}
          </span>
          <span className="opacity-80">
            ${p.chips} • {getPersonalityTag(p.id, p.isHuman)}
          </span>
        </div>
      ))}
    </div>
  );
}

