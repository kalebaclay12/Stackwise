import { useState, useMemo, useRef, useEffect } from 'react';
import { X, ArrowUpCircle, ArrowDownCircle, TrendingUp, Calendar } from 'lucide-react';
import { Stack } from '../types';
import TransactionHistory from './TransactionHistory';
import AllocateModal from './AllocateModal';
import { calculatePaymentAmount, formatDaysUntilDue } from '../utils/paymentCalculator';

interface StackDetailModalProps {
  stack: Stack;
  onClose: () => void;
}

export default function StackDetailModal({ stack, onClose }: StackDetailModalProps) {
  const [showAllocate, setShowAllocate] = useState(false);
  const [showDeallocate, setShowDeallocate] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Completely disable useClickOutside when child modals are open
  const shouldEnableClickOutside = !showAllocate && !showDeallocate;

  // Close modal when clicking outside
  useEffect(() => {
    if (!shouldEnableClickOutside) return;

    let mouseDownTarget: EventTarget | null = null;

    const handleMouseDown = (event: MouseEvent) => {
      mouseDownTarget = event.target;
    };

    const handleMouseUp = (event: MouseEvent) => {
      if (
        modalRef.current &&
        mouseDownTarget &&
        !modalRef.current.contains(mouseDownTarget as Node) &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
      mouseDownTarget = null;
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [shouldEnableClickOutside, onClose]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Calculate payment amounts for bi-weekly payments if due date is set
  const paymentCalculation = useMemo(() => {
    if (!stack.targetAmount || !stack.targetDueDate) return null;

    return calculatePaymentAmount(
      stack.targetAmount,
      stack.currentAmount,
      new Date(stack.targetDueDate),
      'bi_weekly' // Default to bi-weekly for display
    );
  }, [stack.targetAmount, stack.currentAmount, stack.targetDueDate]);

  const formatNextAllocationDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return 'Overdue';
    } else if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else if (diffDays < 7) {
      return `in ${diffDays} days`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const getFrequencyLabel = (frequency?: string) => {
    switch (frequency) {
      case 'daily': return 'Daily';
      case 'every_other_day': return 'Every Other Day';
      case 'weekly': return 'Weekly';
      case 'bi_weekly': return 'Bi-Weekly';
      case 'monthly': return 'Monthly';
      case 'semi_annually': return 'Semi-Annually';
      case 'annually': return 'Annually';
      default: return 'Unknown';
    }
  };

  const progressPercent = stack.targetAmount
    ? Math.min((stack.currentAmount / stack.targetAmount) * 100, 100)
    : 0;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div
          ref={modalRef}
          className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full shadow-2xl my-8"
        >
          {/* Header */}
          <div className="border-b border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shadow-sm"
                  style={{ backgroundColor: stack.color + '20' }}
                >
                  {stack.icon}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{stack.name}</h2>
                  {stack.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{stack.description}</p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Balance Card */}
            <div className="bg-gradient-to-br from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 rounded-xl p-6 text-white shadow-lg">
              <p className="text-sm opacity-90 mb-1">Current Balance</p>
              <p className="text-4xl font-bold">
                {formatCurrency(stack.currentAmount)}
              </p>
              {stack.targetAmount && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs opacity-90">Goal: {formatCurrency(stack.targetAmount)}</span>
                    <span className="text-xs font-semibold">{progressPercent.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-white transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="text-xs mt-2 opacity-90">
                    {stack.currentAmount >= stack.targetAmount
                      ? 'Goal reached!'
                      : `${formatCurrency(stack.targetAmount - stack.currentAmount)} remaining`}
                  </p>
                </div>
              )}
            </div>

            {/* Auto-Allocation Info */}
            {stack.autoAllocate && stack.autoAllocateAmount && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white mb-1">Auto-Allocation Active</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {formatCurrency(stack.autoAllocateAmount)} • {getFrequencyLabel(stack.autoAllocateFrequency)}
                    </p>
                    {stack.autoAllocateNextDate && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Next allocation: {formatNextAllocationDate(stack.autoAllocateNextDate)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Payment Calculator Info */}
            {paymentCalculation && stack.targetDueDate && (
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white mb-1">Payment Plan</p>
                    {paymentCalculation.isOverdue ? (
                      <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                        Target date has passed
                      </p>
                    ) : (
                      <>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {formatDaysUntilDue(paymentCalculation.daysUntilDue)}
                        </p>
                        <p className="text-lg font-bold text-purple-700 dark:text-purple-300 mt-1">
                          {formatCurrency(paymentCalculation.amountPerPayment)} per bi-weekly payment
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {paymentCalculation.paymentsRemaining} payment{paymentCalculation.paymentsRemaining !== 1 ? 's' : ''} remaining to reach your goal
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAllocate(true);
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <ArrowUpCircle className="w-5 h-5" />
                Add Money
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeallocate(true);
                }}
                disabled={stack.currentAmount === 0}
                className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowDownCircle className="w-5 h-5" />
                Remove Money
              </button>
            </div>

            {/* Transaction History */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Transaction History</h3>
              <TransactionHistory stackId={stack.id} />
            </div>
          </div>
        </div>
      </div>

      {showAllocate && (
        <AllocateModal
          stack={stack}
          mode="allocate"
          onClose={() => setShowAllocate(false)}
        />
      )}

      {showDeallocate && (
        <AllocateModal
          stack={stack}
          mode="deallocate"
          onClose={() => setShowDeallocate(false)}
        />
      )}
    </>
  );
}
