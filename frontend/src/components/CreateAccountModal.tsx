import { useState, FormEvent } from 'react';
import { useAccountStore } from '../store/accountStore';
import { X, Wallet, TrendingUp } from 'lucide-react';

interface CreateAccountModalProps {
  onClose: () => void;
}

export default function CreateAccountModal({ onClose }: CreateAccountModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'checking' | 'savings'>('checking');
  const [isLoading, setIsLoading] = useState(false);
  const { createAccount } = useAccountStore();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await createAccount({ type, name });
      onClose();
    } catch (error) {
      console.error('Create account error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Create Account</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Account Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('checking')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  type === 'checking'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Wallet className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <p className="font-medium text-gray-900">Checking</p>
                <p className="text-xs text-gray-500">Daily transactions</p>
              </button>
              <button
                type="button"
                onClick={() => setType('savings')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  type === 'savings'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <p className="font-medium text-gray-900">Savings</p>
                <p className="text-xs text-gray-500">Long-term goals</p>
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Account Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder={`e.g., My ${type === 'checking' ? 'Checking' : 'Savings'}`}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
