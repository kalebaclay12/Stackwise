import { create } from 'zustand';
import { accountAPI, stackAPI } from '../services/api';
import type { Account, Stack } from '../types';

interface AccountState {
  accounts: Account[];
  stacks: Record<string, Stack[]>;
  selectedAccount: Account | null;
  isLoading: boolean;
  error: string | null;
  fetchAccounts: () => Promise<void>;
  fetchStacks: (accountId: string) => Promise<void>;
  selectAccount: (account: Account | null) => void;
  createAccount: (data: { type: 'checking' | 'savings'; name: string }) => Promise<void>;
  createStack: (accountId: string, data: Partial<Stack>) => Promise<void>;
  updateStack: (stackId: string, data: Partial<Stack>) => Promise<void>;
  deleteStack: (stackId: string) => Promise<void>;
  allocateToStack: (stackId: string, amount: number) => Promise<void>;
  deallocateFromStack: (stackId: string, amount: number) => Promise<void>;
}

export const useAccountStore = create<AccountState>((set, get) => ({
  accounts: [],
  stacks: {},
  selectedAccount: null,
  isLoading: false,
  error: null,

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
      await get().fetchAccounts();
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
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to update stack' });
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
      await get().fetchAccounts();
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to delete stack' });
      throw error;
    }
  },

  allocateToStack: async (stackId: string, amount: number) => {
    try {
      await stackAPI.allocate(stackId, amount);
      await get().fetchAccounts();
      const selectedAccount = get().selectedAccount;
      if (selectedAccount) {
        await get().fetchStacks(selectedAccount.id);
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to allocate funds' });
      throw error;
    }
  },

  deallocateFromStack: async (stackId: string, amount: number) => {
    try {
      await stackAPI.deallocate(stackId, amount);
      await get().fetchAccounts();
      const selectedAccount = get().selectedAccount;
      if (selectedAccount) {
        await get().fetchStacks(selectedAccount.id);
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to deallocate funds' });
      throw error;
    }
  },
}));
