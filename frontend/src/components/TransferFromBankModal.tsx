import { useState, FormEvent, useEffect } from 'react';
import { useAccountStore } from '../store/accountStore';
import { X, Building2 } from 'lucide-react';
import axios from '../services/api';

interface TransferFromBankModalProps {
  linkedBankId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function TransferFromBankModal({ linkedBankId, onClose, onSuccess }: TransferFromBankModalProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { accounts } = useAccountStore();

  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (!selectedAccountId) {
      alert('Please select an account');
      return;
    }

    setIsLoading(true);
    try {
      await axios.post('/plaid/transfer', {
        linkedBankId,
        accountId: selectedAccountId,
        amount: numAmount,
        description: description || undefined,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Transfer failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold">Transfer from Bank</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="account" className="block text-sm font-medium text-gray-700 mb-1">
              To Account
            </label>
            <select
              id="account"
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="input"
              required
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">$</span>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input pl-8"
                placeholder="0.00"
                required
                autoFocus
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input"
              placeholder="e.g., Paycheck deposit"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              Note: This is a simulated transfer for demo purposes. In production, this would integrate with Plaid's transfer API.
            </p>
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
              {isLoading ? 'Processing...' : 'Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
