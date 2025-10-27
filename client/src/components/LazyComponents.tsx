import { lazy, Suspense, ComponentType } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { PokerSpinner } from '@/components/PokerLoader';

// Lazy load heavy components with code splitting
export const LazyHandDistributionChart = lazy(() => import('./HandDistributionChart').then(module => ({ default: module.HandDistributionChart })));
export const LazyAchievementsList = lazy(() => import('./AchievementsList').then(module => ({ default: module.AchievementsList })));
export const LazySettingsPanel = lazy(() => import('./SettingsPanel').then(module => ({ default: module.SettingsPanel })));

// Loading states for different component types
export const ChartSkeleton = () => (
  <div className="rounded-lg bg-black/70 p-3 text-white mt-4">
    <Skeleton className="h-6 w-48 mb-2 mx-auto" />
    <Skeleton className="h-[200px] w-full" />
  </div>
);

export const AchievementsSkeleton = () => (
  <div className="rounded-lg bg-black/70 p-3 text-white mt-4">
    <Skeleton className="h-5 w-32 mb-2 mx-auto" />
    <div className="flex flex-col gap-2">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-start gap-2 p-2">
          <Skeleton className="h-5 w-5 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const SettingsSkeleton = () => (
  <div className="p-4">
    <PokerSpinner />
  </div>
);

// Wrapper component for lazy loaded components with error boundary
interface LazyComponentWrapperProps<T> {
  Component: ComponentType<T>;
  fallback?: React.ReactNode;
  props: T;
}

export function LazyComponentWrapper<T>({ 
  Component, 
  fallback,
  props 
}: LazyComponentWrapperProps<T>) {
  return (
    <Suspense fallback={fallback || <PokerSpinner />}>
      <Component {...props} />
    </Suspense>
  );
}

// Lazy load tabs content in RightSidebarPanel
export const LazyActionHistory = lazy(
  () => import('./ActionHistory').then(module => ({ 
    default: module.ActionHistory 
  }))
);

export const LazySessionStats = lazy(
  () => import('./SessionStats').then(module => ({ 
    default: module.SessionStats 
  }))
);

// Loading skeleton for sidebar content
export const SidebarContentSkeleton = () => (
  <div className="p-4">
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-3/4 mb-2" />
    <Skeleton className="h-4 w-5/6" />
  </div>
);