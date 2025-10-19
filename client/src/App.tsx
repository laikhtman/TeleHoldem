import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TelegramAuthGate } from "@/components/TelegramAuthGate";
import PokerGame from "@/pages/poker-game";

function Router() {
  return (
    <Switch>
      <Route path="/demo">
        <PokerGame />
      </Route>
      <Route path="/">
        <TelegramAuthGate>
          <PokerGame />
        </TelegramAuthGate>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
