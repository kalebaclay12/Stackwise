import { useState, useEffect } from 'react';
import { Palette, Save, AlertCircle, CheckCircle2, Sun, Moon, Monitor, EyeOff, Layers, Type } from 'lucide-react';
import axios from '../../services/api';

interface AppearancePreferences {
  theme: 'light' | 'dark' | 'system';
  hideBalances: boolean;
  compactMode: boolean;
  reducedMotion: boolean;
  accentColor: string;
}

const DEFAULT_PREFERENCES: AppearancePreferences = {
  theme: 'system',
  hideBalances: false,
  compactMode: false,
  reducedMotion: false,
  accentColor: 'indigo',
};

const ACCENT_COLORS = [
  { id: 'indigo', name: 'Indigo', color: 'bg-indigo-500', ring: 'ring-indigo-500' },
  { id: 'blue', name: 'Blue', color: 'bg-blue-500', ring: 'ring-blue-500' },
  { id: 'emerald', name: 'Emerald', color: 'bg-emerald-500', ring: 'ring-emerald-500' },
  { id: 'violet', name: 'Violet', color: 'bg-violet-500', ring: 'ring-violet-500' },
  { id: 'rose', name: 'Rose', color: 'bg-rose-500', ring: 'ring-rose-500' },
  { id: 'amber', name: 'Amber', color: 'bg-amber-500', ring: 'ring-amber-500' },
];

export default function AppearanceSettings() {
  const [preferences, setPreferences] = useState<AppearancePreferences>(DEFAULT_PREFERENCES);
  const [originalPreferences, setOriginalPreferences] = useState<AppearancePreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchPreferences();
  }, []);

  // Apply theme changes immediately for preview
  useEffect(() => {
    applyTheme(preferences.theme);
  }, [preferences.theme]);

  const fetchPreferences = async () => {
    try {
      const response = await axios.get('/user/appearance-preferences');
      const data = { ...DEFAULT_PREFERENCES, ...response.data };
      setPreferences(data);
      setOriginalPreferences(data);
    } catch (error) {
      // Use defaults if no preferences saved yet
      console.error('Failed to fetch appearance preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyTheme = (theme: 'light' | 'dark' | 'system') => {
    const root = document.documentElement;

    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      await axios.put('/user/appearance-preferences', preferences);
      setOriginalPreferences(preferences);

      // Store hide balances preference in localStorage for quick access
      localStorage.setItem('hideBalances', JSON.stringify(preferences.hideBalances));
      localStorage.setItem('theme', preferences.theme);

      // Dispatch event so other components can react
      window.dispatchEvent(new CustomEvent('appearanceChanged', { detail: preferences }));

      setMessage({ type: 'success', text: 'Appearance settings saved!' });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to save preferences'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = JSON.stringify(preferences) !== JSON.stringify(originalPreferences);

  const ToggleSwitch = ({
    enabled,
    onChange,
    label,
    description
  }: {
    enabled: boolean;
    onChange: (value: boolean) => void;
    label: string;
    description?: string;
  }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
          enabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          <div className="space-y-3 pt-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
            <Palette className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Appearance</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Customize how Stackwise looks</p>
          </div>
        </div>

        {/* Theme Selection */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sun className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Theme
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { value: 'light', label: 'Light', icon: Sun, desc: 'Always light mode' },
              { value: 'dark', label: 'Dark', icon: Moon, desc: 'Always dark mode' },
              { value: 'system', label: 'System', icon: Monitor, desc: 'Match device settings' },
            ].map((option) => {
              const Icon = option.icon;
              return (
                <label
                  key={option.value}
                  className={`relative flex flex-col items-center p-4 rounded-xl cursor-pointer border-2 transition-all ${
                    preferences.theme === option.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="theme"
                    value={option.value}
                    checked={preferences.theme === option.value}
                    onChange={(e) => setPreferences({ ...preferences, theme: e.target.value as any })}
                    className="sr-only"
                  />
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                    preferences.theme === option.value
                      ? 'bg-primary-100 dark:bg-primary-900/40'
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      preferences.theme === option.value
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`} />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{option.label}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">{option.desc}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Privacy Mode */}
        <div className="mb-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <EyeOff className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Privacy
            </h3>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <ToggleSwitch
              enabled={preferences.hideBalances}
              onChange={(value) => setPreferences({ ...preferences, hideBalances: value })}
              label="Hide Balances"
              description="Replace money amounts with ••••• for privacy in public"
            />
            {preferences.hideBalances && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  <strong>Tip:</strong> When enabled, tap on any hidden balance to temporarily reveal it.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Display Options */}
        <div className="mb-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Display
            </h3>
          </div>
          <div className="space-y-1">
            <ToggleSwitch
              enabled={preferences.compactMode}
              onChange={(value) => setPreferences({ ...preferences, compactMode: value })}
              label="Compact Mode"
              description="Show more content with smaller cards and tighter spacing"
            />
            <ToggleSwitch
              enabled={preferences.reducedMotion}
              onChange={(value) => setPreferences({ ...preferences, reducedMotion: value })}
              label="Reduce Motion"
              description="Minimize animations throughout the app"
            />
          </div>
        </div>

        {/* Accent Color */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Type className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Accent Color
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Choose a color for buttons and highlights
          </p>
          <div className="flex flex-wrap gap-3">
            {ACCENT_COLORS.map((color) => (
              <button
                key={color.id}
                onClick={() => setPreferences({ ...preferences, accentColor: color.id })}
                className={`w-12 h-12 rounded-full ${color.color} transition-all ${
                  preferences.accentColor === color.id
                    ? `ring-2 ring-offset-2 dark:ring-offset-gray-800 ${color.ring} scale-110`
                    : 'hover:scale-105'
                }`}
                title={color.name}
              >
                {preferences.accentColor === color.id && (
                  <span className="flex items-center justify-center h-full">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            Note: Accent color changes will apply after page refresh.
          </p>
        </div>

        {/* Save Button */}
        {message && (
          <div className={`mt-6 flex items-center gap-2 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}

        <div className="flex justify-end pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="btn-primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
