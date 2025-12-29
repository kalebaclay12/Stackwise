import { useState, FormEvent } from 'react';
import { useAccountStore } from '../store/accountStore';
import { X, Edit3 } from 'lucide-react';
import { Stack } from '../types';

interface EditStackModalProps {
  stack: Stack;
  onClose: () => void;
}

const STACK_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

const STACK_ICONS = ['💰', '🏠', '🚗', '✈️', '🎓', '🏥', '🎯', '💳', '🛒', '🎁', '📱', '🍔', '⚡', '🎮', '💡'];

export default function EditStackModal({ stack, onClose }: EditStackModalProps) {
  const [name, setName] = useState(stack.name);
  const [description, setDescription] = useState(stack.description || '');
  const [targetAmount, setTargetAmount] = useState(stack.targetAmount?.toString() || '');
  const [color, setColor] = useState(stack.color);
  const [icon, setIcon] = useState(stack.icon);
  const [autoAllocate, setAutoAllocate] = useState(stack.autoAllocate);
  const [autoAllocateAmount, setAutoAllocateAmount] = useState(stack.autoAllocateAmount?.toString() || '');
  const [isLoading, setIsLoading] = useState(false);
  const { updateStack } = useAccountStore();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await updateStack(stack.id, {
        name,
        description: description || undefined,
        targetAmount: targetAmount ? parseFloat(targetAmount) : undefined,
        color,
        icon,
        autoAllocate,
        autoAllocateAmount: autoAllocate && autoAllocateAmount ? parseFloat(autoAllocateAmount) : undefined,
      });
      onClose();
    } catch (error) {
      console.error('Update stack error:', error);
      alert('Failed to update stack');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Edit3 className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold">Edit Stack</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Stack Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="e.g., Emergency Fund, Vacation, Car Payment"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input"
              placeholder="Brief description"
            />
          </div>

          <div>
            <label htmlFor="targetAmount" className="block text-sm font-medium text-gray-700 mb-1">
              Target Amount (Optional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">$</span>
              <input
                id="targetAmount"
                type="number"
                step="0.01"
                min="0"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="input pl-8"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Icon
            </label>
            <div className="grid grid-cols-10 gap-2">
              {STACK_ICONS.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={`w-10 h-10 text-2xl rounded-lg border-2 transition-all ${
                    icon === i ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <div className="grid grid-cols-10 gap-2">
              {STACK_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-10 h-10 rounded-lg border-2 transition-all ${
                    color === c ? 'border-gray-900 scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <input
                id="autoAllocate"
                type="checkbox"
                checked={autoAllocate}
                onChange={(e) => setAutoAllocate(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="autoAllocate" className="text-sm font-medium text-gray-700">
                Auto-allocate on payday
              </label>
            </div>

            {autoAllocate && (
              <div>
                <label htmlFor="autoAllocateAmount" className="block text-sm font-medium text-gray-700 mb-1">
                  Amount per payday
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                  <input
                    id="autoAllocateAmount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={autoAllocateAmount}
                    onChange={(e) => setAutoAllocateAmount(e.target.value)}
                    className="input pl-8"
                    placeholder="0.00"
                    required={autoAllocate}
                  />
                </div>
              </div>
            )}
          </div>

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
              className="flex-1 btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
