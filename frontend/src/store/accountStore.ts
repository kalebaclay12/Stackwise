import { create } from 'zustand';
import { accountAPI, stackAPI } from '../services/api';
import type { Account, Stack } from '../types';

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  category?: string;
}

interface AccountState {
  accounts: Account[];
  stacks: Record<string, Stack[]>;
  selectedAccount: Account | null;
  isLoading: boolean;
  error: string | null;
  transactionRefreshCounter: number;
  fetchAccounts: () => Promise<void>;
  fetchStacks: (accountId: string) => Promise<void>;
  selectAccount: (account: Account | null) => void;
  refreshCurrentAccount: () => Promise<void>;
  triggerTransactionRefresh: () => void;
  createAccount: (data: { type: 'checking' | 'savings'; name: string; color?: string }) => Promise<void>;
  createStack: (accountId: string, data: Partial<Stack>) => Promise<void>;
  updateStack: (stackId: string, data: Partial<Stack>) => Promise<void>;
  updateStackPriorities: (accountId: string, priorities: { id: string; priority: number }[]) => Promise<void>;
  deleteStack: (stackId: string) => Promise<void>;
  allocateToStack: (stackId: string, amount: number) => Promise<void>;
  deallocateFromStack: (stackId: string, amount: number) => Promise<void>;
  importCSVTransactions: (accountId: string, transactions: ParsedTransaction[]) => Promise<void>;
}

export const useAccountStore = create<AccountState>((set, get) => ({
  accounts: [],
  stacks: {},
  selectedAccount: null,
  isLoading: false,
  error: null,
  transactionRefreshCounter: 0,

  triggerTransactionRefresh: () => {
    set((state) => ({ transactionRefreshCounter: state.transactionRefreshCounter + 1 }));
  },

  fetchAccounts: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await accountAPI.getAll();
      set({ accounts: response.data, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch accounts',
        isLoading: false
      });
    }
  },

  fetchStacks: async (accountId: string) => {
    try {
      const response = await stackAPI.getByAccount(accountId);
      set((state) => ({
        stacks: { ...state.stacks, [accountId]: response.data }
      }));
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch stacks' });
    }
  },

  selectAccount: (account: Account | null) => {
    set({ selectedAccount: account });
    if (account) {
      get().fetchStacks(account.id);
    }
  },

  refreshCurrentAccount: async () => {
    const selectedAccountId = get().selectedAccount?.id;
    if (!selectedAccountId) return;

    // Fetch updated accounts data
    await get().fetchAccounts();

    // Update the selected account with fresh data
    const updatedAccount = get().accounts.find(acc => acc.id === selectedAccountId);
    if (updatedAccount) {
      set({ selectedAccount: updatedAccount });
    }

    // Refresh stacks for the current account
    await get().fetchStacks(selectedAccountId);
  },

  createAccount: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await accountAPI.create(data);
      set((state) => ({
        accounts: [...state.accounts, response.data],
        isLoading: false
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to create account',
        isLoading: false
      });
      throw error;
    }
  },

  createStack: async (accountId: string, data) => {
    try {
      const response = await stackAPI.create(accountId, data);
      set((state) => ({
        stacks: {
          ...state.stacks,
          [accountId]: [...(state.stacks[accountId] || []), response.data]
        }
      }));
      await get().refreshCurrentAccount();
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to create stack' });
      throw error;
    }
  },

  updateStack: async (stackId: string, data) => {
    try {
      const response = await stackAPI.update(stackId, data);
      const updatedStack = response.data;
      set((state) => ({
        stacks: Object.fromEntries(
          Object.entries(state.stacks).map(([accountId, stacks]) => [
            accountId,
            stacks.map(s => s.id === stackId ? updatedStack : s)
          ])
        )
      }));
      await get().refreshCurrentAccount();
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to update stack' });
      throw error;
    }
  },

  updateStackPriorities: async (accountId: string, priorities: { id: string; priority: number }[]) => {
    try {
      await stackAPI.updatePriorities(accountId, priorities);
      // Optimistically update the local state
      set((state) => ({
        stacks: {
          ...state.stacks,
          [accountId]: (state.stacks[accountId] || []).map(stack => {
            const priorityUpdate = priorities.find(p => p.id === stack.id);
            return priorityUpdate ? { ...stack, priority: priorityUpdate.priority } : stack;
          })
        }
      }));
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to update priorities' });
      // Refetch to restore correct order if update failed
      await get().fetchStacks(accountId);
      throw error;
    }
  },

  deleteStack: async (stackId: string) => {
    try {
      await stackAPI.delete(stackId);
      set((state) => ({
        stacks: Object.fromEntries(
          Object.entries(state.stacks).map(([accountId, stacks]) => [
            accountId,
            stacks.filter(s => s.id !== stackId)
          ])
        )
      }));
      await get().refreshCurrentAccount();
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to delete stack' });
      throw error;
    }
  },

  allocateToStack: async (stackId: string, amount: number) => {
    try {
      await stackAPI.allocate(stackId, amount);
      const selectedAccountId = get().selectedAccount?.id;
      await get().fetchAccounts();
      if (selectedAccountId) {
        // Update selectedAccount with the newly fetched data
        const updatedAccount = get().accounts.find(acc => acc.id === selectedAccountId);
        if (updatedAccount) {
          set({ selectedAccount: updatedAccount });
        }
        await get().fetchStacks(selectedAccountId);
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to allocate funds' });
      throw error;
    }
  },

  deallocateFromStack: async (stackId: string, amount: number) => {
    try {
      await stackAPI.deallocate(stackId, amount);
      const selectedAccountId = get().selectedAccount?.id;
      await get().fetchAccounts();
      if (selectedAccountId) {
        // Update selectedAccount with the newly fetched data
        const updatedAccount = get().accounts.find(acc => acc.id === selectedAccountId);
        if (updatedAccount) {
          set({ selectedAccount: updatedAccount });
        }
        await get().fetchStacks(selectedAccountId);
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to deallocate funds' });
      throw error;
    }
  },

  importCSVTransactions: async (accountId: string, transactions: ParsedTransaction[]) => {
    try {
      await accountAPI.importCSV(accountId, transactions);
      // Refresh account and stacks after import
      await get().fetchAccounts();
      const updatedAccount = get().accounts.find(acc => acc.id === accountId);
      if (updatedAccount) {
        set({ selectedAccount: updatedAccount });
      }
      await get().fetchStacks(accountId);
      // Trigger transaction list refresh
      get().triggerTransactionRefresh();
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to import CSV transactions' });
      throw error;
    }
  },
}));
