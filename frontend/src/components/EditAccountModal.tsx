import { useState, FormEvent, useRef } from 'react';
import { X, Edit3, Palette } from 'lucide-react';
import { Account } from '../types';
import { accountAPI } from '../services/api';
import { useClickOutside } from '../hooks/useClickOutside';
import ColorPickerModal from './ColorPickerModal';

interface EditAccountModalProps {
  account: Account;
  onClose: () => void;
  onSuccess: () => void;
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

export default function EditAccountModal({ account, onClose, onSuccess }: EditAccountModalProps) {
  const [name, setName] = useState(account.name);
  const [type, setType] = useState<'checking' | 'savings'>(account.type);
  const [color, setColor] = useState(account.color || '');
  const [isLoading, setIsLoading] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside
  useClickOutside(modalRef, onClose);

  const colorOptions = type === 'checking' ? CHECKING_GRADIENTS : SAVINGS_GRADIENTS;
  const isLinkedAccount = !!account.linkedBankId;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await accountAPI.update(account.id, { name, type, color: color || undefined });
      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update account');
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
          <div className="flex items-center gap-3">
            <Edit3 className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold">Edit Account</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLinkedAccount && (
          <p className="text-sm text-gray-500 mb-6">
            This is a real bank account. You can customize the display name and color.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="e.g., Main Checking"
              required
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Account Type
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as 'checking' | 'savings')}
              className="input"
              required
              disabled={isLinkedAccount}
              title={isLinkedAccount ? 'Account type cannot be changed for real bank accounts' : ''}
            >
              <option value="checking">Checking</option>
              <option value="savings">Savings</option>
            </select>
            {isLinkedAccount && (
              <p className="text-xs text-gray-500 mt-1">
                Account type is set by your bank and cannot be changed
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Color (Optional)
            </label>
            <button
              type="button"
              onClick={() => setShowColorPicker(true)}
              className="w-full h-16 rounded-lg border-2 border-transparent hover:border-white/50 transition-all flex items-center justify-center gap-2 shadow-md"
              style={{ background: color || colorOptions[0] }}
            >
              <Palette className="w-5 h-5 text-white drop-shadow-md" />
              <span className="text-sm text-white font-medium drop-shadow-md">
                {color ? 'Change Color' : 'Choose Color'}
              </span>
            </button>
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
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Color Picker Modal */}
      <ColorPickerModal
        isOpen={showColorPicker}
        onClose={() => setShowColorPicker(false)}
        value={color}
        onChange={setColor}
        presetColors={colorOptions}
        title="Choose Account Color"
      />
    </div>
  );
}
