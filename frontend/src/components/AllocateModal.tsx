import { useState, FormEvent, useRef } from 'react';
import { Stack } from '../types';
import { useAccountStore } from '../store/accountStore';
import { X, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { useClickOutside } from '../hooks/useClickOutside';

interface AllocateModalProps {
  stack: Stack;
  mode: 'allocate' | 'deallocate';
  onClose: () => void;
}

export default function AllocateModal({ stack, mode, onClose }: AllocateModalProps) {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { allocateToStack, deallocateFromStack } = useAccountStore();
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside
  useClickOutside(modalRef, onClose);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (mode === 'deallocate' && numAmount > stack.currentAmount) {
      alert('Cannot remove more than the current amount');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'allocate') {
        await allocateToStack(stack.id, numAmount);
      } else {
        await deallocateFromStack(stack.id, numAmount);
      }
      onClose();
    } catch (error) {
      console.error('Allocation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-xl max-w-md w-full p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {mode === 'allocate' ? (
              <ArrowUpCircle className="w-6 h-6 text-primary-600" />
            ) : (
              <ArrowDownCircle className="w-6 h-6 text-gray-600" />
            )}
            <h2 className="text-xl font-semibold">
              {mode === 'allocate' ? 'Add Money' : 'Remove Money'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 mb-1">Stack</p>
            <p className="font-semibold text-gray-900">{stack.name}</p>
            <p className="text-sm text-gray-600 mt-2">Current Amount</p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(stack.currentAmount)}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
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
                  max={mode === 'deallocate' ? stack.currentAmount : undefined}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input pl-8"
                  placeholder="0.00"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-3">
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
                {isLoading ? 'Processing...' : mode === 'allocate' ? 'Add' : 'Remove'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
