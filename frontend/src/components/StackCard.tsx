import { useState, useEffect } from 'react';
import { Stack } from '../types';
import { useAccountStore } from '../store/accountStore';
import {
  MoreVertical,
  Trash2,
  Edit2,
  CheckCircle2,
  GripVertical,
} from 'lucide-react';
import StackDetailModal from './StackDetailModal';
import EditStackModal from './EditStackModal';
import StackCompletionModal from './StackCompletionModal';

interface StackCardProps {
  stack: Stack;
  isDragging?: boolean;
  priorityLabel?: string;
  dragHandleProps?: any; // Props to attach to the drag handle
}

export default function StackCard({ stack, isDragging, priorityLabel, dragHandleProps }: StackCardProps) {
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
        className={`card hover:shadow-lg transition-all duration-200 cursor-pointer group border-2 ${
          stack.isCompleted && stack.pendingReset
            ? 'border-orange-400 dark:border-orange-600 bg-orange-50/50 dark:bg-orange-900/10 animate-pulse'
            : stack.isCompleted
            ? 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10'
            : 'border-transparent hover:border-primary-200 dark:hover:border-primary-800'
        }`}
      >
        <div className="space-y-1.5 sm:space-y-2">
          {priorityLabel && (
            <div className="flex items-center">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                {priorityLabel}
              </span>
            </div>
          )}
          <div className="flex items-start justify-between">
            {/* Drag Handle - always visible on mobile (opacity-100), hidden on desktop until hover */}
            <div
              {...dragHandleProps}
              onClick={(e) => e.stopPropagation()}
              className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing touch-none flex items-center justify-center min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] -ml-2 sm:-ml-3 -mt-1"
              title="Drag to reorder"
            >
              <GripVertical className="w-5 h-5 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500" />
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-1">
              <div
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 relative flex-shrink-0"
                style={{ backgroundColor: stack.color + '20' }}
              >
                <span className="text-lg sm:text-xl">{stack.icon}</span>
                {stack.isCompleted && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                    {stack.name}
                  </h3>
                  {stack.isCompleted && stack.pendingReset && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full animate-pulse">
                      Reset Needed
                    </span>
                  )}
                  {stack.isCompleted && !stack.pendingReset && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                      Completed
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="relative flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 sm:p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <MoreVertical className="w-5 h-5 sm:w-4 sm:h-4 text-gray-400 dark:text-gray-500" />
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
            <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(stack.currentAmount)}
            </p>
          </div>

          {stack.targetAmount && (
            <div className="space-y-0.5 sm:space-y-1">
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatCurrency(stack.targetAmount)} goal
                </p>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  {progressPercent.toFixed(0)}%
                </p>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 sm:h-1.5">
                <div
                  className="h-1 sm:h-1.5 rounded-full transition-all duration-500"
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
