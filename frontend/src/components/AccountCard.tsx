import { Account } from '../types';
import { Wallet, TrendingUp, Building2, TestTube, MoreVertical, Edit3, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface AccountCardProps {
  account: Account;
  isSelected: boolean;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function AccountCard({ account, isSelected, onClick, onEdit, onDelete }: AccountCardProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
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

  // Show dropdown menu if edit or delete handlers are provided
  const showMenuButton = onEdit || onDelete;

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

      {/* Dropdown Menu Button for Test Accounts */}
      {showMenuButton && (
        <div className="absolute bottom-3 right-3 z-20" ref={dropdownRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdown(!showDropdown);
            }}
            className="w-8 h-8 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
            title="Account options"
          >
            <MoreVertical className="w-4 h-4 text-white" />
          </button>

          {showDropdown && (
            <div className="absolute bottom-full right-0 mb-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1">
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDropdown(false);
                    onEdit();
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit</span>
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDropdown(false);
                    onDelete();
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-red-600 dark:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Gradient Background */}
      <div className={`${defaultGradientClass} p-4 sm:p-6 text-white`} style={getGradientStyle()}>
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
              {account.type === 'checking' ? (
                <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              ) : (
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-white text-sm sm:text-base truncate">{account.name}</h3>
              <p className="text-xs sm:text-sm text-white/80 capitalize">{account.type}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2 sm:space-y-3">
          <div>
            <p className="text-xs sm:text-sm text-white/80">Available</p>
            <p className="text-2xl sm:text-3xl font-bold text-white">
              {formatCurrency(account.availableBalance)}
            </p>
          </div>
          <div className="pt-2 sm:pt-3 border-t border-white/20">
            <p className="text-xs sm:text-sm text-white/80">Total Balance</p>
            <p className="text-lg sm:text-xl font-semibold text-white">
              {formatCurrency(account.balance)}
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}
