import { useEffect, useRef, useState } from 'react';

export function FPSOverlay() {
  const [fps, setFps] = useState(0);
  const last = useRef(performance.now());
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    let frames = 0;
    const loop = (time: number) => {
      frames++;
      if (time - last.current >= 1000) {
        setFps(frames);
        frames = 0;
        last.current = time;
      }
      rafId.current = requestAnimationFrame(loop);
    };
    rafId.current = requestAnimationFrame(loop);
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <div className="fixed top-2 right-2 z-[1000] bg-black/70 text-white rounded-md border border-white/20 px-2 py-1 text-xs" data-testid="fps-overlay">
      {fps} FPS
    </div>
  );
}

