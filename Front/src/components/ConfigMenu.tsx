import React, { useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

type Theme = 'light' | 'dark' | 'gray';

export const ConfigMenu: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const themes: { value: Theme; label: string; icon: JSX.Element }[] = [
    { value: 'light', label: 'Light', icon: <Sun className="w-4 h-4" /> },
    { value: 'dark', label: 'Dark', icon: <Moon className="w-4 h-4" /> },
    { value: 'gray', label: 'Gray', icon: <Monitor className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-full bg-white/70 dark:bg-black/60 p-2 shadow-sm backdrop-blur"
        aria-label="Open settings"
      >
        {/* Simple gear icon using SVG */}
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 5v2m0 8v2m-4.24-9.76l1.42 1.42M16.34 15.66l1.42 1.42M5 12h2m8 0h2M7.76 7.76l1.42 1.42M15.66 15.66l1.42 1.42" />
        </svg>
      </button>

      {open && (
        <div className="mt-2 w-44 rounded bg-white/90 dark:bg-gray-800 p-3 shadow-lg backdrop-blur">
          {themes.map(t => (
            <label key={t.value} className="flex items-center cursor-pointer mb-2">
              <input
                type="radio"
                name="theme"
                value={t.value}
                checked={theme === t.value}
                onChange={() => setTheme(t.value)}
                className="mr-2"
              />
              {t.icon}
              <span className="ml-2 capitalize">{t.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};
