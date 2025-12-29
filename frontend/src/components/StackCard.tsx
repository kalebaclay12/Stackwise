import { useState } from 'react';
import { Stack } from '../types';
import { useAccountStore } from '../store/accountStore';
import {
  Target,
  TrendingUp,
  ArrowUpCircle,
  ArrowDownCircle,
  MoreVertical,
  Trash2,
  Edit2,
  Eye,
} from 'lucide-react';
import AllocateModal from './AllocateModal';
import StackDetailModal from './StackDetailModal';
import EditStackModal from './EditStackModal';

interface StackCardProps {
  stack: Stack;
}

export default function StackCard({ stack }: StackCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showAllocate, setShowAllocate] = useState(false);
  const [showDeallocate, setShowDeallocate] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const { deleteStack } = useAccountStore();

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

  return (
    <>
      <div className="card relative">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: stack.color + '20' }}
            >
              <span className="text-2xl">{stack.icon}</span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{stack.name}</h3>
              {stack.description && (
                <p className="text-sm text-gray-500">{stack.description}</p>
              )}
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <MoreVertical className="w-5 h-5 text-gray-400" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowDetail(true);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowEdit(true);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    handleDelete();
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-gray-600">Current Amount</p>
              {stack.targetAmount && (
                <p className="text-xs text-gray-500">
                  {progressPercent.toFixed(0)}% of goal
                </p>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(stack.currentAmount)}
            </p>
          </div>

          {stack.targetAmount && (
            <>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor: stack.color,
                  }}
                />
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Target className="w-4 h-4" />
                <span>Goal: {formatCurrency(stack.targetAmount)}</span>
              </div>
            </>
          )}

          {stack.autoAllocate && stack.autoAllocateAmount && (
            <div className="flex items-center gap-1 text-sm text-primary-600">
              <TrendingUp className="w-4 h-4" />
              <span>Auto-allocate: {formatCurrency(stack.autoAllocateAmount)}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={() => setShowAllocate(true)}
            className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm"
          >
            <ArrowUpCircle className="w-4 h-4" />
            Add Money
          </button>
          <button
            onClick={() => setShowDeallocate(true)}
            className="flex-1 btn-secondary flex items-center justify-center gap-2 text-sm"
            disabled={stack.currentAmount === 0}
          >
            <ArrowDownCircle className="w-4 h-4" />
            Remove
          </button>
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
    </>
  );
}
