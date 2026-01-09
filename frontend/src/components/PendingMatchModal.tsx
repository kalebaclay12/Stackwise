import { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, AlertCircle, TrendingDown } from 'lucide-react';
import { Transaction, Stack } from '../types';
import { transactionMatcherAPI } from '../services/api';
import { useAccountStore } from '../store/accountStore';

interface PendingMatch {
  transaction: Transaction;
  suggestedStack: Stack | null;
}

interface PendingMatchModalProps {
  accountId: string;
  onClose: () => void;
  onMatchesProcessed?: () => void;
}

export default function PendingMatchModal({ accountId, onClose, onMatchesProcessed }: PendingMatchModalProps) {
  const [pendingMatches, setPendingMatches] = useState<PendingMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const { refreshCurrentAccount } = useAccountStore();

  useEffect(() => {
    loadPendingMatches();
  }, [accountId]);

  const loadPendingMatches = async () => {
    try {
      setLoading(true);
      const response = await transactionMatcherAPI.getPendingMatches(accountId);
      setPendingMatches(response.data);
    } catch (error) {
      console.error('Failed to load pending matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (transactionId: string) => {
    try {
      setProcessing(transactionId);
      await transactionMatcherAPI.confirmMatch(transactionId);
      setPendingMatches(prev => prev.filter(m => m.transaction.id !== transactionId));
      await refreshCurrentAccount();
      onMatchesProcessed?.();
    } catch (error) {
      console.error('Failed to confirm match:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (transactionId: string) => {
    try {
      setProcessing(transactionId);
      await transactionMatcherAPI.rejectMatch(transactionId);
      setPendingMatches(prev => prev.filter(m => m.transaction.id !== transactionId));
    } catch (error) {
      console.error('Failed to reject match:', error);
    } finally {
      setProcessing(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getConfidenceColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 0.8) return 'text-green-600 dark:text-green-400';
    if (score >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-orange-600 dark:text-orange-400';
  };

  const getConfidenceLabel = (score?: number) => {
    if (!score) return 'Unknown';
    if (score >= 0.8) return 'High';
    if (score >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full shadow-2xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Transaction Matches</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Review and confirm suggested stack matches for your transactions
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-4">Loading pending matches...</p>
            </div>
          ) : pendingMatches.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">All caught up!</h3>
              <p className="text-gray-600 dark:text-gray-400">
                No pending transaction matches at the moment
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {pendingMatches.map(({ transaction, suggestedStack }) => (
                <div
                  key={transaction.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Transaction Details */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                          <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white truncate">
                            {transaction.description}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(transaction.date)} • {formatCurrency(transaction.amount)}
                          </p>
                        </div>
                      </div>

                      {/* Suggested Stack Match */}
                      {suggestedStack && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: suggestedStack.color + '20' }}
                            >
                              <span className="text-lg">{suggestedStack.icon}</span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                <p className="font-medium text-gray-900 dark:text-white text-sm">
                                  Suggested Match
                                </p>
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                {suggestedStack.name}
                              </p>
                              {transaction.matchConfidenceScore && (
                                <p className={`text-xs mt-1 font-medium ${getConfidenceColor(transaction.matchConfidenceScore)}`}>
                                  {getConfidenceLabel(transaction.matchConfidenceScore)} confidence ({(transaction.matchConfidenceScore * 100).toFixed(0)}%)
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleConfirm(transaction.id)}
                        disabled={processing === transaction.id}
                        className="p-2 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Confirm match"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleReject(transaction.id)}
                        disabled={processing === transaction.id}
                        className="p-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Reject match"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && pendingMatches.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Review each match carefully. Confirming will deduct the amount from the stack.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
