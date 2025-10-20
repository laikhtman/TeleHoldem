import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Database, 
  Send, 
  Server, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Save
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface SystemStatus {
  database: {
    connected: boolean;
    type: string;
  };
  telegram: {
    configured: boolean;
    botTokenPresent: boolean;
  };
  environment: string;
  version: string;
}

interface AppSetting {
  id: number;
  key: string;
  value: any;
  description: string | null;
  updatedAt: string;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [defaultBankroll, setDefaultBankroll] = useState('1000');
  const [sessionDuration, setSessionDuration] = useState('7');

  // Fetch system status
  const { data: statusData, isLoading: statusLoading, refetch: refetchStatus } = useQuery<{ data: SystemStatus }>({
    queryKey: ['/api/system/status'],
  });

  // Fetch all settings
  const { data: settingsData, isLoading: settingsLoading } = useQuery<{ settings: AppSetting[] }>({
    queryKey: ['/api/settings'],
  });

  // Update form inputs when settings are loaded
  useEffect(() => {
    if (settingsData?.settings) {
      const bankrollSetting = settingsData.settings.find(s => s.key === 'default_bankroll');
      const sessionSetting = settingsData.settings.find(s => s.key === 'session_duration_days');
      
      if (bankrollSetting) {
        setDefaultBankroll(String(bankrollSetting.value));
      }
      if (sessionSetting) {
        setSessionDuration(String(sessionSetting.value));
      }
    }
  }, [settingsData]);

  // Mutation to update a setting
  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value, description }: { key: string; value: any; description?: string }) => {
      return await apiRequest('PUT', `/api/settings/${key}`, { value, description });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: 'Settings Updated',
        description: 'Your settings have been saved successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update settings.',
        variant: 'destructive',
      });
    },
  });

  const handleSaveDefaults = () => {
    updateSettingMutation.mutate({
      key: 'default_bankroll',
      value: parseInt(defaultBankroll),
      description: 'Default bankroll for new users',
    });
    
    updateSettingMutation.mutate({
      key: 'session_duration_days',
      value: parseInt(sessionDuration),
      description: 'Session duration in days',
    });
  };

  const system = statusData?.data;
  const settings = settingsData?.settings || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="w-8 h-8" />
            Application Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure backend settings and view system status
          </p>
        </div>

        <div className="grid gap-6">
          {/* System Status Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="w-5 h-5" />
                    System Status
                  </CardTitle>
                  <CardDescription>Current system and integration status</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => refetchStatus()}
                  disabled={statusLoading}
                  data-testid="button-refresh-status"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${statusLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {statusLoading ? (
                <p className="text-muted-foreground">Loading system status...</p>
              ) : system ? (
                <>
                  {/* Database Status */}
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Database className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Database</p>
                        <p className="text-sm text-muted-foreground">{system.database.type}</p>
                      </div>
                    </div>
                    <Badge variant={system.database.connected ? 'default' : 'destructive'}>
                      {system.database.connected ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Connected
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 mr-1" />
                          Disconnected
                        </>
                      )}
                    </Badge>
                  </div>

                  {/* Telegram Status */}
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Send className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Telegram Bot</p>
                        <p className="text-sm text-muted-foreground">Mini App Integration</p>
                      </div>
                    </div>
                    <Badge variant={system.telegram.configured ? 'default' : 'secondary'}>
                      {system.telegram.configured ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Configured
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 mr-1" />
                          Not Configured
                        </>
                      )}
                    </Badge>
                  </div>

                  {/* Environment Info */}
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <p className="font-medium">Environment</p>
                      <p className="text-sm text-muted-foreground">Version {system.version}</p>
                    </div>
                    <Badge variant="outline">
                      {system.environment}
                    </Badge>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>

          {/* Telegram Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                Telegram Configuration
              </CardTitle>
              <CardDescription>
                Configure Telegram Mini App integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  <strong>Environment Variable Required:</strong> Set <code className="bg-muted px-1 py-0.5 rounded">TELEGRAM_BOT_TOKEN</code> in your environment variables.
                  Get your bot token from <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@BotFather</a> on Telegram.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Bot Token Status</Label>
                <div className="flex items-center gap-2">
                  {system?.telegram.botTokenPresent ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Token is configured</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-destructive" />
                      <span className="text-sm">Token not found in environment</span>
                    </>
                  )}
                </div>
              </div>

              <Separator />

              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>Setup Instructions:</strong></p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Create a bot with @BotFather on Telegram</li>
                  <li>Copy the bot token provided</li>
                  <li>Add it to your environment as TELEGRAM_BOT_TOKEN</li>
                  <li>Restart the application</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Game Defaults */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Game Defaults
              </CardTitle>
              <CardDescription>
                Configure default settings for new users and game sessions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="default-bankroll">Default Bankroll</Label>
                  <Input
                    id="default-bankroll"
                    type="number"
                    value={defaultBankroll}
                    onChange={(e) => setDefaultBankroll(e.target.value)}
                    placeholder="1000"
                    data-testid="input-default-bankroll"
                  />
                  <p className="text-xs text-muted-foreground">
                    Starting chips for new users
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="session-duration">Session Duration (days)</Label>
                  <Input
                    id="session-duration"
                    type="number"
                    value={sessionDuration}
                    onChange={(e) => setSessionDuration(e.target.value)}
                    placeholder="7"
                    data-testid="input-session-duration"
                  />
                  <p className="text-xs text-muted-foreground">
                    How long users stay logged in
                  </p>
                </div>
              </div>

              <Button 
                onClick={handleSaveDefaults}
                disabled={updateSettingMutation.isPending}
                data-testid="button-save-defaults"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Defaults
              </Button>
            </CardContent>
          </Card>

          {/* Current Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Current Settings</CardTitle>
              <CardDescription>
                All configured application settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {settingsLoading ? (
                <p className="text-muted-foreground">Loading settings...</p>
              ) : settings.length === 0 ? (
                <p className="text-muted-foreground">No settings configured yet</p>
              ) : (
                <div className="space-y-3">
                  {settings.map((setting) => (
                    <div key={setting.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex-1">
                        <p className="font-medium">{setting.key}</p>
                        {setting.description && (
                          <p className="text-sm text-muted-foreground">{setting.description}</p>
                        )}
                      </div>
                      <Badge variant="outline">
                        {JSON.stringify(setting.value)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
