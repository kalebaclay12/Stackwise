import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Crown, Check, X } from 'lucide-react';
import { TIER_LIMITS } from '../../types';

export default function SubscriptionSettings() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  if (!user) return null;

  const isPro = user.subscriptionTier === 'pro';
  const isCancelled = user.subscriptionStatus === 'cancelled';

  const handleUpgrade = () => {
    // This will be connected to Stripe in Phase 2
    alert('Stripe payment integration will be added in Phase 2. For now, ask the admin to upgrade your account for testing.');
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your Pro subscription? You will lose access to Pro features at the end of your billing period.')) {
      return;
    }

    setIsLoading(true);
    try {
      // This will be connected to Stripe in Phase 2
      alert('Cancellation will be handled through Stripe in Phase 2. For now, your subscription remains active.');
    } catch (error) {
      console.error('Cancellation error:', error);
      alert('Failed to cancel subscription');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <div className="card">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Current Plan</h2>
                {isPro && <Crown className="w-5 h-5 text-amber-500" />}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isPro ? 'You have access to all premium features' : 'Upgrade to unlock all features'}
              </p>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                isPro
                  ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}>
                {isPro ? (
                  <>
                    <Crown className="w-4 h-4" />
                    Pro Plan
                  </>
                ) : (
                  'Free Plan'
                )}
              </div>
              {isCancelled && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  Expires: {user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt).toLocaleDateString() : 'N/A'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Feature Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Free Plan */}
        <div className="card">
          <div className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Free</h3>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">$0</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Forever</p>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Up to {TIER_LIMITS.free.maxStacks} stacks
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Manual allocations</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Basic transaction history</span>
              </li>
              <li className="flex items-start gap-2">
                <X className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Auto-allocation</span>
              </li>
              <li className="flex items-start gap-2">
                <X className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Bank linking</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Pro Plan */}
        <div className="card border-2 border-amber-400 dark:border-amber-600 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-gradient-to-br from-amber-400 to-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
            RECOMMENDED
          </div>
          <div className="p-6">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pro</h3>
                <Crown className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">$6.99</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">per month</p>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Unlimited</strong> stacks
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Auto-allocation</strong> scheduling
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Bank linking</strong> with Plaid
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>AI transaction matching</strong>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Priority support</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="card">
        <div className="p-6">
          {!isPro ? (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Ready to upgrade?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Unlock unlimited stacks, auto-allocation, and bank linking for just $6.99/month.
              </p>
              <button
                onClick={handleUpgrade}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Crown className="w-4 h-4" />
                Upgrade to Pro
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                Cancel anytime. No long-term commitment required.
              </p>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {isCancelled ? 'Subscription Cancelled' : 'Manage Subscription'}
              </h3>
              {isCancelled ? (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Your Pro subscription will remain active until {user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt).toLocaleDateString() : 'the end of your billing period'}.
                  </p>
                  <button
                    onClick={handleUpgrade}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <Crown className="w-4 h-4" />
                    Reactivate Pro
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    You're currently on the Pro plan. You can cancel anytime and your subscription will remain active until the end of your billing period.
                  </p>
                  <button
                    onClick={handleCancelSubscription}
                    disabled={isLoading}
                    className="btn-secondary text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    {isLoading ? 'Processing...' : 'Cancel Subscription'}
                  </button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                    No penalties. Keep Pro features until the end of your billing period.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Testing Note */}
      <div className="card bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <div className="p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>For Testing:</strong> Payment integration with Stripe will be added in Phase 2.
            Contact the admin to manually upgrade accounts for friends/family testing.
          </p>
        </div>
      </div>
    </div>
  );
}
