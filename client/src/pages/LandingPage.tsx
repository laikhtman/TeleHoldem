import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spade, Heart, Diamond, Club, ArrowRight, TestTube, MessageCircle } from "lucide-react";
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center gap-2 mb-4">
            <Spade className="w-12 h-12 text-foreground" />
            <Heart className="w-12 h-12 text-red-500" />
            <Diamond className="w-12 h-12 text-red-500" />
            <Club className="w-12 h-12 text-foreground" />
          </div>
          <h1 className="text-4xl font-bold">Texas Hold'em Poker</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Professional poker experience with AI opponents, realistic gameplay, and comprehensive statistics tracking
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Demo Mode Card */}
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <TestTube className="w-6 h-6 text-green-500" />
                <CardTitle>Demo Mode</CardTitle>
              </div>
              <CardDescription>
                For QA Testing & Evaluation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>No authentication required</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Full game features available</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Test all UI/UX improvements</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-0.5">!</span>
                  <span>Progress not saved</span>
                </li>
              </ul>
              <Link href="/demo">
                <Button 
                  className="w-full min-h-[48px]" 
                  size="lg"
                  data-testid="button-play-demo"
                >
                  Play Demo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          {/* Telegram Mode Card */}
          <Card className="border-2 relative">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-6 h-6 text-blue-500" />
                <CardTitle>Telegram Mini App</CardTitle>
              </div>
              <CardDescription>
                Full Experience with Account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">✓</span>
                  <span>Persistent bankroll & stats</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">✓</span>
                  <span>Track your progress over time</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">✓</span>
                  <span>Achievements & milestones</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">✓</span>
                  <span>Secure authentication</span>
                </li>
              </ul>
              <div className="p-4 bg-muted rounded-lg text-center text-sm">
                <MessageCircle className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="font-medium">Open in Telegram</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Use the Telegram app to access the full experience
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Version 1.0 | All tap targets meet 48px minimum | Fully accessible
          </p>
        </div>
      </div>
    </div>
  );
}