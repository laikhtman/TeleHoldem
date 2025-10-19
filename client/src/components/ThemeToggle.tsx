import { Moon, Sun, Contrast } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const savedHighContrast = localStorage.getItem('highContrast') === 'true';
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const prefersContrast = window.matchMedia('(prefers-contrast: more)').matches;
    
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    const initialHighContrast = savedHighContrast || prefersContrast;
    
    setTheme(initialTheme);
    setHighContrast(initialHighContrast);
    
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    }
    if (initialHighContrast) {
      document.documentElement.classList.add('high-contrast');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleHighContrast = () => {
    const newHighContrast = !highContrast;
    setHighContrast(newHighContrast);
    localStorage.setItem('highContrast', String(newHighContrast));
    
    if (newHighContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={toggleTheme}
        className="min-h-[44px] min-w-[44px] rounded-full shadow-md"
        data-testid="button-theme-toggle"
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? (
          <Moon className="h-5 w-5" />
        ) : (
          <Sun className="h-5 w-5" />
        )}
      </Button>
      
      <Button
        variant="outline"
        size="icon"
        onClick={toggleHighContrast}
        className={`min-h-[44px] min-w-[44px] rounded-full shadow-md ${highContrast ? 'bg-primary text-primary-foreground' : ''}`}
        data-testid="button-contrast-toggle"
        aria-label={`${highContrast ? 'Disable' : 'Enable'} high contrast mode`}
      >
        <Contrast className="h-5 w-5" />
      </Button>
    </div>
  );
}
