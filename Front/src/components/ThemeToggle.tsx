import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="inline-flex rounded-full bg-white/70 dark:bg-black/60 p-1 shadow-sm backdrop-blur transition-colors">
        <button
          onClick={() => {
            if (isDark) return; // already light
            toggleTheme();
          }}
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            !isDark ? 'bg-[#111111] text-white' : 'text-[#111111]'
          }`}
          aria-pressed={!isDark}
        >
          <Sun className="w-4 h-4" />
          Blanco
        </button>

        <button
          onClick={() => {
            if (!isDark) return; // already dark
            toggleTheme();
          }}
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors ml-1 ${
            isDark ? 'bg-white text-[#111111]' : 'text-[#111111]'
          }`}
          aria-pressed={isDark}
        >
          <Moon className="w-4 h-4" />
          Negro
        </button>
      </div>
    </div>
  );
};

export default ThemeToggle;
