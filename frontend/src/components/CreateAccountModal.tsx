import { useState, FormEvent, useRef } from 'react';
import { useAccountStore } from '../store/accountStore';
import { X, Wallet, TrendingUp } from 'lucide-react';
import { useClickOutside } from '../hooks/useClickOutside';
import ColorPicker from './ColorPicker';

interface CreateAccountModalProps {
  onClose: () => void;
}

const CHECKING_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
  'linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)',
  'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
];

const SAVINGS_GRADIENTS = [
  'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  'linear-gradient(135deg, #34d399 0%, #059669 100%)',
  'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)',
  'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
  'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
  'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
];

export default function CreateAccountModal({ onClose }: CreateAccountModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'checking' | 'savings'>('checking');
  const [color, setColor] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { createAccount } = useAccountStore();
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside
  useClickOutside(modalRef, onClose);

  const colorOptions = type === 'checking' ? CHECKING_GRADIENTS : SAVINGS_GRADIENTS;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await createAccount({ type, name, color: color || undefined });
      onClose();
    } catch (error) {
      console.error('Create account error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-xl max-w-md w-full p-6"
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold">Create Local Test Account</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          This creates a local test account with editable balances. To link a real bank account, use the "Link Bank Account" feature.
        </p>

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

          <ColorPicker
            value={color}
            onChange={setColor}
            presetColors={colorOptions}
            label="Card Color (Optional)"
          />

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
