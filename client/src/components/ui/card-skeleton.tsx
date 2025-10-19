import { cn } from "@/lib/utils";

interface CardSkeletonProps {
  className?: string;
  'data-testid'?: string;
}

export function CardSkeleton({ className, 'data-testid': dataTestId }: CardSkeletonProps) {
  return (
    <div
      className={cn(
        "w-[70px] h-[100px] rounded-lg bg-black/20 border-2 border-dashed border-white/20 animate-pulse",
        className
      )}
      data-testid={dataTestId}
    />
  );
}
