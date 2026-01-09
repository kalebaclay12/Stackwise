import { Account } from '../types';
import { Wallet, TrendingUp, Building2, TestTube } from 'lucide-react';

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

  // Use custom color if set, otherwise use default gradients
  const getGradientStyle = () => {
    if (account.color) {
      return { background: account.color };
    }
    return {};
  };

  const defaultGradientClass = account.color
    ? ''
    : (account.type === 'checking'
        ? 'bg-gradient-to-br from-blue-500 to-blue-600'
        : 'bg-gradient-to-br from-green-500 to-emerald-600');

  return (
    <button
      onClick={onClick}
      className={`relative overflow-hidden text-left transition-all duration-300 hover:shadow-xl hover:-translate-y-1 rounded-xl ${
        isSelected ? 'ring-2 ring-primary-500 shadow-lg' : 'shadow-sm'
      }`}
    >
      {/* Badge indicating account type */}
      <div className="absolute top-3 right-3 z-10">
        {account.linkedBankId ? (
          <div className="bg-emerald-500 text-white px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg">
            <Building2 className="w-3 h-3" />
            Real Bank
          </div>
        ) : (
          <div className="bg-orange-500 text-white px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg">
            <TestTube className="w-3 h-3" />
            Test Account
          </div>
        )}
      </div>

      {/* Gradient Background */}
      <div className={`${defaultGradientClass} p-6 text-white`} style={getGradientStyle()}>
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              {account.type === 'checking' ? (
                <Wallet className="w-6 h-6 text-white" />
              ) : (
                <TrendingUp className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-white">{account.name}</h3>
              <p className="text-sm text-white/80 capitalize">{account.type}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm text-white/80">Available</p>
            <p className="text-3xl font-bold text-white">
              {formatCurrency(account.availableBalance)}
            </p>
          </div>
          <div className="pt-3 border-t border-white/20">
            <p className="text-sm text-white/80">Total Balance</p>
            <p className="text-xl font-semibold text-white">
              {formatCurrency(account.balance)}
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}
