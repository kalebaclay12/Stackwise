import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useAccountStore } from '../store/accountStore';
import { LogOut, Plus, Building2, Edit3, Trash2 } from 'lucide-react';
import AccountCard from '../components/AccountCard';
import StackList from '../components/StackList';
import CreateStackModal from '../components/CreateStackModal';
import CreateAccountModal from '../components/CreateAccountModal';
import EditAccountModal from '../components/EditAccountModal';
import BankLinkButton from '../components/BankLinkButton';
import LinkedBanksList from '../components/LinkedBanksList';
import TransferFromBankModal from '../components/TransferFromBankModal';
import TransactionHistory from '../components/TransactionHistory';
import { accountAPI } from '../services/api';

export default function DashboardPage() {
  const { user, logout } = useAuthStore();
  const { accounts, selectedAccount, selectAccount, fetchAccounts } = useAccountStore();
  const [showCreateStack, setShowCreateStack] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [showEditAccount, setShowEditAccount] = useState(false);
  const [showBankSection, setShowBankSection] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedLinkedBankId, setSelectedLinkedBankId] = useState<string | null>(null);
  const [linkedBanksRefresh, setLinkedBanksRefresh] = useState(0);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    if (accounts.length > 0 && !selectedAccount) {
      selectAccount(accounts[0]);
    }
  }, [accounts, selectedAccount, selectAccount]);

  const handleDeleteAccount = async () => {
    if (!selectedAccount) return;

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

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Stackwise</h1>
                <p className="text-xs text-gray-500">Modern Banking</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowBankSection(!showBankSection)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  showBankSection ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Building2 className="w-5 h-5" />
                <span className="text-sm font-medium">Linked Banks</span>
              </button>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showBankSection && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Linked Bank Accounts</h2>
              <BankLinkButton onSuccess={() => setLinkedBanksRefresh(prev => prev + 1)} />
            </div>
            <LinkedBanksList
              refreshTrigger={linkedBanksRefresh}
              onTransferClick={(linkedBankId) => {
                setSelectedLinkedBankId(linkedBankId);
                setShowTransferModal(true);
              }}
            />
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Accounts</h2>
            <button
              onClick={() => setShowCreateAccount(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Account
            </button>
          </div>

          {accounts.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-600 mb-4">No accounts yet</p>
              <button
                onClick={() => setShowCreateAccount(true)}
                className="btn-primary"
              >
                Create your first account
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  isSelected={selectedAccount?.id === account.id}
                  onClick={() => selectAccount(account)}
                />
              ))}
            </div>
          )}
        </div>

        {selectedAccount && (
          <>
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedAccount.name}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowEditAccount(true)}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit Account
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </button>
                </div>
              </div>
              <TransactionHistory
                accountId={selectedAccount.id}
                title=""
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Stacks in {selectedAccount.name}
                </h2>
                <button
                  onClick={() => setShowCreateStack(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Stack
                </button>
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
            fetchAccounts();
          }}
        />
      )}

      {showTransferModal && selectedLinkedBankId && (
        <TransferFromBankModal
          linkedBankId={selectedLinkedBankId}
          onClose={() => {
            setShowTransferModal(false);
            setSelectedLinkedBankId(null);
          }}
          onSuccess={() => {
            fetchAccounts();
          }}
        />
      )}
    </div>
  );
}
