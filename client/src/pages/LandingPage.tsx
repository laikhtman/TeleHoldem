import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spade, Heart, Diamond, Club, ArrowRight, Zap, MessageCircle, CheckCircle, AlertCircle } from "lucide-react";
import { useTelegramWebApp } from "@/hooks/useTelegramWebApp";

export default function LandingPage() {
  const { isInTelegram, initData } = useTelegramWebApp();
  const [, navigate] = useLocation();
  
  // Only redirect if truly in Telegram (has initData from Telegram)
  useEffect(() => {
    // Check if we have actual Telegram initData (not just the SDK loaded)
    if (isInTelegram && initData && initData.length > 0) {
      navigate("/game");
    }
  }, [isInTelegram, initData, navigate]);
  
  // Landing page for non-Telegram users
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main content with safe area padding */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8" style={{ paddingTop: `calc(2rem + var(--safe-area-top))`, paddingBottom: `calc(2rem + var(--safe-area-bottom))` }}>
        <div className="w-full max-w-5xl">
          {/* Animated Hero Section */}
          <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-center gap-3 mb-6">
              <Spade className="w-10 h-10 md:w-12 md:h-12 text-foreground animate-in fade-in zoom-in duration-500 delay-100" />
              <Heart className="w-10 h-10 md:w-12 md:h-12 text-red-500 animate-in fade-in zoom-in duration-500 delay-200" />
              <Diamond className="w-10 h-10 md:w-12 md:h-12 text-red-500 animate-in fade-in zoom-in duration-500 delay-300" />
              <Club className="w-10 h-10 md:w-12 md:h-12 text-foreground animate-in fade-in zoom-in duration-500 delay-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Play Texas Hold'em
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Master your poker skills against smart AI opponents
            </p>
          </div>
          
          {/* Cards Grid - Stack vertically on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            {/* Demo Mode Card */}
            <Card className="border-2 h-full flex flex-col focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all duration-200 hover:border-primary/50">
              <CardHeader className="p-6 pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Zap className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Demo Mode</CardTitle>
                    <CardDescription className="text-sm mt-1">
                      Try it now - No account needed
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-2 flex-1 flex flex-col">
                <ul className="space-y-3 mb-6 flex-1">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Instant access</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">All features unlocked</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                    <span className="text-sm">Progress not saved</span>
                  </li>
                </ul>
                <div className="space-y-3">
                  <Link href="/lobby">
                    <Button 
                      className="w-full min-h-[48px]" 
                      size="lg"
                      data-testid="button-lobby"
                      aria-label="Enter the game lobby in demo mode"
                    >
                      Enter Lobby
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/demo">
                    <Button 
                      className="w-full min-h-[48px]" 
                      size="lg"
                      variant="outline"
                      data-testid="button-play-demo"
                      aria-label="Quick play a single table game"
                    >
                      Quick Play
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
            
            {/* Telegram Mode Card */}
            <Card className="border-2 h-full flex flex-col focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all duration-200 hover:border-primary/50">
              <CardHeader className="p-6 pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <MessageCircle className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Telegram App</CardTitle>
                    <CardDescription className="text-sm mt-1">
                      Play with your account
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-2 flex-1 flex flex-col">
                <ul className="space-y-3 mb-6 flex-1">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    <span className="text-sm">Save your progress</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    <span className="text-sm">Track statistics</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    <span className="text-sm">Secure authentication</span>
                  </li>
                </ul>
                <div className="space-y-3">
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <MessageCircle className="w-10 h-10 text-blue-500 mx-auto mb-3" />
                    <p className="font-medium text-sm">Open in Telegram</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Full experience with saved progress
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Help text */}
          <div className="mt-12 text-center animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Demo Mode</span> is perfect for testing • 
              <span className="font-medium"> Telegram App</span> saves your game history
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}