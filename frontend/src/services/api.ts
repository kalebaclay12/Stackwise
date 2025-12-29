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

  update: (id: string, data: { type?: 'checking' | 'savings'; name?: string }) =>
    api.put<Account>(`/accounts/${id}`, data),

  delete: (id: string) =>
    api.delete(`/accounts/${id}`),
};

export const stackAPI = {
  getByAccount: (accountId: string) =>
    api.get<Stack[]>(`/accounts/${accountId}/stacks`),

  create: (accountId: string, data: Partial<Stack>) =>
    api.post<Stack>(`/accounts/${accountId}/stacks`, data),

  update: (stackId: string, data: Partial<Stack>) =>
    api.put<Stack>(`/stacks/${stackId}`, data),

  delete: (stackId: string) =>
    api.delete(`/stacks/${stackId}`),

  allocate: (stackId: string, amount: number) =>
    api.post(`/stacks/${stackId}/allocate`, { amount }),

  deallocate: (stackId: string, amount: number) =>
    api.post(`/stacks/${stackId}/deallocate`, { amount }),
};

export const transactionAPI = {
  getByAccount: (accountId: string, params?: { limit?: number; offset?: number }) =>
    api.get<Transaction[]>(`/accounts/${accountId}/transactions`, { params }),

  getByStack: (stackId: string, params?: { limit?: number; offset?: number }) =>
    api.get<Transaction[]>(`/stacks/${stackId}/transactions`, { params }),

  create: (accountId: string, data: Partial<Transaction>) =>
    api.post<Transaction>(`/accounts/${accountId}/transactions`, data),
};

export default api;
