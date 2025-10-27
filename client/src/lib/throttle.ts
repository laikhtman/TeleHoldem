/**
 * Throttle function that limits how often a function can be called
 * Uses requestAnimationFrame for optimal browser performance
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  let lastTime = 0;
  let rafId: number | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;
    const now = Date.now();
    
    if (!inThrottle || now - lastTime >= limit) {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      
      rafId = requestAnimationFrame(() => {
        func.apply(context, args);
        lastTime = now;
        inThrottle = true;
        
        setTimeout(() => {
          inThrottle = false;
        }, limit);
      });
    }
  };
}

/**
 * Debounce function that delays invoking func until after wait milliseconds
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate: boolean = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  let rafId: number | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;
    
    const later = () => {
      timeout = null;
      if (!immediate && rafId === null) {
        rafId = requestAnimationFrame(() => {
          func.apply(context, args);
          rafId = null;
        });
      }
    };

    const callNow = immediate && !timeout;
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    
    timeout = setTimeout(later, wait);
    
    if (callNow) {
      rafId = requestAnimationFrame(() => {
        func.apply(context, args);
        rafId = null;
      });
    }
  };
}

/**
 * RAF-based throttle specifically for animation functions
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastContext: any = null;

  const invoke = () => {
    if (lastArgs && lastContext) {
      func.apply(lastContext, lastArgs);
      lastArgs = null;
      lastContext = null;
    }
  };

  return function (this: any, ...args: Parameters<T>) {
    lastArgs = args;
    lastContext = this;

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        invoke();
        rafId = null;
      });
    }
  };
}

/**
 * Batch multiple updates into a single RAF call
 */
export class BatchedUpdates {
  private updates: Map<string, () => void> = new Map();
  private rafId: number | null = null;

  add(key: string, update: () => void) {
    this.updates.set(key, update);
    this.schedule();
  }

  private schedule() {
    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(() => {
        this.flush();
      });
    }
  }

  private flush() {
    const updates = Array.from(this.updates.values());
    this.updates.clear();
    this.rafId = null;
    
    updates.forEach(update => update());
  }

  clear() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.updates.clear();
  }
}