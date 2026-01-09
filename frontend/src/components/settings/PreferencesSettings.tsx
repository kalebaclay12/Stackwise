import { useState, useEffect, FormEvent } from 'react';
import { Sliders, Save, AlertCircle, CheckCircle2, DollarSign, Calendar, Clock, TrendingDown } from 'lucide-react';
import axios from '../../services/api';

interface Preferences {
  currencyCode: string;
  currencySymbol: string;
  dateFormat: string;
  timeFormat: string;
  itemsPerPage: number;
  emailNotifications: boolean;
  negativeBalanceBehavior: 'auto_deallocate' | 'allow_negative' | 'notify_only';
}

const CURRENCY_OPTIONS = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
];

const DATE_FORMAT_OPTIONS = [
  { value: 'MM/DD/YYYY', example: '12/31/2024' },
  { value: 'DD/MM/YYYY', example: '31/12/2024' },
  { value: 'YYYY-MM-DD', example: '2024-12-31' },
];

export default function PreferencesSettings() {
  const [preferences, setPreferences] = useState<Preferences>({
    currencyCode: 'USD',
    currencySymbol: '$',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    itemsPerPage: 10,
    emailNotifications: true,
    negativeBalanceBehavior: 'auto_deallocate',
  });
  const [originalPreferences, setOriginalPreferences] = useState<Preferences>(preferences);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await axios.get('/user/preferences');
      setPreferences(response.data);
      setOriginalPreferences(response.data);
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCurrencyChange = (code: string) => {
    const currency = CURRENCY_OPTIONS.find(c => c.code === code);
    if (currency) {
      setPreferences({
        ...preferences,
        currencyCode: currency.code,
        currencySymbol: currency.symbol,
      });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      await axios.put('/user/preferences', preferences);
      setOriginalPreferences(preferences);
      setMessage({ type: 'success', text: 'Preferences saved successfully!' });
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

  if (isLoading) {
    return (
      <div className="card">
        <p className="text-center text-gray-500 dark:text-gray-400">Loading preferences...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
          <Sliders className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Preferences</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Customize your Stackwise experience</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Currency Settings */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Currency</h3>
          </div>
          <div className="ml-7">
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Display Currency
            </label>
            <select
              id="currency"
              value={preferences.currencyCode}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="input"
            >
              {CURRENCY_OPTIONS.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.symbol} - {currency.name} ({currency.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date & Time Settings */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Date & Time</h3>
          </div>
          <div className="ml-7 space-y-4">
            <div>
              <label htmlFor="dateFormat" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Format
              </label>
              <select
                id="dateFormat"
                value={preferences.dateFormat}
                onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
                className="input"
              >
                {DATE_FORMAT_OPTIONS.map((format) => (
                  <option key={format.value} value={format.value}>
                    {format.value} (e.g., {format.example})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="timeFormat" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Time Format
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="timeFormat"
                    value="12h"
                    checked={preferences.timeFormat === '12h'}
                    onChange={(e) => setPreferences({ ...preferences, timeFormat: e.target.value })}
                    className="w-4 h-4 text-primary-600 border-gray-300 dark:border-gray-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">12-hour (3:30 PM)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="timeFormat"
                    value="24h"
                    checked={preferences.timeFormat === '24h'}
                    onChange={(e) => setPreferences({ ...preferences, timeFormat: e.target.value })}
                    className="w-4 h-4 text-primary-600 border-gray-300 dark:border-gray-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">24-hour (15:30)</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Display Settings */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Display</h3>
          </div>
          <div className="ml-7">
            <label htmlFor="itemsPerPage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Transactions per Page
            </label>
            <select
              id="itemsPerPage"
              value={preferences.itemsPerPage}
              onChange={(e) => setPreferences({ ...preferences, itemsPerPage: parseInt(e.target.value) })}
              className="input max-w-xs"
            >
              <option value="5">5 transactions</option>
              <option value="10">10 transactions</option>
              <option value="25">25 transactions</option>
              <option value="50">50 transactions</option>
            </select>
          </div>
        </div>

        {/* Account Behavior Settings */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Account Behavior</h3>
          </div>
          <div className="ml-7">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              When a payment brings my available balance below zero
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Sometimes you might make a payment that your app doesn't know about. Choose how Stackwise should handle it.
            </p>
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-4 bg-white dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors border-2 border-transparent has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50 dark:has-[:checked]:bg-primary-900/20">
                <input
                  type="radio"
                  name="negativeBalanceBehavior"
                  value="auto_deallocate"
                  checked={preferences.negativeBalanceBehavior === 'auto_deallocate'}
                  onChange={(e) => setPreferences({ ...preferences, negativeBalanceBehavior: e.target.value as any })}
                  className="mt-0.5 w-4 h-4 text-primary-600 border-gray-300 dark:border-gray-600 focus:ring-primary-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    Automatically take money from my stacks (Recommended)
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    We'll remove money from your lowest priority stacks first to balance things out. It's like the app is helping you cover the payment.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 bg-white dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors border-2 border-transparent has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50 dark:has-[:checked]:bg-primary-900/20">
                <input
                  type="radio"
                  name="negativeBalanceBehavior"
                  value="notify_only"
                  checked={preferences.negativeBalanceBehavior === 'notify_only'}
                  onChange={(e) => setPreferences({ ...preferences, negativeBalanceBehavior: e.target.value as any })}
                  className="mt-0.5 w-4 h-4 text-primary-600 border-gray-300 dark:border-gray-600 focus:ring-primary-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    Just tell me about it
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    You'll get a friendly message explaining what happened, and you can fix it yourself by moving money around or matching the payment to a stack.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 bg-white dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors border-2 border-transparent has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50 dark:has-[:checked]:bg-primary-900/20">
                <input
                  type="radio"
                  name="negativeBalanceBehavior"
                  value="allow_negative"
                  checked={preferences.negativeBalanceBehavior === 'allow_negative'}
                  onChange={(e) => setPreferences({ ...preferences, negativeBalanceBehavior: e.target.value as any })}
                  className="mt-0.5 w-4 h-4 text-primary-600 border-gray-300 dark:border-gray-600 focus:ring-primary-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    Allow negative balance
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Your available balance can go negative. You'll see the negative number, but nothing else happens automatically.
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {message && (
          <div className={`flex items-center gap-2 p-4 rounded-lg ${
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

        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="submit"
            disabled={isSaving || !hasChanges}
            className="btn-primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </form>
    </div>
  );
}
