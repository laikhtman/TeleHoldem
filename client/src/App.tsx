import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TelegramAuthGate } from "@/components/TelegramAuthGate";
import { ThemeProvider } from "@/contexts/ThemeContext";
import PokerGame from "@/pages/poker-game";
import SettingsPage from "@/pages/SettingsPage";
import LandingPage from "@/pages/LandingPage";
import HelpPage from "@/pages/HelpPage";
import Lobby from "@/pages/lobby";

function Router() {
  return (
    <Switch>
      <Route path="/help">
        <HelpPage />
      </Route>
      <Route path="/settings">
        <SettingsPage />
      </Route>
      <Route path="/lobby">
        <Lobby />
      </Route>
      <Route path="/demo">
        <PokerGame />
      </Route>
      <Route path="/game">
        <PokerGame />
      </Route>
      <Route path="/">
        <LandingPage />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
