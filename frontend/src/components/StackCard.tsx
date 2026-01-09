import { useState, useEffect } from 'react';
import { Stack } from '../types';
import { useAccountStore } from '../store/accountStore';
import {
  MoreVertical,
  Trash2,
  Edit2,
  CheckCircle2,
} from 'lucide-react';
import StackDetailModal from './StackDetailModal';
import EditStackModal from './EditStackModal';
import StackCompletionModal from './StackCompletionModal';

interface StackCardProps {
  stack: Stack;
  isDragging?: boolean;
  priorityLabel?: string;
}

export default function StackCard({ stack, isDragging, priorityLabel }: StackCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const { deleteStack } = useAccountStore();

  // Show completion modal when stack becomes completed and pending reset
  useEffect(() => {
    if (stack.isCompleted && stack.pendingReset) {
      setShowCompletion(true);
    }
  }, [stack.isCompleted, stack.pendingReset]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const progressPercent = stack.targetAmount
    ? Math.min((stack.currentAmount / stack.targetAmount) * 100, 100)
    : 0;

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${stack.name}"?`)) {
      await deleteStack(stack.id);
    }
  };

  const handleCardClick = () => {
    // Only open detail modal if not dragging
    if (!isDragging) {
      setShowDetail(true);
    }
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        className={`card hover:shadow-lg transition-all duration-200 cursor-grab active:cursor-grabbing group border-2 ${
          stack.isCompleted
            ? 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10'
            : 'border-transparent hover:border-primary-200 dark:hover:border-primary-800'
        }`}
      >
        <div className="space-y-3">
          {priorityLabel && (
            <div className="flex items-center">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                {priorityLabel}
              </span>
            </div>
          )}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 relative"
                style={{ backgroundColor: stack.color + '20' }}
              >
                <span className="text-2xl">{stack.icon}</span>
                {stack.isCompleted && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {stack.name}
                  </h3>
                  {stack.isCompleted && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                      Completed
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="relative flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <MoreVertical className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              </button>
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-8 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setShowEdit(true);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        handleDelete();
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(stack.currentAmount)}
            </p>
          </div>

          {stack.targetAmount && (
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatCurrency(stack.targetAmount)} goal
                </p>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  {progressPercent.toFixed(0)}%
                </p>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor: stack.color,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {showDetail && (
        <StackDetailModal
          stack={stack}
          onClose={() => setShowDetail(false)}
        />
      )}

      {showEdit && (
        <EditStackModal
          stack={stack}
          onClose={() => setShowEdit(false)}
        />
      )}

      {showCompletion && (
        <StackCompletionModal
          stack={stack}
          onClose={() => setShowCompletion(false)}
        />
      )}
    </>
  );
}
