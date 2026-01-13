import axios from 'axios';
import type {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  User,
  Account,
  Stack,
  Transaction
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (credentials: LoginCredentials) =>
    api.post<AuthResponse>('/auth/login', credentials),

  register: (credentials: RegisterCredentials) =>
    api.post<AuthResponse>('/auth/register', credentials),

  getProfile: () =>
    api.get<User>('/auth/profile'),

  logout: () => {
    localStorage.removeItem('token');
  },
};

export const accountAPI = {
  getAll: () =>
    api.get<Account[]>('/accounts'),

  getById: (id: string) =>
    api.get<Account>(`/accounts/${id}`),

  create: (data: { type: 'checking' | 'savings'; name: string }) =>
    api.post<Account>('/accounts', data),

  update: (id: string, data: { type?: 'checking' | 'savings'; name?: string; color?: string }) =>
    api.put<Account>(`/accounts/${id}`, data),

  delete: (id: string) =>
    api.delete(`/accounts/${id}`),

  importCSV: (accountId: string, transactions: Array<{
    date: string;
    description: string;
    amount: number;
    category?: string;
  }>) =>
    api.post<{ message: string; imported: number }>(`/accounts/${accountId}/import-csv`, { transactions }),
};

export const stackAPI = {
  getByAccount: (accountId: string) =>
    api.get<Stack[]>(`/accounts/${accountId}/stacks`),

  create: (accountId: string, data: Partial<Stack>) =>
    api.post<Stack>(`/accounts/${accountId}/stacks`, data),

  update: (stackId: string, data: Partial<Stack>) =>
    api.put<Stack>(`/stacks/${stackId}`, data),

  updatePriorities: (accountId: string, priorities: { id: string; priority: number }[]) =>
    api.put(`/accounts/${accountId}/stacks/priorities`, { priorities }),

  delete: (stackId: string) =>
    api.delete(`/stacks/${stackId}`),

  allocate: (stackId: string, amount: number) =>
    api.post(`/stacks/${stackId}/allocate`, { amount }),

  deallocate: (stackId: string, amount: number) =>
    api.post(`/stacks/${stackId}/deallocate`, { amount }),

  reset: (stackId: string, params?: {
    keepAmount?: boolean;
    keepDueDate?: boolean;
    newTargetAmount?: number;
    newTargetDueDate?: Date;
    newAutoAllocateAmount?: number;
    newAutoAllocateFrequency?: string;
  }) =>
    api.post(`/stacks/${stackId}/reset`, params),

  dismissReset: (stackId: string) =>
    api.post(`/stacks/${stackId}/dismiss-reset`),

  getPendingResets: () =>
    api.get(`/stacks/pending-resets`),
};

export const transactionAPI = {
  getByAccount: (accountId: string, params?: { limit?: number; offset?: number }) =>
    api.get<Transaction[]>(`/accounts/${accountId}/transactions`, { params }),

  getByStack: (stackId: string, params?: { limit?: number; offset?: number }) =>
    api.get<Transaction[]>(`/stacks/${stackId}/transactions`, { params }),

  create: (accountId: string, data: Partial<Transaction>) =>
    api.post<Transaction>(`/accounts/${accountId}/transactions`, data),

  delete: (transactionId: string) =>
    api.delete(`/transactions/${transactionId}`),
};

export const transactionMatcherAPI = {
  scanForMatches: (accountId: string) =>
    api.post<{ message: string; suggestionsCreated: number }>(`/accounts/${accountId}/scan-matches`),

  getPendingMatches: (accountId: string) =>
    api.get<Array<{ transaction: Transaction; suggestedStack: Stack | null }>>(`/accounts/${accountId}/pending-matches`),

  confirmMatch: (transactionId: string) =>
    api.post<{ message: string }>(`/transactions/${transactionId}/confirm-match`),

  rejectMatch: (transactionId: string) =>
    api.post<{ message: string }>(`/transactions/${transactionId}/reject-match`),

  unmatch: (transactionId: string) =>
    api.post<{ message: string }>(`/transactions/${transactionId}/unmatch`),
};

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: string;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}

export const notificationAPI = {
  getNotifications: (params?: { limit?: number; unreadOnly?: boolean }) =>
    api.get<Notification[]>('/notifications', { params }),

  getUnreadCount: () =>
    api.get<{ count: number }>('/notifications/unread-count'),

  markAsRead: (id: string) =>
    api.put<{ message: string }>(`/notifications/${id}/read`),

  markAllAsRead: () =>
    api.put<{ message: string }>('/notifications/read-all'),

  deleteNotification: (id: string) =>
    api.delete<{ message: string }>(`/notifications/${id}`),
};

export const subscriptionAPI = {
  createCheckoutSession: () =>
    api.post<{ sessionId: string; url: string }>('/subscription/create-checkout-session'),

  createPortalSession: () =>
    api.post<{ url: string }>('/subscription/create-portal-session'),
};

export default api;
