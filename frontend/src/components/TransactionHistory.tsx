import { useEffect, useState, useRef } from 'react';
import { Transaction } from '../types';
import { transactionAPI, transactionMatcherAPI } from '../services/api';
import { ArrowUpCircle, ArrowDownCircle, ArrowLeftRight, Layers, ChevronsDown, ChevronsUp, ChevronLeft, ChevronRight, X, MoreVertical, Trash2, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { useAccountStore } from '../store/accountStore';
import { useClickOutside } from '../hooks/useClickOutside';
import EditTransactionModal from './EditTransactionModal';

interface TransactionHistoryProps {
  accountId?: string;
  stackId?: string;
  title?: string;
}

export default function TransactionHistory({ accountId, stackId, title }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const { refreshCurrentAccount } = useAccountStore();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const ITEMS_PER_PAGE_COLLAPSED = 5;
  const ITEMS_PER_PAGE_EXPANDED = 10;

  // Close dropdown when clicking outside
  useClickOutside(dropdownRef, () => setOpenDropdownId(null));

  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        let response;
        if (accountId) {
          response = await transactionAPI.getByAccount(accountId, { limit: 100 });
        } else if (stackId) {
          response = await transactionAPI.getByStack(stackId, { limit: 100 });
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
      // Blue for adding money to stack (negative amount = money out of account),
      // Red for removing money from stack (positive amount = money back to account)
      return amount < 0 ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-red-500 to-red-600';
    }
    if (type === 'deposit') return 'bg-gradient-to-br from-green-500 to-emerald-600';
    if (type === 'withdrawal') return 'bg-gradient-to-br from-red-500 to-red-600';
    if (type === 'transfer') return 'bg-gradient-to-br from-blue-500 to-blue-600';
    return 'bg-gradient-to-br from-gray-500 to-gray-600';
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Bank Transfer': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      'Deposit': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'Withdrawal': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      'Transfer': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      'Stack Allocation': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    };
    return colors[category] || 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
  };

  const getAmountColor = (type: string, amount: number) => {
    if (type === 'allocation') {
      // Blue for adding money to stack (negative), red for removing (positive)
      return amount < 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400';
    }
    if (type === 'deposit') return 'text-green-600 dark:text-green-400';
    if (type === 'withdrawal') return 'text-red-600 dark:text-red-400';
    return 'text-gray-900 dark:text-white';
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
        <p className="text-gray-600 dark:text-gray-400">No transactions yet</p>
      </div>
    );
  }

  const itemsPerPage = isExpanded ? ITEMS_PER_PAGE_EXPANDED : ITEMS_PER_PAGE_COLLAPSED;
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedTransactions = transactions.slice(startIndex, endIndex);
  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const hasMore = transactions.length > ITEMS_PER_PAGE_COLLAPSED;

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
    setCurrentPage(0);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setOpenDropdownId(null);
  };

  const handleEditSuccess = async () => {
    // Refresh transactions
    const fetchTransactions = async () => {
      let response;
      if (accountId) {
        response = await transactionAPI.getByAccount(accountId, { limit: 100 });
      } else if (stackId) {
        response = await transactionAPI.getByStack(stackId, { limit: 100 });
      }
      if (response) {
        setTransactions(response.data);
      }
    };
    await fetchTransactions();
  };

  const handleUnmatch = async (transactionId: string) => {
    if (!confirm('Are you sure you want to unmatch this transaction? The amount will be returned to the stack.')) {
      return;
    }

    try {
      await transactionMatcherAPI.unmatch(transactionId);
      // Refresh transactions
      const fetchTransactions = async () => {
        let response;
        if (accountId) {
          response = await transactionAPI.getByAccount(accountId, { limit: 100 });
        } else if (stackId) {
          response = await transactionAPI.getByStack(stackId, { limit: 100 });
        }
        if (response) {
          setTransactions(response.data);
        }
      };
      await fetchTransactions();
      // Refresh account and stack data
      await refreshCurrentAccount();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to unmatch transaction');
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
      return;
    }

    try {
      await transactionAPI.delete(transactionId);
      // Refresh transactions
      const fetchTransactions = async () => {
        let response;
        if (accountId) {
          response = await transactionAPI.getByAccount(accountId, { limit: 100 });
        } else if (stackId) {
          response = await transactionAPI.getByStack(stackId, { limit: 100 });
        }
        if (response) {
          setTransactions(response.data);
        }
      };
      await fetchTransactions();
      // Refresh account and stack data
      await refreshCurrentAccount();
      setOpenDropdownId(null);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete transaction');
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        {title && <h3 className="text-lg font-semibold dark:text-white">{title}</h3>}
        <div className="flex-1"></div>
        {hasMore && (
          <button
            onClick={handleToggleExpand}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {isExpanded ? (
              <>
                <ChevronsUp className="w-4 h-4" />
                <span>Show Less</span>
              </>
            ) : (
              <>
                <ChevronsDown className="w-4 h-4" />
                <span>Show More</span>
              </>
            )}
          </button>
        )}
      </div>
      <div className="space-y-2">
        {displayedTransactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-200"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className={`w-11 h-11 ${getIconBgColor(transaction.type, transaction.amount)} rounded-xl flex items-center justify-center shadow-sm`}>
                {getTransactionIcon(transaction.type, transaction.amount)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white truncate">{transaction.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{format(new Date(transaction.date), 'MMM d, yyyy')}</span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{format(new Date(transaction.date), 'h:mm a')}</span>
                  {transaction.category && (
                    <>
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getCategoryColor(transaction.category)}`}>
                        {transaction.category}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className={`text-lg font-bold ${getAmountColor(transaction.type, transaction.amount)}`}>
                  {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Bal: {formatCurrency(transaction.balance)}
                </p>
              </div>
              {transaction.matchConfirmed && transaction.stackId && !transaction.isVirtual && (
                <button
                  onClick={() => handleUnmatch(transaction.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                  title="Unmatch this transaction"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {/* Three-dot menu for transaction actions */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDropdownId(openDropdownId === transaction.id ? null : transaction.id);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                  title="Transaction options"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {openDropdownId === transaction.id && (
                  <div
                    ref={dropdownRef}
                    className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {!transaction.isVirtual && transaction.type !== 'allocation' && (
                      <button
                        onClick={() => handleEditTransaction(transaction)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit Transaction</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteTransaction(transaction.id)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Transaction</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isExpanded && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage + 1} of {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages - 1}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
