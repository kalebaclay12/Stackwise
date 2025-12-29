export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

export interface Account {
  id: string;
  userId: string;
  type: 'checking' | 'savings';
  name: string;
  balance: number;
  availableBalance: number;
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
  color: string;
  icon: string;
  priority: number;
  isActive: boolean;
  autoAllocate: boolean;
  autoAllocateAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  stackId?: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'allocation';
  amount: number;
  description: string;
  category?: string;
  date: string;
  balance: number;
  metadata?: Record<string, any>;
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
