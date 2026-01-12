import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useAccountStore } from '../store/accountStore';
import { useTheme } from '../contexts/ThemeContext';
import { LogOut, Plus, Building2, RefreshCw, Edit3, Trash2, ChevronDown, User, Sun, Moon, Settings, Scan, Upload, DollarSign } from 'lucide-react';
import AccountCard from '../components/AccountCard';
import StackList from '../components/StackList';
import CreateStackModal from '../components/CreateStackModal';
import CreateAccountModal from '../components/CreateAccountModal';
import EditAccountModal from '../components/EditAccountModal';
import BankLinkButton from '../components/BankLinkButton';
import LinkedBanksList from '../components/LinkedBanksList';
import TransactionHistory from '../components/TransactionHistory';
import PendingMatchModal from '../components/PendingMatchModal';
import NotificationBell from '../components/NotificationBell';
import ImportCSVModal from '../components/ImportCSVModal';
import CreateTransactionModal from '../components/CreateTransactionModal';
import axios from '../services/api';
import { accountAPI, transactionMatcherAPI } from '../services/api';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { accounts, selectedAccount, selectAccount, fetchAccounts, refreshCurrentAccount } = useAccountStore();
  const { theme, toggleTheme } = useTheme();
  const [showCreateStack, setShowCreateStack] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [showEditAccount, setShowEditAccount] = useState(false);
  const [showBankSection, setShowBankSection] = useState(false);
  const [linkedBanksRefresh, setLinkedBanksRefresh] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showPendingMatches, setShowPendingMatches] = useState(false);
  const [pendingMatchesCount, setPendingMatchesCount] = useState(0);
  const [showImportCSV, setShowImportCSV] = useState(false);
  const [showCreateTransaction, setShowCreateTransaction] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    if (accounts.length > 0 && !selectedAccount) {
      selectAccount(accounts[0]);
    }
  }, [accounts, selectedAccount, selectAccount]);

  // Check for pending matches when account is selected
  useEffect(() => {
    const checkPendingMatches = async () => {
      if (!selectedAccount) return;

      try {
        const response = await transactionMatcherAPI.getPendingMatches(selectedAccount.id);
        setPendingMatchesCount(response.data?.length || 0);
      } catch (error) {
        console.error('Error checking pending matches:', error);
        setPendingMatchesCount(0);
      }
    };

    checkPendingMatches();
  }, [selectedAccount]);

  const handleSyncAccount = async (linkedBankId: string) => {
    if (!selectedAccount?.linkedBankId) return;

    setIsSyncing(true);
    try {
      await axios.post(`/plaid/sync/${linkedBankId}`);
      await refreshCurrentAccount();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to sync account');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncAllBanks = async () => {
    setIsSyncing(true);
    try {
      const response = await axios.post('/plaid/sync-all');
      await fetchAccounts();
      await refreshCurrentAccount();
      setLinkedBanksRefresh(prev => prev + 1);

      // Show success message with details
      const data = response.data;
      if (data.newTransactions > 0) {
        alert(`Successfully synced ${data.synced} bank account(s)!\n${data.newTransactions} new transaction(s) imported.`);
      } else {
        alert(`Successfully synced ${data.synced} bank account(s)!`);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to sync banks');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!selectedAccount) return;

    // Don't allow deleting linked accounts
    if (selectedAccount.linkedBankId) {
      alert('Cannot delete a bank-linked account. Please unlink the bank first.');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedAccount.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      await accountAPI.delete(selectedAccount.id);
      await fetchAccounts();
      selectAccount(null);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete account');
    }
  };

  const handleViewPendingMatches = () => {
    setShowPendingMatches(true);
  };

  const handleClosePendingMatches = () => {
    setShowPendingMatches(false);
    // Refresh the count after closing
    if (selectedAccount) {
      transactionMatcherAPI.scanForMatches(selectedAccount.id).then((response) => {
        setPendingMatchesCount(response.data.suggestionsCreated || 0);
      }).catch(() => {
        setPendingMatchesCount(0);
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Stackwise</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Modern Banking</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
              </button>

              <NotificationBell />

              <div className="relative">
                <button
                  onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform ${showSettingsDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showSettingsDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowSettingsDropdown(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-20">
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                      </div>

                      <div className="py-2">
                        <button
                          onClick={() => {
                            setShowSettingsDropdown(false);
                            navigate('/settings');
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300"
                        >
                          <Settings className="w-4 h-4" />
                          <span>Settings</span>
                        </button>

                        <button
                          onClick={() => {
                            setShowSettingsDropdown(false);
                            setShowBankSection(!showBankSection);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300"
                        >
                          <Building2 className="w-4 h-4" />
                          <span>Linked Banks</span>
                        </button>

                        {selectedAccount?.linkedBankId && (
                          <button
                            onClick={() => {
                              setShowSettingsDropdown(false);
                              handleSyncAccount(selectedAccount.linkedBankId!);
                            }}
                            disabled={isSyncing}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                          >
                            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                            <span>{isSyncing ? 'Syncing...' : 'Sync Account Balance'}</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setShowSettingsDropdown(false);
                            logout();
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-red-600 dark:text-red-400"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showBankSection && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Linked Bank Accounts</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleSyncAllBanks}
                  disabled={isSyncing}
                  className="btn-secondary flex items-center gap-2"
                  title="Sync all linked bank accounts"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Sync All Banks'}
                </button>
                <BankLinkButton onSuccess={() => {
                  setLinkedBanksRefresh(prev => prev + 1);
                  refreshCurrentAccount();
                }} />
              </div>
            </div>
            <LinkedBanksList
              refreshTrigger={linkedBanksRefresh}
            />
          </div>
        )}

        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Accounts</h2>
            <div className="flex flex-wrap gap-2">
              {selectedAccount?.linkedBankId ? (
                <button
                  onClick={() => handleSyncAccount(selectedAccount.linkedBankId!)}
                  disabled={isSyncing}
                  className="btn-primary flex items-center gap-2 text-sm sm:text-base"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync Balance'}</span>
                  <span className="sm:hidden">Sync</span>
                </button>
              ) : selectedAccount && !selectedAccount.linkedBankId ? (
                <>
                  {/* Hide Edit/Delete buttons on mobile since they're in the card dropdown */}
                  <button
                    onClick={() => setShowEditAccount(true)}
                    className="hidden md:flex btn-secondary items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="hidden md:flex px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </>
              ) : null}
              <button
                onClick={() => setShowCreateAccount(true)}
                className="btn-secondary flex items-center gap-2 text-sm sm:text-base whitespace-nowrap"
                title="Create a local test account"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Local Account</span>
                <span className="sm:hidden">Add Account</span>
              </button>
            </div>
          </div>

          {accounts.length === 0 ? (
            <div className="card text-center py-12">
              <Building2 className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-600 dark:text-gray-300 mb-2 font-semibold">No accounts yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Link a bank account or create a local test account to get started.</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowBankSection(true)}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Building2 className="w-4 h-4" />
                  Link Bank Account
                </button>
                <button
                  onClick={() => setShowCreateAccount(true)}
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Local Account
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  isSelected={selectedAccount?.id === account.id}
                  onClick={() => selectAccount(account)}
                  onEdit={!account.linkedBankId ? () => {
                    selectAccount(account);
                    setShowEditAccount(true);
                  } : undefined}
                  onDelete={!account.linkedBankId ? () => {
                    selectAccount(account);
                    handleDeleteAccount();
                  } : undefined}
                />
              ))}
            </div>
          )}
        </div>

        {selectedAccount && (
          <>
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Transactions
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Transaction history for {selectedAccount.name}
                  </p>
                </div>
                {!selectedAccount.linkedBankId && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setShowCreateTransaction(true)}
                      className="btn-primary flex items-center gap-2 text-sm sm:text-base"
                      title="Add a transaction manually"
                    >
                      <DollarSign className="w-4 h-4" />
                      <span className="hidden sm:inline">Add Transaction</span>
                      <span className="sm:hidden">Add</span>
                    </button>
                    <button
                      onClick={() => setShowImportCSV(true)}
                      className="btn-secondary flex items-center gap-2 text-sm sm:text-base"
                      title="Import transactions from CSV"
                    >
                      <Upload className="w-4 h-4" />
                      <span className="hidden sm:inline">Import CSV</span>
                      <span className="sm:hidden">Import</span>
                    </button>
                  </div>
                )}
              </div>
              <TransactionHistory
                accountId={selectedAccount.id}
                title=""
              />
            </div>

            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  Stacks in {selectedAccount.name}
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  {pendingMatchesCount > 0 && (
                    <button
                      onClick={handleViewPendingMatches}
                      className="btn-secondary flex items-center gap-2 relative text-sm sm:text-base"
                      title={`Review ${pendingMatchesCount} pending transaction match${pendingMatchesCount !== 1 ? 'es' : ''}`}
                    >
                      <Scan className="w-4 h-4" />
                      <span className="hidden sm:inline">Review Matches</span>
                      <span className="sm:hidden">Matches</span>
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg animate-pulse">
                        {pendingMatchesCount}
                      </span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowCreateStack(true)}
                    className="btn-primary flex items-center gap-2 text-sm sm:text-base whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Create Stack</span>
                    <span className="sm:hidden">Create</span>
                  </button>
                </div>
              </div>
              <StackList accountId={selectedAccount.id} />
            </div>
          </>
        )}
      </main>

      {showCreateStack && selectedAccount && (
        <CreateStackModal
          accountId={selectedAccount.id}
          onClose={() => setShowCreateStack(false)}
        />
      )}

      {showCreateAccount && (
        <CreateAccountModal onClose={() => setShowCreateAccount(false)} />
      )}

      {showEditAccount && selectedAccount && (
        <EditAccountModal
          account={selectedAccount}
          onClose={() => setShowEditAccount(false)}
          onSuccess={() => {
            refreshCurrentAccount();
          }}
        />
      )}

      {showPendingMatches && selectedAccount && (
        <PendingMatchModal
          accountId={selectedAccount.id}
          onClose={handleClosePendingMatches}
          onMatchesProcessed={() => {
            refreshCurrentAccount();
          }}
        />
      )}

      {showImportCSV && selectedAccount && (
        <ImportCSVModal
          accountId={selectedAccount.id}
          isOpen={showImportCSV}
          onClose={() => {
            setShowImportCSV(false);
            refreshCurrentAccount();
          }}
        />
      )}

      {showCreateTransaction && selectedAccount && (
        <CreateTransactionModal
          accountId={selectedAccount.id}
          onClose={() => {
            setShowCreateTransaction(false);
          }}
        />
      )}
    </div>
  );
}
