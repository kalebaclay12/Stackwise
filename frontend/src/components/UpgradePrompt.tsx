import { Crown } from 'lucide-react';

interface UpgradePromptProps {
  feature: string;
  inline?: boolean;
}

export default function UpgradePrompt({ feature, inline = false }: UpgradePromptProps) {
  if (inline) {
    return (
      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
        <Crown className="w-4 h-4" />
        <span className="font-medium">Pro Feature</span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <Crown className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">
            Upgrade to Pro
          </h4>
          <p className="text-sm text-amber-800 dark:text-amber-200">
            {feature} is a Pro feature. Upgrade to unlock unlimited stacks, auto-allocation, bank linking, and more.
          </p>
          <button className="mt-3 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-medium rounded-lg text-sm transition-all shadow-sm hover:shadow-md">
            Upgrade to Pro
          </button>
        </div>
      </div>
    </div>
  );
}
