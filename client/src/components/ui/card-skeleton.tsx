import { cn } from "@/lib/utils";

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "w-[70px] h-[100px] rounded-lg bg-black/20 border-2 border-dashed border-white/20 animate-pulse",
        className
      )}
    />
  );
}
