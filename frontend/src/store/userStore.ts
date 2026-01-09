import { create } from 'zustand';
import { User, TIER_LIMITS } from '../types';

interface UserState {
  user: User | null;
  setUser: (user: User | null) => void;
  isProUser: () => boolean;
  canCreateStack: (currentStackCount: number) => boolean;
  getStackLimit: () => number;
  hasFeature: (feature: 'autoAllocation' | 'bankLinking' | 'transactionMatching') => boolean;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,

  setUser: (user: User | null) => {
    set({ user });
  },

  isProUser: () => {
    const { user } = get();
    return user?.subscriptionTier === 'pro';
  },

  canCreateStack: (currentStackCount: number) => {
    const { user } = get();
    if (!user) return false;
    const limit = TIER_LIMITS[user.subscriptionTier].maxStacks;
    return currentStackCount < limit;
  },

  getStackLimit: () => {
    const { user } = get();
    if (!user) return 0;
    return TIER_LIMITS[user.subscriptionTier].maxStacks;
  },

  hasFeature: (feature: 'autoAllocation' | 'bankLinking' | 'transactionMatching') => {
    const { user } = get();
    if (!user) return false;
    return TIER_LIMITS[user.subscriptionTier][feature];
  },
}));
