import { Account } from '../types';
import { Wallet, TrendingUp } from 'lucide-react';

interface AccountCardProps {
  account: Account;
  isSelected: boolean;
  onClick: () => void;
}

export default function AccountCard({ account, isSelected, onClick }: AccountCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <button
      onClick={onClick}
      className={`card text-left transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary-500' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            account.type === 'checking' ? 'bg-blue-100' : 'bg-green-100'
          }`}>
            {account.type === 'checking' ? (
              <Wallet className="w-6 h-6 text-blue-600" />
            ) : (
              <TrendingUp className="w-6 h-6 text-green-600" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{account.name}</h3>
            <p className="text-sm text-gray-500 capitalize">{account.type}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <p className="text-sm text-gray-600">Total Balance</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(account.balance)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Available</p>
          <p className="text-lg font-semibold text-primary-600">
            {formatCurrency(account.availableBalance)}
          </p>
        </div>
      </div>
    </button>
  );
}
