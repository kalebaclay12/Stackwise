import { useState, useEffect } from 'react';
import { Bell, Save, AlertCircle, CheckCircle2, DollarSign, Target, TrendingUp, Mail, Smartphone } from 'lucide-react';
import axios from '../../services/api';

interface NotificationPreferences {
  // Transaction notifications
  transactionAlerts: 'all' | 'large_only' | 'none';
  largeTransactionThreshold: number;

  // Balance notifications
  lowBalanceAlert: boolean;
  lowBalanceThreshold: number;

  // Goal notifications
  goalProgress: boolean;
  goalMilestones: boolean; // 25%, 50%, 75%, 100%

  // Auto-allocation notifications
  autoAllocationReminder: boolean;
  autoAllocationComplete: boolean;

  // Channels
  pushNotifications: boolean;
  emailNotifications: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  transactionAlerts: 'all',
  largeTransactionThreshold: 100,
  lowBalanceAlert: true,
  lowBalanceThreshold: 50,
  goalProgress: true,
  goalMilestones: true,
  autoAllocationReminder: true,
  autoAllocationComplete: true,
  pushNotifications: true,
  emailNotifications: true,
};

export default function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [originalPreferences, setOriginalPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await axios.get('/user/notification-preferences');
      const data = { ...DEFAULT_PREFERENCES, ...response.data };
      setPreferences(data);
      setOriginalPreferences(data);
    } catch (error) {
      console.error('Failed to fetch notification preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      await axios.put('/user/notification-preferences', preferences);
      setOriginalPreferences(preferences);
      setMessage({ type: 'success', text: 'Notification preferences saved!' });
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
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
            <Bell className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Notifications</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Choose what updates you want to receive</p>
          </div>
        </div>

        {/* Notification Channels */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Notification Channels
          </h3>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-1">
            <div className="flex items-center gap-3 py-2">
              <Smartphone className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <ToggleSwitch
                  enabled={preferences.pushNotifications}
                  onChange={(value) => setPreferences({ ...preferences, pushNotifications: value })}
                  label="Push Notifications"
                  description="Receive notifications on your device"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 py-2">
              <Mail className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <ToggleSwitch
                  enabled={preferences.emailNotifications}
                  onChange={(value) => setPreferences({ ...preferences, emailNotifications: value })}
                  label="Email Notifications"
                  description="Receive updates via email"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Alerts */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Transactions
            </h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Transaction Alerts
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { value: 'all', label: 'All Transactions', desc: 'Every transaction' },
                  { value: 'large_only', label: 'Large Only', desc: 'Above threshold' },
                  { value: 'none', label: 'None', desc: 'No alerts' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex flex-col p-3 rounded-lg cursor-pointer border-2 transition-all ${
                      preferences.transactionAlerts === option.value
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="transactionAlerts"
                      value={option.value}
                      checked={preferences.transactionAlerts === option.value}
                      onChange={(e) => setPreferences({ ...preferences, transactionAlerts: e.target.value as any })}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{option.label}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{option.desc}</span>
                  </label>
                ))}
              </div>
            </div>

            {preferences.transactionAlerts === 'large_only' && (
              <div className="ml-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Large Transaction Threshold
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 dark:text-gray-400">$</span>
                  <input
                    type="number"
                    min="1"
                    value={preferences.largeTransactionThreshold}
                    onChange={(e) => setPreferences({ ...preferences, largeTransactionThreshold: parseInt(e.target.value) || 100 })}
                    className="input w-32"
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400">or more</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Balance Alerts */}
        <div className="mb-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Balance Alerts
            </h3>
          </div>
          <div className="space-y-2">
            <ToggleSwitch
              enabled={preferences.lowBalanceAlert}
              onChange={(value) => setPreferences({ ...preferences, lowBalanceAlert: value })}
              label="Low Balance Warning"
              description="Get notified when available balance drops below threshold"
            />
            {preferences.lowBalanceAlert && (
              <div className="ml-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Alert when balance falls below
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 dark:text-gray-400">$</span>
                  <input
                    type="number"
                    min="0"
                    value={preferences.lowBalanceThreshold}
                    onChange={(e) => setPreferences({ ...preferences, lowBalanceThreshold: parseInt(e.target.value) || 0 })}
                    className="input w-32"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Goal Notifications */}
        <div className="mb-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Goals & Progress
            </h3>
          </div>
          <div className="space-y-1">
            <ToggleSwitch
              enabled={preferences.goalProgress}
              onChange={(value) => setPreferences({ ...preferences, goalProgress: value })}
              label="Goal Progress Updates"
              description="Get notified when you make progress toward your goals"
            />
            <ToggleSwitch
              enabled={preferences.goalMilestones}
              onChange={(value) => setPreferences({ ...preferences, goalMilestones: value })}
              label="Milestone Celebrations"
              description="Celebrate when you hit 25%, 50%, 75%, and 100% of a goal"
            />
          </div>
        </div>

        {/* Auto-Allocation Notifications */}
        <div className="mb-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Auto-Allocations
            </h3>
          </div>
          <div className="space-y-1">
            <ToggleSwitch
              enabled={preferences.autoAllocationReminder}
              onChange={(value) => setPreferences({ ...preferences, autoAllocationReminder: value })}
              label="Upcoming Allocation Reminder"
              description="Reminder before an auto-allocation is scheduled"
            />
            <ToggleSwitch
              enabled={preferences.autoAllocationComplete}
              onChange={(value) => setPreferences({ ...preferences, autoAllocationComplete: value })}
              label="Allocation Completed"
              description="Confirmation when an auto-allocation is processed"
            />
          </div>
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
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}
