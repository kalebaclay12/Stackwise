import { useState, FormEvent, useMemo, useRef, useEffect } from 'react';
import { useAccountStore } from '../store/accountStore';
import { useAuthStore } from '../store/authStore';
import { X, Target, Calendar, Repeat } from 'lucide-react';
import { calculatePaymentAmount, getFrequencyLabel, formatDaysUntilDue } from '../utils/paymentCalculator';
import { TIER_LIMITS } from '../types';
import UpgradePrompt from './UpgradePrompt';

interface CreateStackModalProps {
  accountId: string;
  onClose: () => void;
}

const STACK_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

const STACK_ICONS = ['💰', '🏠', '🚗', '✈️', '🎓', '🏥', '🎯', '💳', '🛒', '🎁', '📱', '🍔', '⚡', '🎮', '💡'];

export default function CreateStackModal({ accountId, onClose }: CreateStackModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState(STACK_ICONS[0]);
  const [color, setColor] = useState(STACK_COLORS[0]);
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDueDate, setTargetDueDate] = useState('');
  const [recurringPeriod, setRecurringPeriod] = useState<'none' | 'weekly' | 'bi_weekly' | 'bi_monthly' | 'monthly' | 'quarterly' | 'semi_annually' | 'annually'>('none');
  const [paymentFrequency, setPaymentFrequency] = useState<'daily' | 'every_other_day' | 'weekly' | 'bi_weekly' | 'bi_monthly' | 'monthly' | 'semi_annually' | 'annually'>('bi_weekly');
  const [firstPaymentDate, setFirstPaymentDate] = useState('');
  const [autoAllocate, setAutoAllocate] = useState(false);
  const [autoAllocateAmount, setAutoAllocateAmount] = useState('');
  const [autoAllocateFrequency, setAutoAllocateFrequency] = useState<'daily' | 'every_other_day' | 'weekly' | 'bi_weekly' | 'bi_monthly' | 'monthly' | 'semi_annually' | 'annually'>('bi_weekly');
  const [autoAllocateStartDate, setAutoAllocateStartDate] = useState('');
  const [resetBehavior, setResetBehavior] = useState<'none' | 'auto_reset' | 'ask_reset' | 'delete'>('none');
  const [overflowBehavior, setOverflowBehavior] = useState<'next_priority' | 'available_balance' | 'keep_in_stack'>('next_priority');
  const [isLoading, setIsLoading] = useState(false);
  const { createStack, stacks } = useAccountStore();
  const { user } = useAuthStore();
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Check subscription tier limits
  const currentStackCount = stacks[accountId]?.length || 0;
  const stackLimit = user ? TIER_LIMITS[user.subscriptionTier].maxStacks : 3;
  const canCreateStack = currentStackCount < stackLimit;
  const isProUser = user?.subscriptionTier === 'pro';
  const canUseAutoAllocation = user ? TIER_LIMITS[user.subscriptionTier].autoAllocation : false;

  // Auto-focus the name input when modal opens
  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  // Calculate payment amounts when target amount and due date are set
  const paymentCalculation = useMemo(() => {
    if (!targetAmount || !targetDueDate) return null;

    const target = parseFloat(targetAmount);
    if (isNaN(target) || target <= 0) return null;

    return calculatePaymentAmount(
      target,
      0, // current amount is 0 for new stack
      new Date(targetDueDate),
      paymentFrequency,
      firstPaymentDate ? new Date(firstPaymentDate) : undefined
    );
  }, [targetAmount, targetDueDate, paymentFrequency, firstPaymentDate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const accountStacks = stacks[accountId] || [];

      // If recurring period is set, automatically set resetBehavior to auto_reset
      const finalResetBehavior = recurringPeriod !== 'none' ? 'auto_reset' : resetBehavior;

      await createStack(accountId, {
        name,
        description: description || undefined,
        targetAmount: targetAmount ? parseFloat(targetAmount) : undefined,
        targetDueDate: targetDueDate || undefined,
        color,
        icon,
        currentAmount: 0,
        priority: accountStacks.length,
        isActive: true,
        autoAllocate,
        autoAllocateAmount: autoAllocate && autoAllocateAmount ? parseFloat(autoAllocateAmount) : undefined,
        autoAllocateFrequency: autoAllocate ? autoAllocateFrequency : undefined,
        autoAllocateStartDate: autoAllocate && autoAllocateStartDate ? autoAllocateStartDate : undefined,
        resetBehavior: finalResetBehavior,
        recurringPeriod: recurringPeriod !== 'none' ? recurringPeriod : undefined,
        overflowBehavior,
      });
      onClose();
    } catch (error) {
      console.error('Create stack error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create Stack</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <X className="w-5 h-5 text-gray-900 dark:text-white" />
          </button>
        </div>

        {!canCreateStack && (
          <div className="mb-6">
            <UpgradePrompt
              feature={`You've reached the maximum of ${stackLimit} stacks for the free tier`}
            />
          </div>
        )}

        {!isProUser && canCreateStack && (
          <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              You're using <strong>{currentStackCount} of {stackLimit}</strong> free stacks. Upgrade to Pro for unlimited stacks.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">Basic Information</h3>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Stack Name *
              </label>
              <input
                ref={nameInputRef}
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
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Icon
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {STACK_ICONS.slice(0, 10).map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setIcon(i)}
                      className={`w-10 h-10 text-2xl rounded-lg border-2 transition-all ${
                        icon === i ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {STACK_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                        color === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Goal Settings Section */}
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">Goal Settings</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="targetAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Target Amount (Optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500 dark:text-gray-400">$</span>
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
                <label htmlFor="targetDueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Target Date (Optional)
                </label>
                <input
                  id="targetDueDate"
                  type="date"
                  value={targetDueDate}
                  onChange={(e) => setTargetDueDate(e.target.value)}
                  className="input"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {targetAmount && parseFloat(targetAmount) > 0 && (
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-100 mb-3">
                  <Repeat className="w-4 h-4" />
                  <h4 className="font-medium text-sm">Recurring Expense</h4>
                </div>
                <label htmlFor="recurringPeriod" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Does this expense repeat?
                </label>
                <select
                  id="recurringPeriod"
                  value={recurringPeriod}
                  onChange={(e) => setRecurringPeriod(e.target.value as any)}
                  className="input"
                >
                  <option value="none">No, this is a one-time goal</option>
                  <option value="weekly">Yes, weekly</option>
                  <option value="bi_weekly">Yes, every 2 weeks</option>
                  <option value="bi_monthly">Yes, twice a month</option>
                  <option value="monthly">Yes, monthly</option>
                  <option value="quarterly">Yes, every 3 months</option>
                  <option value="semi_annually">Yes, every 6 months</option>
                  <option value="annually">Yes, annually</option>
                </select>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  {recurringPeriod !== 'none'
                    ? 'When this goal is completed, it will automatically reset for the next period with a new due date.'
                    : 'Choose a frequency if this is a recurring expense like rent, insurance, or subscriptions.'}
                </p>
              </div>
            )}
          </div>

          {/* Payment Calculator Section */}
          {targetAmount && parseFloat(targetAmount) > 0 && targetDueDate && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                <Calendar className="w-4 h-4" />
                <h3 className="font-medium text-sm">Payment Calculator</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="paymentFrequency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    How often would you like to contribute?
                  </label>
                  <select
                    id="paymentFrequency"
                    value={paymentFrequency}
                    onChange={(e) => setPaymentFrequency(e.target.value as any)}
                    className="input"
                  >
                    <option value="daily">Daily</option>
                    <option value="every_other_day">Every Other Day</option>
                    <option value="weekly">Weekly</option>
                    <option value="bi_weekly">Bi-Weekly (Every 2 weeks)</option>
                    <option value="bi_monthly">Bi-Monthly (Twice a month)</option>
                    <option value="monthly">Monthly</option>
                    <option value="semi_annually">Semi-Annually (Every 6 months)</option>
                    <option value="annually">Annually</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="firstPaymentDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    First Payment Date
                  </label>
                  <input
                    id="firstPaymentDate"
                    type="date"
                    value={firstPaymentDate}
                    onChange={(e) => setFirstPaymentDate(e.target.value)}
                    className="input"
                    min={new Date().toISOString().split('T')[0]}
                    max={targetDueDate || undefined}
                  />
                </div>
              </div>

              {paymentCalculation && !paymentCalculation.isOverdue && (
                <>
                  <div className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {formatDaysUntilDue(paymentCalculation.daysUntilDue)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Minimum required per payment:
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      ${paymentCalculation.amountPerPayment.toFixed(2)} per {getFrequencyLabel(paymentFrequency).toLowerCase()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {paymentCalculation.paymentsRemaining} payment{paymentCalculation.paymentsRemaining !== 1 ? 's' : ''} remaining
                    </p>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <div className="flex items-start gap-3 mb-3">
                      <input
                        id="useCalculatedPayments"
                        type="checkbox"
                        checked={autoAllocate}
                        disabled={!canUseAutoAllocation}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setAutoAllocate(checked);
                          if (checked) {
                            setAutoAllocateFrequency(paymentFrequency);
                            // Use first payment date if set, otherwise use today
                            setAutoAllocateStartDate(firstPaymentDate || new Date().toISOString().split('T')[0]);
                            if (!autoAllocateAmount) {
                              setAutoAllocateAmount(paymentCalculation.amountPerPayment.toFixed(2));
                            }
                          }
                        }}
                        className="mt-0.5 w-4 h-4 text-green-600 border-gray-300 dark:border-gray-600 rounded focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <label htmlFor="useCalculatedPayments" className={`text-sm font-medium ${canUseAutoAllocation ? 'text-gray-900 dark:text-white cursor-pointer' : 'text-gray-500 dark:text-gray-400'}`}>
                            Automate these payments
                          </label>
                          {!canUseAutoAllocation && <UpgradePrompt feature="Auto-allocation" inline />}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                          Automatically allocate money {getFrequencyLabel(paymentFrequency).toLowerCase()} to reach your goal
                        </p>
                      </div>
                    </div>

                    {autoAllocate && (
                      <div>
                        <label htmlFor="customAutoAllocateAmount" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Amount per {getFrequencyLabel(paymentFrequency).toLowerCase()} payment
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-gray-500 dark:text-gray-400">$</span>
                          <input
                            id="customAutoAllocateAmount"
                            type="number"
                            step="0.01"
                            min={paymentCalculation.amountPerPayment.toFixed(2)}
                            value={autoAllocateAmount}
                            onChange={(e) => setAutoAllocateAmount(e.target.value)}
                            className="input pl-8"
                            placeholder={paymentCalculation.amountPerPayment.toFixed(2)}
                          />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Enter any amount ≥ ${paymentCalculation.amountPerPayment.toFixed(2)} (you can round up)
                        </p>
                      </div>
                    )}
                  </div>

                  {autoAllocate && autoAllocateAmount && parseFloat(autoAllocateAmount) > paymentCalculation.amountPerPayment && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                      <label className="block text-xs font-medium text-gray-900 dark:text-white mb-2">
                        What should happen to extra money?
                      </label>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                        You're allocating ${(parseFloat(autoAllocateAmount) - paymentCalculation.amountPerPayment).toFixed(2)} more than required per payment
                      </p>
                      <div className="space-y-2">
                        <label className="flex items-start gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="overflowBehavior"
                            value="next_priority"
                            checked={overflowBehavior === 'next_priority'}
                            onChange={(e) => setOverflowBehavior(e.target.value as any)}
                            className="mt-0.5 w-3.5 h-3.5 text-amber-600"
                          />
                          <div className="flex-1">
                            <div className="text-xs font-medium text-gray-900 dark:text-white">Send to next priority stack</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Extra funds go to your next stack after this one is full</div>
                          </div>
                        </label>
                        <label className="flex items-start gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="overflowBehavior"
                            value="available_balance"
                            checked={overflowBehavior === 'available_balance'}
                            onChange={(e) => setOverflowBehavior(e.target.value as any)}
                            className="mt-0.5 w-3.5 h-3.5 text-amber-600"
                          />
                          <div className="flex-1">
                            <div className="text-xs font-medium text-gray-900 dark:text-white">Return to available balance</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Extra funds stay in your account's available balance</div>
                          </div>
                        </label>
                        <label className="flex items-start gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="overflowBehavior"
                            value="keep_in_stack"
                            checked={overflowBehavior === 'keep_in_stack'}
                            onChange={(e) => setOverflowBehavior(e.target.value as any)}
                            className="mt-0.5 w-3.5 h-3.5 text-amber-600"
                          />
                          <div className="flex-1">
                            <div className="text-xs font-medium text-gray-900 dark:text-white">Keep in this stack</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Extra funds build up as a buffer in this stack</div>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}
                </>
              )}

              {paymentCalculation && paymentCalculation.isOverdue && (
                <div className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-700 rounded-lg p-3">
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                    This target date has passed
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Completion Behavior Section */}
          {targetAmount && parseFloat(targetAmount) > 0 && recurringPeriod === 'none' && (
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
                What should happen when this goal is completed?
              </label>
              <div className="space-y-2">
                <label className="flex items-start gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                  <input
                    type="radio"
                    name="resetBehavior"
                    value="none"
                    checked={resetBehavior === 'none'}
                    onChange={(e) => setResetBehavior(e.target.value as any)}
                    className="mt-0.5 w-4 h-4 text-primary-600"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Nothing</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Great for one-time goals you complete early
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                  <input
                    type="radio"
                    name="resetBehavior"
                    value="ask_reset"
                    checked={resetBehavior === 'ask_reset'}
                    onChange={(e) => setResetBehavior(e.target.value as any)}
                    className="mt-0.5 w-4 h-4 text-primary-600"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Ask to Reset</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Get notified when complete with option to reset or adjust
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                  <input
                    type="radio"
                    name="resetBehavior"
                    value="delete"
                    checked={resetBehavior === 'delete'}
                    onChange={(e) => setResetBehavior(e.target.value as any)}
                    className="mt-0.5 w-4 h-4 text-primary-600"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Delete When Complete</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      For one-time goals like vacation savings
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Note about recurring expenses */}
          {targetAmount && parseFloat(targetAmount) > 0 && recurringPeriod !== 'none' && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
              <p className="text-sm text-indigo-900 dark:text-indigo-100 font-medium mb-1">
                Automatic Reset Enabled
              </p>
              <p className="text-xs text-indigo-700 dark:text-indigo-300">
                This stack will automatically reset {recurringPeriod === 'weekly' ? 'weekly' : recurringPeriod === 'bi_weekly' ? 'every 2 weeks' : recurringPeriod === 'bi_monthly' ? 'twice a month' : recurringPeriod === 'monthly' ? 'monthly' : recurringPeriod === 'quarterly' ? 'every 3 months' : recurringPeriod === 'semi_annually' ? 'every 6 months' : 'annually'} after reaching the target amount. The due date will be automatically updated for the next period.
              </p>
            </div>
          )}

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
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !canCreateStack}
              title={!canCreateStack ? 'Upgrade to Pro to create more stacks' : ''}
            >
              {isLoading ? 'Creating...' : 'Create Stack'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
