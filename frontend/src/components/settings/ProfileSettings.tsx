import { useState, useEffect, FormEvent } from 'react';
import { User, Mail, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import axios from '../../services/api';

export default function ProfileSettings() {
  const { user, setUser } = useAuthStore();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setEmail(user.email);
    }
  }, [user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await axios.put('/user/profile', {
        firstName,
        lastName,
        email,
      });

      setUser(response.data);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to update profile'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges =
    firstName !== user?.firstName ||
    lastName !== user?.lastName ||
    email !== user?.email;

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
          <User className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Profile Information</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Update your personal details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="input"
              placeholder="John"
              required
            />
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="input"
              placeholder="Doe"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input pl-10"
              placeholder="john.doe@example.com"
              required
            />
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            We'll never share your email with anyone else.
          </p>
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
            disabled={isLoading || !hasChanges}
            className="btn-primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
