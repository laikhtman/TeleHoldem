import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Settings, Volume2, VolumeX, Zap, Palette, Pause, Play, Eye, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSound } from '@/hooks/useSound';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export interface GameSettings {
  soundEnabled: boolean;
  soundVolume: number; // 0 to 1
  animationSpeed: number; // 0.5 = slow, 1 = normal, 1.5 = fast
  tableTheme: 'classic' | 'blue' | 'red' | 'purple';
  colorblindMode: boolean;
  isPaused: boolean;
  reducedAnimations?: boolean; // Manual toggle for reduced animations
}

interface SettingsPanelProps {
  settings: GameSettings;
  onSettingsChange: (settings: Partial<GameSettings>) => void;
  onPauseToggle: () => void;
  disabled?: boolean;
}

export function SettingsPanel({ settings, onSettingsChange, onPauseToggle, disabled }: SettingsPanelProps) {
  const [open, setOpen] = useState(false);
  const { setMuted, isMuted } = useSound();
  
  useEffect(() => {
    setMuted(!settings.soundEnabled);
  }, [settings.soundEnabled, setMuted]);

  const handleSoundToggle = (checked: boolean) => {
    onSettingsChange({ soundEnabled: checked });
  };

  const handleAnimationSpeedChange = (value: number[]) => {
    onSettingsChange({ animationSpeed: value[0] });
  };

  const handleThemeChange = (theme: string) => {
    onSettingsChange({ tableTheme: theme as GameSettings['tableTheme'] });
  };

  const handleColorblindToggle = (checked: boolean) => {
    onSettingsChange({ colorblindMode: checked });
  };

  const getSpeedLabel = (speed: number) => {
    if (speed <= 0.7) return 'Slow';
    if (speed >= 1.3) return 'Fast';
    return 'Normal';
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="min-h-[44px] min-w-[44px] rounded-full shadow-md"
          data-testid="button-settings"
          aria-label="Game settings"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="right" 
        className="w-[90vw] sm:w-[400px] overflow-y-auto"
        aria-label="Game settings panel"
      >
        <SheetHeader>
          <SheetTitle className="text-xl font-bold">Game Settings</SheetTitle>
          <SheetDescription>
            Customize your poker experience
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* Pause/Resume */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {settings.isPaused ? (
                  <Play className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Pause className="h-5 w-5 text-muted-foreground" />
                )}
                <Label className="text-base font-medium">Game Status</Label>
              </div>
            </div>
            <Button
              onClick={onPauseToggle}
              variant={settings.isPaused ? "default" : "secondary"}
              className="w-full min-h-11"
              data-testid="button-pause-resume"
              disabled={disabled}
              aria-label={settings.isPaused ? "Resume game" : "Pause game"}
              aria-pressed={settings.isPaused}
            >
              {settings.isPaused ? (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Resume Game
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause Game
                </>
              )}
            </Button>
            {settings.isPaused && (
              <p className="text-sm text-muted-foreground">
                Game is paused. Bot actions and timers are halted.
              </p>
            )}
          </div>

          {/* Sound Toggle */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {settings.soundEnabled ? (
                  <Volume2 className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <VolumeX className="h-5 w-5 text-muted-foreground" />
                )}
                <Label htmlFor="sound-toggle" className="text-base font-medium">
                  Sound Effects
                </Label>
              </div>
              <Switch
                id="sound-toggle"
                checked={settings.soundEnabled}
                onCheckedChange={handleSoundToggle}
                data-testid="switch-sound"
                aria-label="Toggle sound effects"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {settings.soundEnabled ? 'Sound effects enabled' : 'Sound effects muted'}
            </p>
          </div>

          {/* Volume Slider */}
          {settings.soundEnabled && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-muted-foreground" />
                <Label htmlFor="volume-slider" className="text-base font-medium">
                  Volume
                </Label>
              </div>
              <div className="space-y-2">
                <Slider
                  id="volume-slider"
                  min={0}
                  max={1}
                  step={0.1}
                  value={[settings.soundVolume || 0.5]}
                  onValueChange={(value) => onSettingsChange({ soundVolume: value[0] })}
                  className="w-full"
                  data-testid="slider-volume"
                  aria-label="Sound volume"
                  aria-valuetext={`${Math.round((settings.soundVolume || 0.5) * 100)}%`}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Mute</span>
                  <span className="font-medium text-foreground">
                    {Math.round((settings.soundVolume || 0.5) * 100)}%
                  </span>
                  <span>Max</span>
                </div>
              </div>
            </div>
          )}

          {/* Reduced Animations Toggle */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-muted-foreground" />
                <Label htmlFor="reduced-animations" className="text-base font-medium">
                  Reduced Animations
                </Label>
              </div>
              <Switch
                id="reduced-animations"
                checked={settings.reducedAnimations || false}
                onCheckedChange={(checked) => onSettingsChange({ reducedAnimations: checked })}
                data-testid="switch-reduced-animations"
                aria-label="Toggle reduced animations"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {settings.reducedAnimations 
                ? 'Animations minimized for better performance' 
                : 'Full animations enabled'}
            </p>
          </div>

          {/* Animation Speed */}
          {!settings.reducedAnimations && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-muted-foreground" />
                <Label htmlFor="animation-speed" className="text-base font-medium">
                  Animation Speed
                </Label>
              </div>
              <div className="space-y-2">
                <Slider
                  id="animation-speed"
                  min={0.5}
                  max={1.5}
                  step={0.1}
                  value={[settings.animationSpeed]}
                  onValueChange={handleAnimationSpeedChange}
                  className="w-full"
                  data-testid="slider-animation-speed"
                  aria-label="Animation speed"
                  aria-valuetext={getSpeedLabel(settings.animationSpeed)}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Slow</span>
                  <span className="font-medium text-foreground">
                    {getSpeedLabel(settings.animationSpeed)}
                  </span>
                  <span>Fast</span>
                </div>
              </div>
            </div>
          )}

          {/* Table Theme */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-muted-foreground" />
              <Label className="text-base font-medium">Table Theme</Label>
            </div>
            <RadioGroup
              value={settings.tableTheme}
              onValueChange={handleThemeChange}
              className="grid grid-cols-2 gap-3"
              aria-label="Table theme selection"
            >
              <div>
                <RadioGroupItem
                  value="classic"
                  id="theme-classic"
                  className="peer sr-only"
                  data-testid="radio-theme-classic"
                />
                <Label
                  htmlFor="theme-classic"
                  className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-card p-4 hover-elevate active-elevate-2 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full mb-2" style={{ background: 'hsl(140 70% 25%)' }}></div>
                  <span className="text-sm font-medium">Classic Green</span>
                </Label>
              </div>
              
              <div>
                <RadioGroupItem
                  value="blue"
                  id="theme-blue"
                  className="peer sr-only"
                  data-testid="radio-theme-blue"
                />
                <Label
                  htmlFor="theme-blue"
                  className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-card p-4 hover-elevate active-elevate-2 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full mb-2" style={{ background: 'hsl(220 70% 30%)' }}></div>
                  <span className="text-sm font-medium">Royal Blue</span>
                </Label>
              </div>
              
              <div>
                <RadioGroupItem
                  value="red"
                  id="theme-red"
                  className="peer sr-only"
                  data-testid="radio-theme-red"
                />
                <Label
                  htmlFor="theme-red"
                  className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-card p-4 hover-elevate active-elevate-2 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full mb-2" style={{ background: 'hsl(0 60% 30%)' }}></div>
                  <span className="text-sm font-medium">Casino Red</span>
                </Label>
              </div>
              
              <div>
                <RadioGroupItem
                  value="purple"
                  id="theme-purple"
                  className="peer sr-only"
                  data-testid="radio-theme-purple"
                />
                <Label
                  htmlFor="theme-purple"
                  className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-card p-4 hover-elevate active-elevate-2 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full mb-2" style={{ background: 'hsl(280 60% 28%)' }}></div>
                  <span className="text-sm font-medium">Royal Purple</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Colorblind Mode */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-muted-foreground" />
                <Label htmlFor="colorblind-toggle" className="text-base font-medium">
                  Colorblind Mode
                </Label>
              </div>
              <Switch
                id="colorblind-toggle"
                checked={settings.colorblindMode}
                onCheckedChange={handleColorblindToggle}
                data-testid="switch-colorblind"
                aria-label="Toggle colorblind mode"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {settings.colorblindMode 
                ? 'Suit patterns enabled for better visibility' 
                : 'Enable patterns and shapes on cards'}
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
