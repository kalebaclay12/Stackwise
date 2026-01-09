export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  subscriptionTier: 'free' | 'pro';
  subscriptionStatus: 'active' | 'cancelled' | 'past_due' | 'expired';
  subscriptionExpiresAt?: string;
  createdAt: string;
}

export interface Account {
  id: string;
  userId: string;
  linkedBankId?: string;
  type: 'checking' | 'savings';
  name: string;
  balance: number;
  availableBalance: number;
  color?: string;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Stack {
  id: string;
  accountId: string;
  name: string;
  description?: string;
  targetAmount?: number;
  currentAmount: number;
  targetDueDate?: string;
  color: string;
  icon: string;
  priority: number;
  isActive: boolean;
  autoAllocate: boolean;
  autoAllocateAmount?: number;
  autoAllocateFrequency?: 'daily' | 'every_other_day' | 'weekly' | 'bi_weekly' | 'bi_monthly' | 'monthly' | 'semi_annually' | 'annually';
  autoAllocateStartDate?: string;
  autoAllocateNextDate?: string;
  resetBehavior: 'none' | 'auto_reset' | 'ask_reset' | 'delete';
  recurringPeriod?: 'none' | 'weekly' | 'bi_weekly' | 'bi_monthly' | 'monthly' | 'quarterly' | 'semi_annually' | 'annually';
  isCompleted: boolean;
  completedAt?: string;
  pendingReset: boolean;
  overflowBehavior: 'next_priority' | 'available_balance' | 'keep_in_stack';
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  stackId?: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'allocation' | 'deduction';
  amount: number;
  description: string;
  category?: string;
  date: string;
  balance: number;
  isVirtual: boolean;
  metadata?: Record<string, any>;
  suggestedStackId?: string;
  matchConfirmed: boolean;
  matchRejected: boolean;
  matchConfidenceScore?: number;
  createdAt: string;
}

export interface StackAllocation {
  stackId: string;
  amount: number;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface UserPreferences {
  id: string;
  userId: string;
  currencyCode: string;
  currencySymbol: string;
  dateFormat: string;
  timeFormat: string;
  itemsPerPage: number;
  defaultAccountId?: string;
  emailNotifications: boolean;
  negativeBalanceBehavior: 'auto_deallocate' | 'allow_negative' | 'notify_only';
  createdAt: string;
  updatedAt: string;
}

export const TIER_LIMITS = {
  free: {
    maxStacks: 3,
    autoAllocation: false,
    bankLinking: false,
    transactionMatching: false,
  },
  pro: {
    maxStacks: Infinity,
    autoAllocation: true,
    bankLinking: true,
    transactionMatching: true,
  },
} as const;
