import React from 'react';
import { Sun, Moon, Sparkles } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Theme } from '../types';

export const ThemeSelector: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const themes: { key: Theme; icon: React.ReactNode; label: string; colors: string }[] = [
    { key: 'light', icon: <Sun className="h-4 w-4" />, label: 'Light', colors: 'bg-white text-gray-900' },
    { key: 'dark', icon: <Moon className="h-4 w-4" />, label: 'Dark', colors: 'bg-gray-800 text-white' },
    { key: 'accent', icon: <Sparkles className="h-4 w-4" />, label: 'Accent', colors: 'bg-gradient-to-r from-purple-500 to-blue-500 text-white' }
  ];

  return (
    <div className="flex space-x-2">
      {themes.map(({ key, icon, label, colors }) => (
        <button
          key={key}
          onClick={() => setTheme(key)}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
            theme === key
              ? `${colors} shadow-lg scale-105`
              : theme === 'dark'
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {icon}
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
};