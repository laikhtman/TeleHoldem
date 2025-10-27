/**
 * Performance utilities for monitoring and optimizing the poker application
 */

/**
 * Measure component render performance
 */
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();
  private measures: Map<string, number[]> = new Map();
  private enabled: boolean;

  constructor(enabled: boolean = process.env.NODE_ENV === 'development') {
    this.enabled = enabled;
  }

  startMeasure(name: string) {
    if (!this.enabled) return;
    this.marks.set(name, performance.now());
  }

  endMeasure(name: string) {
    if (!this.enabled) return;
    const start = this.marks.get(name);
    if (start) {
      const duration = performance.now() - start;
      const measures = this.measures.get(name) || [];
      measures.push(duration);
      this.measures.set(name, measures);
      this.marks.delete(name);
      
      // Log slow renders in development
      if (duration > 16.67) { // Slower than 60fps
        console.warn(`[Performance] ${name} took ${duration.toFixed(2)}ms`);
      }
    }
  }

  getAverageTime(name: string): number | null {
    const measures = this.measures.get(name);
    if (!measures || measures.length === 0) return null;
    
    const sum = measures.reduce((acc, val) => acc + val, 0);
    return sum / measures.length;
  }

  getReport() {
    const report: Record<string, any> = {};
    
    for (const [name, measures] of this.measures) {
      if (measures.length > 0) {
        const sum = measures.reduce((acc, val) => acc + val, 0);
        const avg = sum / measures.length;
        const max = Math.max(...measures);
        const min = Math.min(...measures);
        
        report[name] = {
          count: measures.length,
          average: avg.toFixed(2),
          max: max.toFixed(2),
          min: min.toFixed(2),
          total: sum.toFixed(2)
        };
      }
    }
    
    return report;
  }

  clear() {
    this.marks.clear();
    this.measures.clear();
  }
}

/**
 * Batch DOM updates using requestAnimationFrame
 */
export class DOMBatcher {
  private queue: (() => void)[] = [];
  private rafId: number | null = null;

  add(callback: () => void) {
    this.queue.push(callback);
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
    const callbacks = [...this.queue];
    this.queue = [];
    this.rafId = null;
    
    callbacks.forEach(callback => callback());
  }

  clear() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.queue = [];
  }
}

/**
 * Preload images for better performance
 */
export function preloadImages(urls: string[]): Promise<void[]> {
  return Promise.all(
    urls.map(url => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
        img.src = url;
      });
    })
  );
}

/**
 * Debounce resize events for better performance
 */
export function createResizeObserver(
  element: HTMLElement,
  callback: (entry: ResizeObserverEntry) => void,
  delay: number = 100
) {
  let timeoutId: NodeJS.Timeout | null = null;
  
  const debouncedCallback = (entries: ResizeObserverEntry[]) => {
    if (timeoutId) clearTimeout(timeoutId);
    
    timeoutId = setTimeout(() => {
      requestAnimationFrame(() => {
        callback(entries[0]);
      });
    }, delay);
  };
  
  const observer = new ResizeObserver(debouncedCallback);
  observer.observe(element);
  
  return () => {
    if (timeoutId) clearTimeout(timeoutId);
    observer.disconnect();
  };
}

/**
 * Memory cache for expensive calculations
 */
export class MemoryCache<K, V> {
  private cache: Map<K, { value: V; timestamp: number }> = new Map();
  private maxSize: number;
  private ttl: number;

  constructor(maxSize: number = 100, ttl: number = 60000) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) return undefined;
    
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }
    
    return entry.value;
  }

  set(key: K, value: V) {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, { value, timestamp: Date.now() });
  }

  clear() {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Detect if the device has low performance
 */
export function isLowPerformanceDevice(): boolean {
  // Check for reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return true;
  }
  
  // Check device memory (if available)
  const deviceMemory = (navigator as any).deviceMemory;
  if (deviceMemory && deviceMemory < 4) {
    return true;
  }
  
  // Check hardware concurrency (CPU cores)
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
    return true;
  }
  
  // Check connection type (if available)
  const connection = (navigator as any).connection;
  if (connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')) {
    return true;
  }
  
  return false;
}

/**
 * FPS counter for performance monitoring
 */
export class FPSCounter {
  private lastTime: number = performance.now();
  private fps: number = 0;
  private frames: number = 0;
  private callback?: (fps: number) => void;
  private rafId: number | null = null;

  start(callback?: (fps: number) => void) {
    this.callback = callback;
    this.lastTime = performance.now();
    this.frames = 0;
    this.tick();
  }

  private tick = () => {
    this.frames++;
    const currentTime = performance.now();
    
    if (currentTime >= this.lastTime + 1000) {
      this.fps = Math.round(this.frames * 1000 / (currentTime - this.lastTime));
      this.frames = 0;
      this.lastTime = currentTime;
      
      if (this.callback) {
        this.callback(this.fps);
      }
    }
    
    this.rafId = requestAnimationFrame(this.tick);
  };

  stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  getFPS(): number {
    return this.fps;
  }
}