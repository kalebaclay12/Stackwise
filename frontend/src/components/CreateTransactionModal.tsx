import { useState, FormEvent, useRef, useEffect } from 'react';
import { useAccountStore } from '../store/accountStore';
import { X, DollarSign, FileText, Tag, Calendar } from 'lucide-react';
import { useClickOutside } from '../hooks/useClickOutside';
import { format } from 'date-fns';

interface CreateTransactionModalProps {
  accountId: string;
  onClose: () => void;
  onSuccess?: () => void;
  onTransactionCreated?: () => void;
}

export default function CreateTransactionModal({ accountId, onClose, onSuccess, onTransactionCreated }: CreateTransactionModalProps) {
  const [type, setType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isLoading, setIsLoading] = useState(false);
  const { refreshCurrentAccount, triggerTransactionRefresh } = useAccountStore();
  const descriptionInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside
  useClickOutside(modalRef, onClose);

  useEffect(() => {
    descriptionInputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { transactionAPI } = await import('../services/api');
      // Parse date in local timezone to avoid timezone shift issues
      const [year, month, day] = date.split('-').map(Number);
      const localDate = new Date(year, month - 1, day, 12, 0, 0); // Use noon to avoid DST issues

      await transactionAPI.create(accountId, {
        type,
        amount: parseFloat(amount),
        description,
        category: category || undefined,
        date: localDate.toISOString(),
      });

      await refreshCurrentAccount();
      if (onSuccess) {
        onSuccess();
      }
      // Trigger transaction list refresh via store (this updates all TransactionHistory components)
      triggerTransactionRefresh();
      // Also call the callback if provided for backwards compatibility
      if (onTransactionCreated) {
        onTransactionCreated();
      }
      onClose();
    } catch (error) {
      console.error('Create transaction error:', error);
      alert('Failed to create transaction');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add Transaction</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <X className="w-5 h-5 text-gray-900 dark:text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Transaction Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('deposit')}
                className={`px-4 py-3 rounded-lg font-medium transition-all ${
                  type === 'deposit'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-2 border-green-500'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                Deposit
              </button>
              <button
                type="button"
                onClick={() => setType('withdrawal')}
                className={`px-4 py-3 rounded-lg font-medium transition-all ${
                  type === 'withdrawal'
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-2 border-red-500'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                Withdrawal
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500 dark:text-gray-400">$</span>
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
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description *
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              <input
                ref={descriptionInputRef}
                id="description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input pl-10"
                placeholder="e.g., Grocery shopping, Paycheck"
                required
              />
            </div>
          </div>

          {/* Category (Optional) */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category (Optional)
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              <input
                id="category"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input pl-10"
                placeholder="e.g., Groceries, Income"
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input pl-10"
                required
              />
            </div>
          </div>

          {/* Action Buttons */}
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
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Adding...' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
