import { Moon, Sun } from 'lucide-react';
import { Switch } from './ui/switch';
import { useTheme } from '../contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <div className="flex items-center gap-2 rounded-full px-3 py-2 bg-card border border-border shadow-lg">
      <Moon size={18} className={`${isDarkMode ? 'text-primary' : 'text-muted-foreground'}`} />
      <Switch 
        checked={!isDarkMode} 
        onCheckedChange={toggleTheme} 
        className="data-[state=checked]:bg-primary"
      />
      <Sun size={18} className={`${!isDarkMode ? 'text-primary' : 'text-muted-foreground'}`} />
    </div>
  );
} 