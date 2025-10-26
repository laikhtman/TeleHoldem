import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Users, Trophy, DollarSign, Plus, Spade, Heart, Diamond, Club, LogOut } from 'lucide-react';
import type { PokerTable } from '@shared/schema';

export default function Lobby() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [joinBuyIn, setJoinBuyIn] = useState(500);

  // Fetch active tables
  const { data: tablesData, isLoading } = useQuery({
    queryKey: ['/api/tables'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Create table mutation
  const createTableMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      smallBlind: number;
      bigBlind: number;
      minBuyIn: number;
      maxBuyIn: number;
      maxPlayers: number;
    }) => {
      const res = await apiRequest('POST', '/api/tables', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tables'] });
      setIsCreateDialogOpen(false);
      toast({
        title: 'Table created',
        description: 'Your table has been created successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create table. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Join table mutation
  const joinTableMutation = useMutation({
    mutationFn: async ({ tableId, buyIn }: { tableId: number; buyIn: number }) => {
      const res = await apiRequest('POST', `/api/tables/${tableId}/join`, {
        buyInAmount: buyIn,
        seatNumber: Math.floor(Math.random() * 6), // Random seat for now
        playerName: 'Player',
      });
      return res.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: 'Joined table',
        description: 'You have successfully joined the table.',
      });
      // Navigate to the game with the table ID
      setLocation(`/game?tableId=${variables.tableId}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to join table. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleCreateTable = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createTableMutation.mutate({
      name: formData.get('name') as string,
      smallBlind: parseInt(formData.get('smallBlind') as string),
      bigBlind: parseInt(formData.get('bigBlind') as string),
      minBuyIn: parseInt(formData.get('minBuyIn') as string),
      maxBuyIn: parseInt(formData.get('maxBuyIn') as string),
      maxPlayers: 6,
    });
  };

  const handleJoinTable = (tableId: number, minBuyIn: number, maxBuyIn: number) => {
    setSelectedTable(tableId);
    setJoinBuyIn(Math.min(maxBuyIn, Math.max(minBuyIn, 500)));
  };

  const confirmJoinTable = () => {
    if (selectedTable) {
      joinTableMutation.mutate({ tableId: selectedTable, buyIn: joinBuyIn });
    }
  };

  const tables = tablesData?.tables || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-poker-felt to-poker-feltDark p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex items-center gap-2 text-white">
              <Spade className="h-8 w-8 fill-current" />
              <Heart className="h-8 w-8 fill-current text-red-500" />
              <Diamond className="h-8 w-8 fill-current text-red-500" />
              <Club className="h-8 w-8 fill-current" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Texas Hold'em Lobby</h1>
          <p className="text-poker-muted text-lg">Choose a table to join or create your own</p>
        </div>

        {/* Quick Play Button - For Demo */}
        <div className="mb-6 flex justify-center">
          <Link href="/demo">
            <Button
              size="lg"
              className="bg-poker-primary hover:bg-poker-primary/80 text-white font-bold px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all"
              data-testid="button-quick-play"
            >
              <Trophy className="mr-2 h-5 w-5" />
              Quick Play (Demo)
            </Button>
          </Link>
        </div>

        {/* Tables Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Create New Table Card */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Card className="bg-card/80 backdrop-blur-lg border-2 border-dashed border-poker-primary/50 hover:border-poker-primary transition-all cursor-pointer hover:shadow-lg" data-testid="button-create-table">
                <CardContent className="flex flex-col items-center justify-center h-64">
                  <Plus className="h-12 w-12 text-poker-primary mb-4" />
                  <h3 className="text-xl font-bold mb-2">Create New Table</h3>
                  <p className="text-muted-foreground text-center">Set your own stakes and rules</p>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleCreateTable}>
                <DialogHeader>
                  <DialogTitle>Create New Table</DialogTitle>
                  <DialogDescription>
                    Configure your poker table settings. Other players can join once it's created.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Table Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue="High Stakes"
                      className="col-span-3"
                      required
                      data-testid="input-table-name"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="smallBlind" className="text-right">
                      Small Blind
                    </Label>
                    <Input
                      id="smallBlind"
                      name="smallBlind"
                      type="number"
                      defaultValue="10"
                      className="col-span-3"
                      required
                      min="1"
                      data-testid="input-small-blind"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="bigBlind" className="text-right">
                      Big Blind
                    </Label>
                    <Input
                      id="bigBlind"
                      name="bigBlind"
                      type="number"
                      defaultValue="20"
                      className="col-span-3"
                      required
                      min="2"
                      data-testid="input-big-blind"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="minBuyIn" className="text-right">
                      Min Buy-in
                    </Label>
                    <Input
                      id="minBuyIn"
                      name="minBuyIn"
                      type="number"
                      defaultValue="200"
                      className="col-span-3"
                      required
                      min="20"
                      data-testid="input-min-buyin"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="maxBuyIn" className="text-right">
                      Max Buy-in
                    </Label>
                    <Input
                      id="maxBuyIn"
                      name="maxBuyIn"
                      type="number"
                      defaultValue="1000"
                      className="col-span-3"
                      required
                      min="100"
                      data-testid="input-max-buyin"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createTableMutation.isPending} data-testid="button-confirm-create">
                    {createTableMutation.isPending ? 'Creating...' : 'Create Table'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Active Tables */}
          {isLoading ? (
            <div className="col-span-full text-center text-white">
              <p>Loading tables...</p>
            </div>
          ) : tables.length === 0 ? (
            <div className="col-span-full text-center text-poker-muted">
              <p className="text-lg">No active tables yet. Create one to get started!</p>
            </div>
          ) : (
            tables.map((table: PokerTable) => (
              <Card key={table.id} className="bg-card/80 backdrop-blur-lg hover:shadow-lg transition-all" data-testid={`card-table-${table.id}`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{table.name}</span>
                    {table.currentPlayers === table.maxPlayers && (
                      <Badge variant="destructive">Full</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Blinds: ${table.smallBlind}/${table.bigBlind}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{table.currentPlayers}/{table.maxPlayers} players</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-poker-chipGold" />
                      <span>Buy-in: ${table.minBuyIn} - ${table.maxBuyIn}</span>
                    </div>
                  </div>
                  {table.gameState && (
                    <Badge variant="secondary" className="w-full justify-center">
                      {table.gameState.phase === 'waiting' ? 'Waiting for players' : `In progress: ${table.gameState.phase}`}
                    </Badge>
                  )}
                </CardContent>
                <CardFooter>
                  <Dialog open={selectedTable === table.id} onOpenChange={(open) => !open && setSelectedTable(null)}>
                    <DialogTrigger asChild>
                      <Button
                        className="w-full"
                        variant={table.currentPlayers === table.maxPlayers ? 'secondary' : 'default'}
                        disabled={table.currentPlayers === table.maxPlayers}
                        onClick={() => handleJoinTable(table.id, table.minBuyIn, table.maxBuyIn)}
                        data-testid={`button-join-table-${table.id}`}
                      >
                        {table.currentPlayers === table.maxPlayers ? 'Table Full' : 'Join Table'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Join {table.name}</DialogTitle>
                        <DialogDescription>
                          Choose your buy-in amount to join this table.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="buyIn">Buy-in Amount: ${joinBuyIn}</Label>
                          <Slider
                            id="buyIn"
                            min={table.minBuyIn}
                            max={table.maxBuyIn}
                            step={10}
                            value={[joinBuyIn]}
                            onValueChange={(value) => setJoinBuyIn(value[0])}
                            className="w-full"
                            data-testid="slider-buyin"
                          />
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>${table.minBuyIn}</span>
                            <span>${table.maxBuyIn}</span>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={confirmJoinTable}
                          disabled={joinTableMutation.isPending}
                          data-testid="button-confirm-join"
                        >
                          {joinTableMutation.isPending ? 'Joining...' : `Join with $${joinBuyIn}`}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              </Card>
            ))
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center text-poker-muted">
          <p className="text-sm">
            Tip: Tables refresh automatically every 5 seconds
          </p>
        </div>
      </div>
    </div>
  );
}