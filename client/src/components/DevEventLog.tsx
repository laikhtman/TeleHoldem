import { ActionHistoryEntry } from '@shared/schema';

export function DevEventLog({ history }: { history: ActionHistoryEntry[] }) {
  const recent = history.slice(-12).reverse();
  return (
    <div className="fixed top-2 right-2 z-[999] bg-black/70 text-white rounded-md border border-white/20 p-2 text-xs min-w-[260px] max-w-[360px] max-h-[40vh] overflow-auto" data-testid="dev-event-log">
      <div className="font-bold text-sm mb-1">Event Log</div>
      {recent.length === 0 && <div className="opacity-70">No events yet</div>}
      {recent.map((e) => (
        <div key={e.id} className="flex justify-between gap-2 border-b border-white/10 py-0.5">
          <span className="truncate opacity-90">{e.playerName || e.type}</span>
          <span className="truncate text-right">{e.message}</span>
        </div>
      ))}
    </div>
  );
}

