import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Terminal, Monitor } from 'lucide-react';

const THEMES: { id: Theme; label: string; icon: typeof Sun }[] = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'hacker', label: 'Hacker', icon: Terminal },
  { id: 'system', label: 'System', icon: Monitor },
];

export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className={cn('flex items-center gap-1 rounded-lg border bg-muted/30 p-1', className)}>
      {THEMES.map(({ id, label, icon: Icon }) => (
        <Button
          key={id}
          variant={theme === id ? 'default' : 'ghost'}
          size="icon"
          onClick={() => setTheme(id)}
          className={cn(
            'h-8 w-8 rounded-md',
            theme === id && 'bg-primary text-primary-foreground shadow-sm',
          )}
          title={label}
        >
          <Icon className="h-4 w-4" />
          <span className="sr-only">{label} theme</span>
        </Button>
      ))}
    </div>
  );
}
