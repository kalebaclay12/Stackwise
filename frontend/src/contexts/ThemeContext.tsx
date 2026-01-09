import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    // Load theme from localStorage on mount
    const saved = localStorage.getItem('theme');
    console.log('[ThemeProvider] Initial load - localStorage value:', saved);
    console.log('[ThemeProvider] Initial load - current classList:', document.documentElement.classList.value);

    if (saved === 'dark') {
      console.log('[ThemeProvider] Setting theme to dark from localStorage');
      setTheme('dark');
    } else {
      console.log('[ThemeProvider] Using default light theme');
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    console.log('[ThemeProvider] Theme changed to:', theme);
    console.log('[ThemeProvider] Before update - classList:', root.classList.value);

    // Remove both classes first to ensure clean state
    root.classList.remove('dark', 'light');

    // Add the current theme class
    if (theme === 'dark') {
      root.classList.add('dark');
      console.log('[ThemeProvider] Added dark class');
    } else {
      console.log('[ThemeProvider] Removed dark class (light mode)');
    }

    console.log('[ThemeProvider] After update - classList:', root.classList.value);

    // Save to localStorage
    localStorage.setItem('theme', theme);
    console.log('[ThemeProvider] Saved to localStorage:', theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    console.log('[ThemeProvider] Toggle clicked - current:', theme, '-> new:', newTheme);
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
