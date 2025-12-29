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
        <ArrowUpCircle className="w-5 h-5 text-green-600" />
      ) : (
        <ArrowDownCircle className="w-5 h-5 text-blue-600" />
      );
    }
    if (type === 'deposit') {
      return <ArrowUpCircle className="w-5 h-5 text-green-600" />;
    }
    if (type === 'withdrawal') {
      return <ArrowDownCircle className="w-5 h-5 text-red-600" />;
    }
    if (type === 'transfer') {
      return <ArrowLeftRight className="w-5 h-5 text-blue-600" />;
    }
    return <Layers className="w-5 h-5 text-gray-600" />;
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
      <h3 className="text-lg font-semibold mb-4">{title || 'Transaction History'}</h3>
      <div className="space-y-3">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                {getTransactionIcon(transaction.type, transaction.amount)}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{transaction.description}</p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>{format(new Date(transaction.date), 'MMM d, yyyy')}</span>
                  <span>•</span>
                  <span>{format(new Date(transaction.date), 'h:mm a')}</span>
                  {transaction.category && (
                    <>
                      <span>•</span>
                      <span className="text-primary-600">{transaction.category}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-lg font-semibold ${getAmountColor(transaction.type, transaction.amount)}`}>
                {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
              </p>
              <p className="text-xs text-gray-500">
                Balance: {formatCurrency(transaction.balance)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
