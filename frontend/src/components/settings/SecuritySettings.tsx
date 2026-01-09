import { useState, FormEvent } from 'react';
import { Shield, Lock, Save, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import axios from '../../services/api';

export default function SecuritySettings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Validation
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters long' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (currentPassword === newPassword) {
      setMessage({ type: 'error', text: 'New password must be different from current password' });
      return;
    }

    setIsLoading(true);

    try {
      await axios.post('/user/change-password', {
        currentPassword,
        newPassword,
      });

      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to change password'
      });
    } finally {
      setIsLoading(false);
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

  return (
    <div className="space-y-6">
      {/* Change Password Card */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Security</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Keep your account secure</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${passwordStrength.color}`}
                    style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                  />
                </div>
              </div>
            )}
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Must be at least 6 characters. Use a mix of uppercase, lowercase, numbers, and symbols for better security.
            </p>
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
              <p className="mt-2 text-xs text-red-600 dark:text-red-400">Passwords do not match</p>
            )}
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
              disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
              className="btn-primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isLoading ? 'Changing Password...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Security Info Card */}
      <div className="card bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
        <div className="flex gap-3">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">Security Tips</h3>
            <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
              <li>• Use a unique password you don't use anywhere else</li>
              <li>• Include a mix of letters, numbers, and special characters</li>
              <li>• Avoid common words and personal information</li>
              <li>• Change your password regularly</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
