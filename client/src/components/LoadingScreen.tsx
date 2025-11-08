import { useEffect, useState } from 'react';
import { Diamond } from 'lucide-react';

const loadingTips = [
  "Check the promotional chips, they usually sell extremely profitably!",
  "Patience is key - wait for premium hands in early position.",
  "Watch your opponents' betting patterns to spot tells.",
  "The button position is the most profitable seat at the table.",
  "Manage your bankroll - never play with more than you can afford to lose.",
  "Bluffing works best when you've shown strong hands before.",
  "Position is power - play more hands when you act last.",
  "Don't chase losses - take a break if you're on tilt.",
  "Study pot odds to make profitable calls.",
  "Mix up your play to keep opponents guessing.",
  "Tight-aggressive play is the most profitable style for beginners.",
  "Always consider what hands your opponent might have.",
  "Fold more often pre-flop - it's the easiest way to improve.",
  "Pay attention even when you're not in the hand.",
  "Tournament strategy differs from cash game strategy.",
];

interface LoadingScreenProps {
  onComplete?: () => void;
  minDuration?: number;
}

export default function LoadingScreen({ onComplete, minDuration = 3000 }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [currentTip, setCurrentTip] = useState('');

  useEffect(() => {
    // Select a random tip
    const randomTip = loadingTips[Math.floor(Math.random() * loadingTips.length)];
    setCurrentTip(randomTip);

    // Simulate loading progress
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / minDuration) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          onComplete?.();
        }, 200);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [minDuration, onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#1a1a1a]">
      {/* Main content container */}
      <div className="flex flex-col items-center justify-center flex-1 px-8">
        {/* Circular loader with diamond icon */}
        <div className="relative mb-20">
          <div className="relative h-32 w-32">
            {/* Background circle */}
            <svg
              className="absolute inset-0 -rotate-90 transform"
              viewBox="0 0 128 128"
            >
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="#333"
                strokeWidth="8"
                fill="none"
              />
            </svg>

            {/* Progress circle */}
            <svg
              className="absolute inset-0 -rotate-90 transform"
              viewBox="0 0 128 128"
            >
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="#facc15"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${(progress / 100) * 351.86} 351.86`}
                className="transition-all duration-300 ease-out"
              />
            </svg>

            {/* Diamond icon in center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <Diamond className="h-12 w-12 text-amber-400" fill="currentColor" />
              </div>
            </div>
          </div>
        </div>

        {/* Advice section */}
        <div className="text-center mb-8">
          <h3 className="mb-4 text-lg font-bold text-amber-400">Advice</h3>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-gray-300 px-4">
            {currentTip}
          </p>
        </div>
      </div>

      {/* Progress bar at bottom */}
      <div className="w-full px-8 pb-8">
        <div className="h-1 w-full overflow-hidden rounded-full bg-gray-800">
          <div
            className="h-full rounded-full bg-amber-400 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}