import { useState, FormEvent, useRef } from 'react';
import { Stack } from '../types';
import { X, CheckCircle2, RefreshCw, Edit3, Trash2 } from 'lucide-react';
import { useAccountStore } from '../store/accountStore';
import { stackAPI } from '../services/api';
import { useClickOutside } from '../hooks/useClickOutside';

interface StackCompletionModalProps {
  stack: Stack;
  onClose: () => void;
}

export default function StackCompletionModal({ stack, onClose }: StackCompletionModalProps) {
  const [selectedOption, setSelectedOption] = useState<'reset_same' | 'reset_edit' | 'delete' | null>(null);
  const [editingParams, setEditingParams] = useState(false);
  const [newTargetAmount, setNewTargetAmount] = useState(stack.targetAmount?.toString() || '');
  const [newTargetDueDate, setNewTargetDueDate] = useState('');
  const [newAutoAllocateAmount, setNewAutoAllocateAmount] = useState(stack.autoAllocateAmount?.toString() || '');
  const [isLoading, setIsLoading] = useState(false);
  const { refreshCurrentAccount, deleteStack } = useAccountStore();
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside
  useClickOutside(modalRef, onClose);

  const handleResetSame = async () => {
    setIsLoading(true);
    try {
      await stackAPI.reset(stack.id, {});
      await refreshCurrentAccount();
      onClose();
    } catch (error) {
      console.error('Reset stack error:', error);
      alert('Failed to reset stack');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetWithEdit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await stackAPI.reset(stack.id, {
        newTargetAmount: newTargetAmount ? parseFloat(newTargetAmount) : undefined,
        newTargetDueDate: newTargetDueDate ? new Date(newTargetDueDate) : undefined,
        newAutoAllocateAmount: newAutoAllocateAmount ? parseFloat(newAutoAllocateAmount) : undefined,
      });
      await refreshCurrentAccount();
      onClose();
    } catch (error) {
      console.error('Reset stack error:', error);
      alert('Failed to reset stack');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${stack.name}"? This cannot be undone.`)) {
      return;
    }

    setIsLoading(true);
    try {
      await deleteStack(stack.id);
      onClose();
    } catch (error) {
      console.error('Delete stack error:', error);
      alert('Failed to delete stack');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = async () => {
    try {
      await stackAPI.dismissReset(stack.id);
      await refreshCurrentAccount();
      onClose();
    } catch (error) {
      console.error('Dismiss reset error:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Goal Completed!</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{stack.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <X className="w-5 h-5 text-gray-900 dark:text-white" />
          </button>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Target Amount</span>
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
              ${stack.targetAmount?.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Amount</span>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              ${stack.currentAmount.toFixed(2)}
            </span>
          </div>
        </div>

        {!selectedOption && !editingParams && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              What would you like to do with this stack?
            </p>

            <button
              onClick={() => setSelectedOption('reset_same')}
              className="w-full flex items-center gap-3 p-4 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30">
                <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium text-gray-900 dark:text-white">Reset with Same Settings</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Start over with ${stack.targetAmount?.toFixed(2)} goal
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                setSelectedOption('reset_edit');
                setEditingParams(true);
              }}
              className="w-full flex items-center gap-3 p-4 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30">
                <Edit3 className="w-5 h-5 text-purple-600 dark:text-purple-400 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium text-gray-900 dark:text-white">Reset with Different Settings</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Change the amount or due date
                </div>
              </div>
            </button>

            <button
              onClick={() => setSelectedOption('delete')}
              className="w-full flex items-center gap-3 p-4 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-red-500 dark:hover:border-red-400 transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center group-hover:bg-red-100 dark:group-hover:bg-red-900/30">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium text-gray-900 dark:text-white">Delete Stack</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Remove this stack permanently
                </div>
              </div>
            </button>

            <button
              onClick={handleDismiss}
              className="w-full mt-4 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 py-2"
            >
              Keep as completed (dismiss)
            </button>
          </div>
        )}

        {selectedOption === 'reset_same' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This will reset the stack to $0 and keep the same target amount of ${stack.targetAmount?.toFixed(2)}.
              {stack.autoAllocate && (
                <span className="block mt-2">
                  Auto-allocation will continue with ${stack.autoAllocateAmount?.toFixed(2)} {stack.autoAllocateFrequency}.
                </span>
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedOption(null)}
                className="flex-1 btn-secondary"
                disabled={isLoading}
              >
                Back
              </button>
              <button
                onClick={handleResetSame}
                className="flex-1 btn-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Resetting...' : 'Confirm Reset'}
              </button>
            </div>
          </div>
        )}

        {selectedOption === 'reset_edit' && editingParams && (
          <form onSubmit={handleResetWithEdit} className="space-y-4">
            <div>
              <label htmlFor="newTargetAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                New Target Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500 dark:text-gray-400">$</span>
                <input
                  id="newTargetAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newTargetAmount}
                  onChange={(e) => setNewTargetAmount(e.target.value)}
                  className="input pl-8"
                  placeholder={stack.targetAmount?.toFixed(2)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="newTargetDueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                New Target Due Date (Optional)
              </label>
              <input
                id="newTargetDueDate"
                type="date"
                value={newTargetDueDate}
                onChange={(e) => setNewTargetDueDate(e.target.value)}
                className="input"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {stack.autoAllocate && (
              <div>
                <label htmlFor="newAutoAllocateAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  New Auto-Allocation Amount (Optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500 dark:text-gray-400">$</span>
                  <input
                    id="newAutoAllocateAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newAutoAllocateAmount}
                    onChange={(e) => setNewAutoAllocateAmount(e.target.value)}
                    className="input pl-8"
                    placeholder={stack.autoAllocateAmount?.toFixed(2)}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedOption(null);
                  setEditingParams(false);
                }}
                className="flex-1 btn-secondary"
                disabled={isLoading}
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 btn-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Resetting...' : 'Confirm Reset'}
              </button>
            </div>
          </form>
        )}

        {selectedOption === 'delete' && (
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                Warning: This action cannot be undone
              </p>
              <p className="text-sm text-red-600 dark:text-red-300 mt-2">
                The stack will be permanently deleted. Any remaining balance (${stack.currentAmount.toFixed(2)}) will be returned to your available balance.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedOption(null)}
                className="flex-1 btn-secondary"
                disabled={isLoading}
              >
                Back
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? 'Deleting...' : 'Delete Stack'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
