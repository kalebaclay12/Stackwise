import { useState, useEffect } from 'react';
import { X, AlertTriangle, Building2 } from 'lucide-react';
import axios from '../services/api';

interface LinkedBank {
  id: string;
  institutionName: string;
  accountName: string | null;
  accountMask: string | null;
  accountType: string | null;
}

interface RemoveLinkedBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RemoveLinkedBankModal({ isOpen, onClose, onSuccess }: RemoveLinkedBankModalProps) {
  const [linkedBanks, setLinkedBanks] = useState<LinkedBank[]>([]);
  const [selectedBanks, setSelectedBanks] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchLinkedBanks();
      setSelectedBanks(new Set());
    }
  }, [isOpen]);

  const fetchLinkedBanks = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/plaid/linked-banks');
      setLinkedBanks(response.data);
    } catch (error) {
      console.error('Error fetching linked banks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBank = (bankId: string) => {
    const newSelected = new Set(selectedBanks);
    if (newSelected.has(bankId)) {
      newSelected.delete(bankId);
    } else {
      newSelected.add(bankId);
    }
    setSelectedBanks(newSelected);
  };

  const handleRemove = async () => {
    if (selectedBanks.size === 0) return;

    const bankNames = linkedBanks
      .filter(bank => selectedBanks.has(bank.id))
      .map(bank => bank.institutionName)
      .join(', ');

    if (!confirm(`Are you sure you want to unlink ${selectedBanks.size} bank account(s)? (${bankNames})\n\nThis will also remove all associated accounts, stacks, and transactions.`)) {
      return;
    }

    setIsRemoving(true);
    try {
      // Remove each selected bank
      await Promise.all(
        Array.from(selectedBanks).map(bankId =>
          axios.delete(`/plaid/linked-banks/${bankId}`)
        )
      );

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error removing banks:', error);
      alert('Failed to remove one or more bank accounts. Please try again.');
    } finally {
      setIsRemoving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Remove Linked Banks</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading linked banks...</p>
            </div>
          ) : linkedBanks.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600">No linked bank accounts</p>
            </div>
          ) : (
            <>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Warning:</strong> Removing a linked bank will also delete all associated accounts, stacks, and transactions. This action cannot be undone.
                </p>
              </div>

              <div className="space-y-2">
                {linkedBanks.map((bank) => (
                  <label
                    key={bank.id}
                    className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedBanks.has(bank.id)
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedBanks.has(bank.id)}
                      onChange={() => toggleBank(bank.id)}
                      className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                    />
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-sm">
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{bank.institutionName}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {bank.accountName} {bank.accountMask && `(...${bank.accountMask})`}
                        </p>
                        {bank.accountType && (
                          <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full font-medium capitalize">
                            {bank.accountType}
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {selectedBanks.size > 0 ? `${selectedBanks.size} bank(s) selected` : 'Select banks to remove'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="btn-secondary"
              disabled={isRemoving}
            >
              Cancel
            </button>
            <button
              onClick={handleRemove}
              disabled={selectedBanks.size === 0 || isRemoving}
              className="btn-primary bg-red-600 hover:bg-red-700 disabled:bg-gray-400"
            >
              {isRemoving ? 'Removing...' : `Remove ${selectedBanks.size > 0 ? `(${selectedBanks.size})` : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
