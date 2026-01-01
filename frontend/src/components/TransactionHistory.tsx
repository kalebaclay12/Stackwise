import { useEffect, useState } from 'react';
import { Transaction } from '../types';
import { transactionAPI } from '../services/api';
import { ArrowUpCircle, ArrowDownCircle, ArrowLeftRight, Layers } from 'lucide-react';
import { format } from 'date-fns';

interface TransactionHistoryProps {
  accountId?: string;
  stackId?: string;
  title?: string;
}

export default function TransactionHistory({ accountId, stackId, title }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        let response;
        if (accountId) {
          response = await transactionAPI.getByAccount(accountId, { limit: 50 });
        } else if (stackId) {
          response = await transactionAPI.getByStack(stackId, { limit: 50 });
        }
        if (response) {
          setTransactions(response.data);
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [accountId, stackId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(amount));
  };

  const getTransactionIcon = (type: string, amount: number) => {
    if (type === 'allocation') {
      return amount > 0 ? (
        <ArrowUpCircle className="w-5 h-5 text-white" />
      ) : (
        <ArrowDownCircle className="w-5 h-5 text-white" />
      );
    }
    if (type === 'deposit') {
      return <ArrowUpCircle className="w-5 h-5 text-white" />;
    }
    if (type === 'withdrawal') {
      return <ArrowDownCircle className="w-5 h-5 text-white" />;
    }
    if (type === 'transfer') {
      return <ArrowLeftRight className="w-5 h-5 text-white" />;
    }
    return <Layers className="w-5 h-5 text-white" />;
  };

  const getIconBgColor = (type: string, amount: number) => {
    if (type === 'allocation') {
      return amount > 0 ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-blue-500 to-blue-600';
    }
    if (type === 'deposit') return 'bg-gradient-to-br from-green-500 to-emerald-600';
    if (type === 'withdrawal') return 'bg-gradient-to-br from-red-500 to-red-600';
    if (type === 'transfer') return 'bg-gradient-to-br from-blue-500 to-blue-600';
    return 'bg-gradient-to-br from-gray-500 to-gray-600';
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Bank Transfer': 'bg-blue-100 text-blue-700',
      'Deposit': 'bg-green-100 text-green-700',
      'Withdrawal': 'bg-red-100 text-red-700',
      'Transfer': 'bg-purple-100 text-purple-700',
      'Stack Allocation': 'bg-orange-100 text-orange-700',
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  const getAmountColor = (type: string, amount: number) => {
    if (type === 'allocation') {
      return amount > 0 ? 'text-green-600' : 'text-blue-600';
    }
    if (type === 'deposit') return 'text-green-600';
    if (type === 'withdrawal') return 'text-red-600';
    return 'text-gray-900';
  };

  if (isLoading) {
    return (
      <div className="card">
        <p className="text-center text-gray-500">Loading transactions...</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="card text-center py-8">
        <p className="text-gray-600">No transactions yet</p>
      </div>
    );
  }

  return (
    <div className="card">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <div className="space-y-2">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md hover:border-gray-200 transition-all duration-200"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className={`w-11 h-11 ${getIconBgColor(transaction.type, transaction.amount)} rounded-xl flex items-center justify-center shadow-sm`}>
                {getTransactionIcon(transaction.type, transaction.amount)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{transaction.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-500">{format(new Date(transaction.date), 'MMM d, yyyy')}</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-sm text-gray-500">{format(new Date(transaction.date), 'h:mm a')}</span>
                  {transaction.category && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getCategoryColor(transaction.category)}`}>
                        {transaction.category}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right ml-4">
              <p className={`text-lg font-bold ${getAmountColor(transaction.type, transaction.amount)}`}>
                {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Bal: {formatCurrency(transaction.balance)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
