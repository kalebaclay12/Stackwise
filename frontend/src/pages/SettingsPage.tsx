import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Sliders, Shield, Settings as SettingsIcon, Crown } from 'lucide-react';
import ProfileSettings from '../components/settings/ProfileSettings';
import PreferencesSettings from '../components/settings/PreferencesSettings';
import SecuritySettings from '../components/settings/SecuritySettings';
import SubscriptionSettings from '../components/settings/SubscriptionSettings';

type Tab = 'profile' | 'preferences' | 'security' | 'subscription';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  const tabs = [
    { id: 'profile' as Tab, label: 'Profile', icon: User, description: 'Manage your personal information' },
    { id: 'subscription' as Tab, label: 'Subscription', icon: Crown, description: 'Manage your plan and billing' },
    { id: 'preferences' as Tab, label: 'Preferences', icon: Sliders, description: 'Customize your experience' },
    { id: 'security' as Tab, label: 'Security', icon: Shield, description: 'Password and security settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                <SettingsIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage your account and preferences</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="card p-2 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-start gap-3 px-3 py-3 rounded-lg text-left transition-all ${
                      isActive
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                      isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${
                        isActive ? 'text-primary-900 dark:text-primary-200' : 'text-gray-900 dark:text-white'
                      }`}>
                        {tab.label}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 hidden sm:block">
                        {tab.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && <ProfileSettings />}
            {activeTab === 'subscription' && <SubscriptionSettings />}
            {activeTab === 'preferences' && <PreferencesSettings />}
            {activeTab === 'security' && <SecuritySettings />}
          </div>
        </div>
      </div>
    </div>
  );
}
