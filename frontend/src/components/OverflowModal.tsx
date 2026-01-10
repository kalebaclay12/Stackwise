import { useState, useRef } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useClickOutside } from '../hooks/useClickOutside';

interface OverflowModalProps {
  stackName: string;
  targetAmount: number;
  currentAmount: number;
  allocationAmount: number;
  overflowAmount: number;
  defaultBehavior: 'next_priority' | 'available_balance' | 'keep_in_stack';
  onConfirm: (behavior: 'next_priority' | 'available_balance' | 'keep_in_stack') => void;
  onCancel: () => void;
}

export default function OverflowModal({
  stackName,
  targetAmount,
  currentAmount,
  allocationAmount,
  overflowAmount,
  defaultBehavior,
  onConfirm,
  onCancel,
}: OverflowModalProps) {
  const [selectedBehavior, setSelectedBehavior] = useState<'next_priority' | 'available_balance' | 'keep_in_stack'>(defaultBehavior);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside
  useClickOutside(modalRef, onCancel);

  const handleConfirm = () => {
    onConfirm(selectedBehavior);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Extra Money Detected</h2>
          </div>
          <button onClick={onCancel} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <X className="w-5 h-5 text-gray-900 dark:text-white" />
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-900 dark:text-white mb-2">
              You're allocating <span className="font-bold">${allocationAmount.toFixed(2)}</span> to <span className="font-semibold">{stackName}</span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Current: ${currentAmount.toFixed(2)} / Target: ${targetAmount.toFixed(2)}
            </p>
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 mt-2">
              ${overflowAmount.toFixed(2)} exceeds your target
            </p>
          </div>

          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
            What should happen to the extra ${overflowAmount.toFixed(2)}?
          </label>

          <div className="space-y-2">
            <label className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
              <input
                type="radio"
                name="overflowBehavior"
                value="next_priority"
                checked={selectedBehavior === 'next_priority'}
                onChange={(e) => setSelectedBehavior(e.target.value as any)}
                className="mt-0.5 w-4 h-4 text-amber-600"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 dark:text-white">Send to next priority stack</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  Extra funds automatically go to your next stack
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
              <input
                type="radio"
                name="overflowBehavior"
                value="available_balance"
                checked={selectedBehavior === 'available_balance'}
                onChange={(e) => setSelectedBehavior(e.target.value as any)}
                className="mt-0.5 w-4 h-4 text-amber-600"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 dark:text-white">Return to available balance</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  Extra funds stay in your account's available balance
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
              <input
                type="radio"
                name="overflowBehavior"
                value="keep_in_stack"
                checked={selectedBehavior === 'keep_in_stack'}
                onChange={(e) => setSelectedBehavior(e.target.value as any)}
                className="mt-0.5 w-4 h-4 text-amber-600"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 dark:text-white">Keep in this stack</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  Extra funds build up as a buffer in this stack
                </div>
              </div>
            </label>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 btn-primary"
          >
            Confirm Allocation
          </button>
        </div>
      </div>
    </div>
  );
}
