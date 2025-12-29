import { X, Target, TrendingUp } from 'lucide-react';
import { Stack } from '../types';
import TransactionHistory from './TransactionHistory';

interface StackDetailModalProps {
  stack: Stack;
  onClose: () => void;
}

export default function StackDetailModal({ stack, onClose }: StackDetailModalProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const progressPercent = stack.targetAmount
    ? Math.min((stack.currentAmount / stack.targetAmount) * 100, 100)
    : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-3xl w-full p-6 my-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
              style={{ backgroundColor: stack.color + '20' }}
            >
              {stack.icon}
            </div>
            <div>
              <h2 className="text-2xl font-semibold">{stack.name}</h2>
              {stack.description && (
                <p className="text-gray-600">{stack.description}</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="card bg-gradient-to-br from-primary-50 to-primary-100">
            <p className="text-sm text-primary-800 mb-1">Current Amount</p>
            <p className="text-3xl font-bold text-primary-900">
              {formatCurrency(stack.currentAmount)}
            </p>
          </div>

          {stack.targetAmount && (
            <div className="card bg-gradient-to-br from-green-50 to-green-100">
              <p className="text-sm text-green-800 mb-1">Target Goal</p>
              <p className="text-3xl font-bold text-green-900">
                {formatCurrency(stack.targetAmount)}
              </p>
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-green-700">Progress</span>
                  <span className="text-xs font-medium text-green-900">
                    {progressPercent.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-green-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-green-600 transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {stack.autoAllocate && stack.autoAllocateAmount && (
            <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-blue-800" />
                <p className="text-sm text-blue-800">Auto-Allocation</p>
              </div>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(stack.autoAllocateAmount)}
              </p>
              <p className="text-xs text-blue-700 mt-1">per payday</p>
            </div>
          )}

          {stack.targetAmount && (
            <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-purple-800" />
                <p className="text-sm text-purple-800">Remaining</p>
              </div>
              <p className="text-2xl font-bold text-purple-900">
                {formatCurrency(Math.max(0, stack.targetAmount - stack.currentAmount))}
              </p>
              <p className="text-xs text-purple-700 mt-1">
                {stack.currentAmount >= stack.targetAmount ? 'Goal reached!' : 'to reach goal'}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6">
          <TransactionHistory stackId={stack.id} title={`${stack.name} Transactions`} />
        </div>
      </div>
    </div>
  );
}
