import { useState, FormEvent, useRef, useMemo } from 'react';
import { Stack } from '../types';
import { X, CheckCircle2, RefreshCw, Edit3, Trash2, Calendar, DollarSign, ArrowRight, Sparkles } from 'lucide-react';
import { useAccountStore } from '../store/accountStore';
import { stackAPI } from '../services/api';
import { useClickOutside } from '../hooks/useClickOutside';

interface StackCompletionModalProps {
  stack: Stack;
  onClose: () => void;
}

// Calculate next due date based on recurring period
function calculateNextDueDate(currentDueDate: Date | null, period: string | null): Date {
  const baseDate = currentDueDate ? new Date(currentDueDate) : new Date();
  const nextDate = new Date(baseDate);

  switch (period) {
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'bi_weekly':
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case 'bi_monthly':
      nextDate.setDate(nextDate.getDate() + 15);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'semi_annually':
      nextDate.setMonth(nextDate.getMonth() + 6);
      break;
    case 'annually':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    default:
      // Default to monthly
      nextDate.setMonth(nextDate.getMonth() + 1);
  }

  // If the calculated date is in the past, keep adding periods until it's in the future
  const now = new Date();
  while (nextDate <= now) {
    switch (period) {
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'bi_weekly':
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case 'bi_monthly':
        nextDate.setDate(nextDate.getDate() + 15);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'semi_annually':
        nextDate.setMonth(nextDate.getMonth() + 6);
        break;
      case 'annually':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      default:
        nextDate.setMonth(nextDate.getMonth() + 1);
    }
  }

  return nextDate;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatFrequency(freq: string | null): string {
  const map: Record<string, string> = {
    weekly: 'Weekly',
    bi_weekly: 'Every 2 weeks',
    bi_monthly: 'Twice a month',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    semi_annually: 'Every 6 months',
    annually: 'Yearly',
  };
  return freq ? map[freq] || freq : 'Monthly';
}

export default function StackCompletionModal({ stack, onClose }: StackCompletionModalProps) {
  const [step, setStep] = useState<'main' | 'reset_confirm' | 'reset_edit' | 'delete_confirm'>('main');
  const [newTargetAmount, setNewTargetAmount] = useState(stack.targetAmount?.toString() || '');
  const [newTargetDueDate, setNewTargetDueDate] = useState('');
  const [newAutoAllocateAmount, setNewAutoAllocateAmount] = useState(stack.autoAllocateAmount?.toString() || '');
  const [isLoading, setIsLoading] = useState(false);
  const { refreshCurrentAccount, deleteStack } = useAccountStore();
  const modalRef = useRef<HTMLDivElement>(null);

  useClickOutside(modalRef, onClose);

  // Calculate suggested next due date
  const suggestedNextDueDate = useMemo(() => {
    return calculateNextDueDate(
      stack.targetDueDate ? new Date(stack.targetDueDate) : null,
      stack.recurringPeriod ?? null
    );
  }, [stack.targetDueDate, stack.recurringPeriod]);

  // Initialize the date input with suggested date when entering edit mode
  const handleEnterEditMode = () => {
    setNewTargetDueDate(suggestedNextDueDate.toISOString().split('T')[0]);
    setStep('reset_edit');
  };

  const handleResetSame = async () => {
    setIsLoading(true);
    try {
      await stackAPI.reset(stack.id, {
        newTargetDueDate: suggestedNextDueDate,
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

  const handleResetWithEdit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await stackAPI.reset(stack.id, {
        newTargetAmount: newTargetAmount ? parseFloat(newTargetAmount) : undefined,
        newTargetDueDate: newTargetDueDate ? new Date(newTargetDueDate + 'T12:00:00') : suggestedNextDueDate,
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
      >
        {/* Header with celebration gradient */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-5 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBjeD0iMjAiIGN5PSIyMCIgcj0iMyIvPjwvZz48L3N2Zz4=')] opacity-50"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">Bill Paid!</h2>
                  <Sparkles className="w-5 h-5 text-yellow-300" />
                </div>
                <p className="text-white/80 text-sm">{stack.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Summary Card */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Amount Saved</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  ${stack.currentAmount.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Target</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  ${stack.targetAmount?.toFixed(2)}
                </p>
              </div>
            </div>
            {stack.targetAmount && stack.currentAmount !== stack.targetAmount && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                <p className={`text-sm ${stack.currentAmount >= (stack.targetAmount || 0) ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {stack.currentAmount >= (stack.targetAmount || 0)
                    ? `+$${(stack.currentAmount - (stack.targetAmount || 0)).toFixed(2)} extra saved`
                    : `$${((stack.targetAmount || 0) - stack.currentAmount).toFixed(2)} short of target`}
                </p>
              </div>
            )}
          </div>

          {/* Main Options */}
          {step === 'main' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Ready for the next payment cycle?
              </p>

              {/* Quick Reset Option */}
              <button
                onClick={() => setStep('reset_confirm')}
                className="w-full flex items-center gap-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-xl hover:border-emerald-400 dark:hover:border-emerald-600 transition-all group"
              >
                <div className="w-11 h-11 rounded-full bg-emerald-100 dark:bg-emerald-800/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <RefreshCw className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-900 dark:text-white">Reset for Next Cycle</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Next due: {formatDate(suggestedNextDueDate)}
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-emerald-500 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Edit & Reset Option */}
              <button
                onClick={handleEnterEditMode}
                className="w-full flex items-center gap-4 p-4 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:border-primary-400 dark:hover:border-primary-500 transition-all group"
              >
                <div className="w-11 h-11 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Edit3 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-900 dark:text-white">Customize & Reset</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Change amount, date, or frequency
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Delete Option */}
              <button
                onClick={() => setStep('delete_confirm')}
                className="w-full flex items-center gap-4 p-4 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:border-red-300 dark:hover:border-red-700 transition-all group"
              >
                <div className="w-11 h-11 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Trash2 className="w-5 h-5 text-red-500 dark:text-red-400" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-900 dark:text-white">Delete Stack</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    No longer need this payment?
                  </div>
                </div>
              </button>

              <button
                onClick={handleDismiss}
                className="w-full mt-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 py-2 transition-colors"
              >
                Keep as completed
              </button>
            </div>
          )}

          {/* Reset Confirmation */}
          {step === 'reset_confirm' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Next Cycle Settings</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Target Amount</span>
                    <span className="font-medium text-gray-900 dark:text-white">${stack.targetAmount?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Next Due Date</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatDate(suggestedNextDueDate)}</span>
                  </div>
                  {stack.autoAllocate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Auto-allocation</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        ${stack.autoAllocateAmount?.toFixed(2)} {formatFrequency(stack.autoAllocateFrequency ?? null)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('main')}
                  className="flex-1 py-2.5 px-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  disabled={isLoading}
                >
                  Back
                </button>
                <button
                  onClick={handleResetSame}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? 'Resetting...' : 'Confirm Reset'}
                </button>
              </div>
            </div>
          )}

          {/* Edit Form */}
          {step === 'reset_edit' && (
            <form onSubmit={handleResetWithEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Target Amount
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newTargetAmount}
                    onChange={(e) => setNewTargetAmount(e.target.value)}
                    className="input pl-9"
                    placeholder={stack.targetAmount?.toFixed(2)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Next Due Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={newTargetDueDate}
                    onChange={(e) => setNewTargetDueDate(e.target.value)}
                    className="input pl-9"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              {stack.autoAllocate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Auto-Allocation Amount
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newAutoAllocateAmount}
                      onChange={(e) => setNewAutoAllocateAmount(e.target.value)}
                      className="input pl-9"
                      placeholder={stack.autoAllocateAmount?.toFixed(2)}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatFrequency(stack.autoAllocateFrequency ?? null)} allocation
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('main')}
                  className="flex-1 py-2.5 px-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  disabled={isLoading}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save & Reset'}
                </button>
              </div>
            </form>
          )}

          {/* Delete Confirmation */}
          {step === 'delete_confirm' && (
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-2">
                  Are you sure you want to delete this stack?
                </p>
                <p className="text-sm text-red-600 dark:text-red-300">
                  Any saved amount (${stack.currentAmount.toFixed(2)}) will be returned to your available balance.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('main')}
                  className="flex-1 py-2.5 px-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-colors disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? 'Deleting...' : 'Delete Stack'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
