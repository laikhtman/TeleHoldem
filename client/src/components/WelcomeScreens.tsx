import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, Tent, Diamond, DollarSign, CreditCard, Bitcoin } from 'lucide-react';
import { SiEthereum, SiMastercard } from 'react-icons/si';

interface WelcomeScreensProps {
  onComplete: () => void;
}

const screens = [
  {
    icon: <Tent className="h-12 w-12 text-green-400" />,
    title: "Discover Diverse Game Zones",
    description: "Whether you're a beginner or a pro, find the perfect table to match your skill level and ambition.",
    visual: (
      <div className="relative mx-auto mb-8 h-48 w-full max-w-sm">
        {/* Checkered pattern background */}
        <div className="absolute inset-0 opacity-20">
          <svg className="h-full w-full" viewBox="0 0 400 200">
            <pattern id="checkers" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <rect x="0" y="0" width="20" height="20" fill="white" />
              <rect x="20" y="20" width="20" height="20" fill="white" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#checkers)" />
          </svg>
        </div>
        
        {/* Forest hideout card */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform">
          <div className="rounded-xl bg-gradient-to-br from-green-900/90 to-green-800/90 p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <Tent className="h-8 w-8 text-green-400" />
              <div>
                <h3 className="text-lg font-bold text-white">Forest hideout</h3>
                <p className="text-xs text-green-200">A cozy woodland poker spot with a rustic table and lantern light.</p>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className="text-green-300">⚡ 0.5/10</span>
                  <span className="text-green-300">👤 50</span>
                  <span className="text-green-300">⏱️ 0 M</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: <Diamond className="h-12 w-12 text-amber-400" fill="currentColor" />,
    title: "Get the Chips You Need",
    description: "From small stakes to high rollers, choose chip values that fit your strategy and budget.",
    visual: (
      <div className="relative mx-auto mb-8 flex h-48 w-full max-w-sm items-center justify-center">
        {/* Three poker chips */}
        <div className="flex items-center justify-center gap-4">
          {/* Purple chip */}
          <div className="relative">
            <div className="h-24 w-24 rounded-full border-4 border-purple-600 bg-gradient-to-br from-purple-500 to-purple-700 shadow-xl">
              <div className="flex h-full items-center justify-center">
                <Diamond className="h-10 w-10 text-purple-200" fill="currentColor" />
              </div>
            </div>
            <div className="absolute -bottom-1 left-1/2 h-12 w-12 -translate-x-1/2 rounded-full bg-purple-700/30 blur-lg" />
          </div>

          {/* Gold chip (center, larger) */}
          <div className="relative z-10 -mt-4">
            <div className="h-32 w-32 rounded-full border-4 border-amber-500 bg-gradient-to-br from-amber-400 to-amber-600 shadow-2xl">
              <div className="flex h-full items-center justify-center">
                <Diamond className="h-14 w-14 text-amber-100" fill="currentColor" />
              </div>
            </div>
            <div className="absolute -bottom-1 left-1/2 h-16 w-16 -translate-x-1/2 rounded-full bg-amber-500/30 blur-lg" />
          </div>

          {/* Green chip */}
          <div className="relative">
            <div className="h-24 w-24 rounded-full border-4 border-green-600 bg-gradient-to-br from-green-500 to-green-700 shadow-xl">
              <div className="flex h-full items-center justify-center">
                <Diamond className="h-10 w-10 text-green-200" fill="currentColor" />
              </div>
            </div>
            <div className="absolute -bottom-1 left-1/2 h-12 w-12 -translate-x-1/2 rounded-full bg-green-700/30 blur-lg" />
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: <CreditCard className="h-12 w-12 text-blue-400" />,
    title: "Pay Your Way: Anytime, Anywhere",
    description: "Enjoy the flexibility of paying with crypto or fiat—fast, secure, and tailored to your preferences.",
    visual: (
      <div className="relative mx-auto mb-8 flex h-48 w-full max-w-sm items-center justify-center">
        {/* Payment method icons in a circular arrangement */}
        <div className="relative h-48 w-48">
          {/* Background blur circles */}
          <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-2xl" />
          
          {/* PayPal - top */}
          <div className="absolute left-1/2 top-0 -translate-x-1/2">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-900/80 shadow-xl backdrop-blur-sm">
              <span className="text-2xl font-bold text-blue-400">P</span>
            </div>
          </div>

          {/* Emoji smiley - top right */}
          <div className="absolute right-2 top-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-900/80 shadow-xl backdrop-blur-sm">
              <span className="text-2xl">😊</span>
            </div>
          </div>

          {/* Mastercard - right */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-900/80 shadow-xl backdrop-blur-sm">
              <SiMastercard className="h-8 w-8 text-orange-400" />
            </div>
          </div>

          {/* MetaMask fox - bottom right */}
          <div className="absolute bottom-8 right-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-900/80 shadow-xl backdrop-blur-sm">
              <span className="text-2xl">🦊</span>
            </div>
          </div>

          {/* Ethereum - bottom */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-900/80 shadow-xl backdrop-blur-sm">
              <SiEthereum className="h-8 w-8 text-purple-400" />
            </div>
          </div>

          {/* Another payment icon - bottom left */}
          <div className="absolute bottom-8 left-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-900/80 shadow-xl backdrop-blur-sm">
              <Bitcoin className="h-8 w-8 text-orange-400" />
            </div>
          </div>

          {/* Dollar sign - left */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-900/80 shadow-xl backdrop-blur-sm">
              <DollarSign className="h-8 w-8 text-green-400" />
            </div>
          </div>

          {/* Another icon - top left */}
          <div className="absolute left-2 top-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-900/80 shadow-xl backdrop-blur-sm">
              <CreditCard className="h-8 w-8 text-blue-400" />
            </div>
          </div>
        </div>
      </div>
    ),
  },
];

export default function WelcomeScreens({ onComplete }: WelcomeScreensProps) {
  const [currentScreen, setCurrentScreen] = useState(0);

  const handleNext = () => {
    if (currentScreen < screens.length - 1) {
      setCurrentScreen(currentScreen + 1);
    }
  };

  const handleStartPlaying = () => {
    onComplete();
  };

  const handleSkip = () => {
    onComplete();
  };

  const current = screens[currentScreen];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-gray-900 via-gray-950 to-black">
      {/* Header with skip button */}
      <div className="absolute right-4 top-4 z-10">
        <button
          onClick={handleSkip}
          className="text-gray-400 transition-colors hover:text-white"
          data-testid="button-skip-welcome"
        >
          <span className="flex items-center gap-1 text-sm">
            Skip
            <ChevronRight className="h-4 w-4" />
          </span>
        </button>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        {/* Welcome text (only on first screen) */}
        {currentScreen === 0 && (
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-white">Welcome to Poker</h1>
          </div>
        )}

        {/* Visual element */}
        {current.visual}

        {/* Title */}
        <h2 className="mb-4 text-center text-2xl font-bold text-white">
          {current.title}
        </h2>

        {/* Description */}
        <p className="mx-auto mb-12 max-w-md text-center text-sm leading-relaxed text-gray-400">
          {current.description}
        </p>

        {/* Dots indicator */}
        <div className="mb-8 flex gap-2">
          {screens.map((_, index) => (
            <div
              key={index}
              className={`h-2 transition-all duration-300 ${
                index === currentScreen
                  ? 'w-8 rounded-full bg-amber-400'
                  : 'w-2 rounded-full bg-gray-600'
              }`}
              data-testid={`dot-indicator-${index}`}
            />
          ))}
        </div>

        {/* Action button */}
        <div className="w-full max-w-xs">
          {currentScreen < screens.length - 1 ? (
            <Button
              onClick={handleNext}
              variant="default"
              size="lg"
              className="w-full bg-gradient-to-r from-amber-400 to-amber-500 font-bold text-black hover:from-amber-500 hover:to-amber-600"
              data-testid="button-next-welcome"
            >
              NEXT
            </Button>
          ) : (
            <Button
              onClick={handleStartPlaying}
              variant="default"
              size="lg"
              className="w-full bg-gradient-to-r from-amber-400 to-amber-500 font-bold text-black hover:from-amber-500 hover:to-amber-600"
              data-testid="button-start-playing"
            >
              START PLAYING
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}