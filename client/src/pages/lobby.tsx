import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NumberInput } from '@/components/ui/number-input';
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
  
  // Form state for Create Table modal
  const [tableName, setTableName] = useState('High Stakes');
  const [smallBlind, setSmallBlind] = useState(10);
  const [bigBlind, setBigBlind] = useState(20);
  const [minBuyIn, setMinBuyIn] = useState(200);
  const [maxBuyIn, setMaxBuyIn] = useState(1000);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Refs for focus management
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

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

  // Validation function for the form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!tableName.trim()) {
      newErrors.tableName = 'Table name is required';
    }
    
    if (bigBlind < smallBlind) {
      newErrors.bigBlind = 'Big blind must be greater than or equal to small blind';
    }
    
    if (minBuyIn > maxBuyIn) {
      newErrors.minBuyIn = 'Minimum buy-in must be less than or equal to maximum buy-in';
    }
    
    if (minBuyIn < bigBlind * 10) {
      newErrors.minBuyIn = `Minimum buy-in should be at least ${bigBlind * 10} (10x big blind)`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleCreateTable = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    createTableMutation.mutate({
      name: tableName,
      smallBlind: smallBlind,
      bigBlind: bigBlind,
      minBuyIn: minBuyIn,
      maxBuyIn: maxBuyIn,
      maxPlayers: 6,
    });
  };
  
  const resetForm = () => {
    setTableName('High Stakes');
    setSmallBlind(10);
    setBigBlind(20);
    setMinBuyIn(200);
    setMaxBuyIn(1000);
    setErrors({});
  };
  
  const handleDialogOpenChange = (open: boolean) => {
    setIsCreateDialogOpen(open);
    if (!open) {
      resetForm();
    } else {
      // Set focus to first input when dialog opens
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);
    }
  };
  
  // Add keyboard event handling for better accessibility
  useEffect(() => {
    if (isCreateDialogOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleDialogOpenChange(false);
        }
      };
      
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isCreateDialogOpen]);
  
  // Real-time validation for related fields
  useEffect(() => {
    // Skip validation on initial render or when dialog is closed
    if (!isCreateDialogOpen) return;
    
    const newErrors: Record<string, string> = {};
    
    // Validate small blind vs big blind
    if (bigBlind < smallBlind) {
      newErrors.smallBlind = 'Small blind must be less than or equal to big blind';
    }
    
    // Validate min vs max buy-in
    if (minBuyIn > maxBuyIn) {
      newErrors.maxBuyIn = 'Maximum buy-in must be greater than or equal to minimum buy-in';
    }
    
    // Validate min buy-in vs big blind
    if (minBuyIn < bigBlind * 10) {
      newErrors.minBuyIn = `Minimum buy-in should be at least ${bigBlind * 10} (10x big blind)`;
    }
    
    // Update errors, preserving unrelated errors and clearing fixed ones
    setErrors(prev => {
      const updated = { ...prev };
      
      // Clear errors for fields that are now valid
      if (bigBlind >= smallBlind) {
        delete updated.smallBlind;
        delete updated.bigBlind;
      }
      if (minBuyIn <= maxBuyIn) {
        delete updated.maxBuyIn;
      }
      if (minBuyIn >= bigBlind * 10) {
        // Only clear minBuyIn error if it was specifically about the 10x rule
        if (prev.minBuyIn?.includes('10x big blind')) {
          delete updated.minBuyIn;
        }
      }
      
      // Add new errors
      return { ...updated, ...newErrors };
    });
  }, [smallBlind, bigBlind, minBuyIn, maxBuyIn, isCreateDialogOpen]);

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
          <Dialog open={isCreateDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Card className="bg-card/80 backdrop-blur-lg border-2 border-dashed border-poker-primary/50 hover:border-poker-primary transition-all cursor-pointer hover:shadow-lg" data-testid="button-create-table">
                <CardContent className="flex flex-col items-center justify-center h-64">
                  <Plus className="h-12 w-12 text-poker-primary mb-4" />
                  <h3 className="text-xl font-bold mb-2">Create New Table</h3>
                  <p className="text-muted-foreground text-center">Set your own stakes and rules</p>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent 
              ref={dialogRef}
              className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto"
              aria-labelledby="create-table-title"
              aria-describedby="create-table-description"
              onOpenAutoFocus={(e) => {
                e.preventDefault();
                firstInputRef.current?.focus();
              }}
            >
              <form onSubmit={handleCreateTable} noValidate>
                <DialogHeader>
                  <DialogTitle id="create-table-title">Create New Table</DialogTitle>
                  <DialogDescription id="create-table-description">
                    Configure your poker table settings. Other players can join once it's created.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-6">
                  {/* Table Name Field */}
                  <div className="space-y-2">
                    <Label htmlFor="tableName">
                      Table Name
                    </Label>
                    <Input
                      ref={firstInputRef}
                      id="tableName"
                      name="tableName"
                      value={tableName}
                      onChange={(e) => {
                        setTableName(e.target.value);
                        if (errors.tableName) {
                          setErrors(prev => ({ ...prev, tableName: '' }));
                        }
                      }}
                      className="h-12"
                      placeholder="e.g., Friday Night Game"
                      aria-invalid={!!errors.tableName}
                      aria-describedby={errors.tableName ? 'tableName-error' : undefined}
                      data-testid="input-table-name"
                    />
                    {errors.tableName && (
                      <p id="tableName-error" className="text-sm text-destructive" role="alert">
                        {errors.tableName}
                      </p>
                    )}
                  </div>

                  {/* Small Blind Field */}
                  <div className="space-y-2">
                    <Label htmlFor="smallBlind">
                      Small Blind
                    </Label>
                    <NumberInput
                      id="smallBlind"
                      name="smallBlind"
                      value={smallBlind}
                      onChange={(value) => {
                        setSmallBlind(value);
                        if (errors.bigBlind) {
                          setErrors(prev => ({ ...prev, bigBlind: '' }));
                        }
                      }}
                      min={1}
                      max={1000}
                      step={1}
                      prefix="$"
                      helperText="Typical: $5-$25 for casual games"
                      errorMessage={errors.smallBlind}
                      data-testid="input-small-blind"
                    />
                  </div>

                  {/* Big Blind Field */}
                  <div className="space-y-2">
                    <Label htmlFor="bigBlind">
                      Big Blind
                    </Label>
                    <NumberInput
                      id="bigBlind"
                      name="bigBlind"
                      value={bigBlind}
                      onChange={(value) => {
                        setBigBlind(value);
                        if (errors.bigBlind) {
                          setErrors(prev => ({ ...prev, bigBlind: '' }));
                        }
                      }}
                      min={2}
                      max={2000}
                      step={1}
                      prefix="$"
                      helperText="Typical: $10-$50 (usually 2x small blind)"
                      errorMessage={errors.bigBlind}
                      data-testid="input-big-blind"
                    />
                  </div>

                  {/* Min Buy-in Field */}
                  <div className="space-y-2">
                    <Label htmlFor="minBuyIn">
                      Minimum Buy-in
                    </Label>
                    <NumberInput
                      id="minBuyIn"
                      name="minBuyIn"
                      value={minBuyIn}
                      onChange={(value) => {
                        setMinBuyIn(value);
                        if (errors.minBuyIn) {
                          setErrors(prev => ({ ...prev, minBuyIn: '' }));
                        }
                      }}
                      min={20}
                      max={50000}
                      step={10}
                      prefix="$"
                      helperText="Typical: 20-40x big blind"
                      errorMessage={errors.minBuyIn}
                      data-testid="input-min-buyin"
                    />
                  </div>

                  {/* Max Buy-in Field */}
                  <div className="space-y-2">
                    <Label htmlFor="maxBuyIn">
                      Maximum Buy-in
                    </Label>
                    <NumberInput
                      id="maxBuyIn"
                      name="maxBuyIn"
                      value={maxBuyIn}
                      onChange={(value) => {
                        setMaxBuyIn(value);
                        if (errors.minBuyIn || errors.maxBuyIn) {
                          setErrors(prev => ({ ...prev, minBuyIn: '', maxBuyIn: '' }));
                        }
                      }}
                      min={100}
                      max={100000}
                      step={10}
                      prefix="$"
                      helperText="Typical: 100-200x big blind"
                      errorMessage={errors.maxBuyIn}
                      data-testid="input-max-buyin"
                    />
                  </div>
                </div>
                <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => handleDialogOpenChange(false)}
                    data-testid="button-cancel-create"
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createTableMutation.isPending}
                    data-testid="button-confirm-create"
                    className="w-full sm:w-auto"
                  >
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