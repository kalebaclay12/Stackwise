import { useState, useEffect, FormEvent } from 'react';
import { Shield, Lock, Save, AlertCircle, CheckCircle2, Eye, EyeOff, Smartphone, MapPin, Clock, LogOut, Monitor, Globe } from 'lucide-react';
import axios from '../../services/api';
import { format } from 'date-fns';

interface Session {
  id: string;
  deviceType: string;
  browser: string;
  location: string;
  ipAddress: string;
  lastActive: string;
  isCurrent: boolean;
}

interface LoginHistory {
  id: string;
  deviceType: string;
  browser: string;
  location: string;
  ipAddress: string;
  timestamp: string;
  success: boolean;
}

interface SecurityPreferences {
  autoLockEnabled: boolean;
  autoLockTimeout: number; // minutes
  loginAlerts: boolean;
  newDeviceAlerts: boolean;
}

const DEFAULT_SECURITY_PREFS: SecurityPreferences = {
  autoLockEnabled: false,
  autoLockTimeout: 15,
  loginAlerts: true,
  newDeviceAlerts: true,
};

export default function SecuritySettings() {
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sessions state
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);

  // Login history state
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [showAllHistory, setShowAllHistory] = useState(false);

  // Security preferences state
  const [securityPrefs, setSecurityPrefs] = useState<SecurityPreferences>(DEFAULT_SECURITY_PREFS);
  const [originalSecurityPrefs, setOriginalSecurityPrefs] = useState<SecurityPreferences>(DEFAULT_SECURITY_PREFS);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [prefsMessage, setPrefsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSessions();
    fetchLoginHistory();
    fetchSecurityPreferences();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await axios.get('/user/sessions');
      setSessions(response.data);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      // Mock data for development
      setSessions([
        {
          id: '1',
          deviceType: 'Desktop',
          browser: 'Chrome',
          location: 'Austin, TX',
          ipAddress: '192.168.1.1',
          lastActive: new Date().toISOString(),
          isCurrent: true,
        },
      ]);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const fetchLoginHistory = async () => {
    try {
      const response = await axios.get('/user/login-history');
      setLoginHistory(response.data);
    } catch (error) {
      console.error('Failed to fetch login history:', error);
      // Mock data for development
      setLoginHistory([
        {
          id: '1',
          deviceType: 'Desktop',
          browser: 'Chrome',
          location: 'Austin, TX',
          ipAddress: '192.168.1.1',
          timestamp: new Date().toISOString(),
          success: true,
        },
      ]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const fetchSecurityPreferences = async () => {
    try {
      const response = await axios.get('/user/security-preferences');
      const data = { ...DEFAULT_SECURITY_PREFS, ...response.data };
      setSecurityPrefs(data);
      setOriginalSecurityPrefs(data);
    } catch (error) {
      console.error('Failed to fetch security preferences:', error);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters long' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordMessage({ type: 'error', text: 'New password must be different from current password' });
      return;
    }

    setIsChangingPassword(true);

    try {
      await axios.post('/user/change-password', {
        currentPassword,
        newPassword,
      });

      setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setPasswordMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to change password'
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSessionId(sessionId);
    try {
      await axios.delete(`/user/sessions/${sessionId}`);
      setSessions(sessions.filter(s => s.id !== sessionId));
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to revoke session');
    } finally {
      setRevokingSessionId(null);
    }
  };

  const handleRevokeAllSessions = async () => {
    if (!confirm('This will log you out of all devices except this one. Continue?')) {
      return;
    }

    try {
      await axios.post('/user/sessions/revoke-all');
      setSessions(sessions.filter(s => s.isCurrent));
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to revoke sessions');
    }
  };

  const handleSaveSecurityPrefs = async () => {
    setIsSavingPrefs(true);
    setPrefsMessage(null);

    try {
      await axios.put('/user/security-preferences', securityPrefs);
      setOriginalSecurityPrefs(securityPrefs);
      setPrefsMessage({ type: 'success', text: 'Security preferences saved!' });
    } catch (error: any) {
      setPrefsMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to save preferences'
      });
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '', color: '' };

    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    if (strength <= 2) return { strength, label: 'Weak', color: 'bg-red-500' };
    if (strength <= 3) return { strength, label: 'Fair', color: 'bg-yellow-500' };
    if (strength <= 4) return { strength, label: 'Good', color: 'bg-blue-500' };
    return { strength, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const hasPrefsChanges = JSON.stringify(securityPrefs) !== JSON.stringify(originalSecurityPrefs);

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

  const getDeviceIcon = (deviceType: string) => {
    if (deviceType.toLowerCase().includes('mobile') || deviceType.toLowerCase().includes('phone')) {
      return Smartphone;
    }
    return Monitor;
  };

  return (
    <div className="space-y-6">
      {/* Security Overview Card */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Security</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage your account security</p>
          </div>
        </div>

        {/* Security Preferences */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Security Preferences
            </h3>
          </div>

          <div className="space-y-2">
            <ToggleSwitch
              enabled={securityPrefs.autoLockEnabled}
              onChange={(value) => setSecurityPrefs({ ...securityPrefs, autoLockEnabled: value })}
              label="Auto-Lock"
              description="Automatically require login after inactivity"
            />

            {securityPrefs.autoLockEnabled && (
              <div className="ml-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Lock after inactivity
                </label>
                <select
                  value={securityPrefs.autoLockTimeout}
                  onChange={(e) => setSecurityPrefs({ ...securityPrefs, autoLockTimeout: parseInt(e.target.value) })}
                  className="input w-40"
                >
                  <option value="5">5 minutes</option>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                </select>
              </div>
            )}

            <ToggleSwitch
              enabled={securityPrefs.loginAlerts}
              onChange={(value) => setSecurityPrefs({ ...securityPrefs, loginAlerts: value })}
              label="Login Alerts"
              description="Get notified of successful logins to your account"
            />

            <ToggleSwitch
              enabled={securityPrefs.newDeviceAlerts}
              onChange={(value) => setSecurityPrefs({ ...securityPrefs, newDeviceAlerts: value })}
              label="New Device Alerts"
              description="Get notified when a new device signs into your account"
            />
          </div>

          {prefsMessage && (
            <div className={`mt-4 flex items-center gap-2 p-3 rounded-lg ${
              prefsMessage.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
            }`}>
              {prefsMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <p className="text-sm">{prefsMessage.text}</p>
            </div>
          )}

          {hasPrefsChanges && (
            <div className="flex justify-end mt-4">
              <button
                onClick={handleSaveSecurityPrefs}
                disabled={isSavingPrefs}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <Save className="w-4 h-4" />
                {isSavingPrefs ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Active Sessions Card */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Active Sessions
            </h3>
          </div>
          {sessions.length > 1 && (
            <button
              onClick={handleRevokeAllSessions}
              className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
            >
              Log out all other devices
            </button>
          )}
        </div>

        {isLoadingSessions ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No active sessions found</p>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => {
              const DeviceIcon = getDeviceIcon(session.deviceType);
              return (
                <div
                  key={session.id}
                  className={`flex items-center justify-between p-4 rounded-xl border ${
                    session.isCurrent
                      ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
                      : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      session.isCurrent
                        ? 'bg-primary-100 dark:bg-primary-900/40'
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      <DeviceIcon className={`w-5 h-5 ${
                        session.isCurrent
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {session.deviceType} • {session.browser}
                        </p>
                        {session.isCurrent && (
                          <span className="text-xs bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full font-medium">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">{session.location}</span>
                        <span className="text-gray-300 dark:text-gray-600">•</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(session.lastActive), 'MMM d, h:mm a')}
                        </span>
                      </div>
                    </div>
                  </div>
                  {!session.isCurrent && (
                    <button
                      onClick={() => handleRevokeSession(session.id)}
                      disabled={revokingSessionId === session.id}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Log out this device"
                    >
                      {revokingSessionId === session.id ? (
                        <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <LogOut className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Login History Card */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Recent Login Activity
            </h3>
          </div>
        </div>

        {isLoadingHistory ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : loginHistory.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No login history available</p>
        ) : (
          <>
            <div className="space-y-2">
              {(showAllHistory ? loginHistory : loginHistory.slice(0, 5)).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      entry.success ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {entry.deviceType} • {entry.browser}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>{entry.location}</span>
                        <span>•</span>
                        <span>{entry.ipAddress}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-medium ${
                      entry.success
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {entry.success ? 'Successful' : 'Failed'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {format(new Date(entry.timestamp), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {loginHistory.length > 5 && (
              <button
                onClick={() => setShowAllHistory(!showAllHistory)}
                className="w-full mt-3 py-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
              >
                {showAllHistory ? 'Show less' : `Show all ${loginHistory.length} entries`}
              </button>
            )}
          </>
        )}
      </div>

      {/* Change Password Card */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Change Password
          </h3>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {/* Current Password */}
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input pl-10 pr-10"
                placeholder="Enter current password"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input pl-10 pr-10"
                placeholder="Enter new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {newPassword && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Password strength:</span>
                  <span className={`text-xs font-medium ${
                    passwordStrength.strength <= 2
                      ? 'text-red-600 dark:text-red-400'
                      : passwordStrength.strength <= 3
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : passwordStrength.strength <= 4
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-green-600 dark:text-green-400'
                  }`}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${passwordStrength.color}`}
                    style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input pl-10 pr-10"
                placeholder="Confirm new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">Passwords do not match</p>
            )}
          </div>

          {passwordMessage && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              passwordMessage.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
            }`}>
              {passwordMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <p className="text-sm">{passwordMessage.text}</p>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
              className="btn-primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isChangingPassword ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Security Tips Card */}
      <div className="card bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
        <div className="flex gap-3">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Security Tips</h3>
            <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                Use a unique password you don't use anywhere else
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                Enable login alerts to monitor account access
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                Review active sessions regularly and remove unrecognized devices
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                Never share your password or verification codes with anyone
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
