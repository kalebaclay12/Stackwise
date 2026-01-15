import { useState } from 'react';
import { Database, Download, Trash2, AlertCircle, CheckCircle2, FileText, FileSpreadsheet, Link2, ExternalLink, AlertTriangle } from 'lucide-react';
import axios from '../../services/api';
import { format } from 'date-fns';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

interface LinkedBank {
  id: string;
  institutionName: string;
  lastSync: string;
  accountCount: number;
}

export default function DataPrivacySettings() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  // Export state
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  const [exportDateRange, setExportDateRange] = useState<'all' | '1month' | '3months' | '6months' | '1year'>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Linked banks state
  const [linkedBanks, setLinkedBanks] = useState<LinkedBank[]>([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState(true);
  const [unlinkingBankId, setUnlinkingBankId] = useState<string | null>(null);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch linked banks on mount
  useState(() => {
    fetchLinkedBanks();
  });

  const fetchLinkedBanks = async () => {
    try {
      const response = await axios.get('/plaid/linked-banks');
      setLinkedBanks(response.data);
    } catch (error) {
      console.error('Failed to fetch linked banks:', error);
      // Empty array is fine - user may not have any linked banks
    } finally {
      setIsLoadingBanks(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportMessage(null);

    try {
      const response = await axios.get('/user/export-data', {
        params: { format: exportFormat, dateRange: exportDateRange },
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `stackwise-export-${format(new Date(), 'yyyy-MM-dd')}.${exportFormat}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      setExportMessage({ type: 'success', text: 'Your data has been exported successfully!' });
    } catch (error: any) {
      setExportMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to export data. Please try again.'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleUnlinkBank = async (bankId: string) => {
    if (!confirm('Are you sure you want to unlink this bank? You can re-link it anytime.')) {
      return;
    }

    setUnlinkingBankId(bankId);
    try {
      await axios.delete(`/plaid/linked-banks/${bankId}`);
      setLinkedBanks(linkedBanks.filter(b => b.id !== bankId));
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to unlink bank');
    } finally {
      setUnlinkingBankId(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      return;
    }

    setIsDeleting(true);
    try {
      await axios.delete('/user/account');
      logout();
      navigate('/login');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete account. Please contact support.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
            <Database className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Data & Privacy</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage your data and connected services</p>
          </div>
        </div>

        {/* Export Data Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Download className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Export Your Data
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Download a copy of your transactions, stacks, and account data.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Export Format
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setExportFormat('csv')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all ${
                    exportFormat === 'csv'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  <span className="font-medium">CSV</span>
                </button>
                <button
                  onClick={() => setExportFormat('pdf')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all ${
                    exportFormat === 'pdf'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  <span className="font-medium">PDF</span>
                </button>
              </div>
            </div>

            {/* Date Range Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Range
              </label>
              <select
                value={exportDateRange}
                onChange={(e) => setExportDateRange(e.target.value as any)}
                className="input w-full"
              >
                <option value="all">All Time</option>
                <option value="1month">Last Month</option>
                <option value="3months">Last 3 Months</option>
                <option value="6months">Last 6 Months</option>
                <option value="1year">Last Year</option>
              </select>
            </div>
          </div>

          {exportMessage && (
            <div className={`mb-4 flex items-center gap-2 p-3 rounded-lg ${
              exportMessage.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
            }`}>
              {exportMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <p className="text-sm">{exportMessage.text}</p>
            </div>
          )}

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="btn-primary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Preparing Export...' : 'Download Data'}
          </button>
        </div>

        {/* Connected Banks Section */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Connected Banks
              </h3>
            </div>
          </div>

          {isLoadingBanks ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : linkedBanks.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <Link2 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">No banks connected</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Link a bank from your dashboard to automatically import transactions
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {linkedBanks.map((bank) => (
                <div
                  key={bank.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white dark:bg-gray-700 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-600">
                      <span className="text-lg font-bold text-gray-700 dark:text-gray-300">
                        {bank.institutionName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {bank.institutionName}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>{bank.accountCount} account{bank.accountCount !== 1 ? 's' : ''}</span>
                        <span>•</span>
                        <span>Last sync: {format(new Date(bank.lastSync), 'MMM d, h:mm a')}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnlinkBank(bank.id)}
                    disabled={unlinkingBankId === bank.id}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Unlink bank"
                  >
                    {unlinkingBankId === bank.id ? (
                      <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ExternalLink className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            Connected banks are used to automatically import your transactions. Your bank credentials are never stored on our servers.
          </p>
        </div>
      </div>

      {/* Danger Zone Card */}
      <div className="card border-red-200 dark:border-red-900/50">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">
            Danger Zone
          </h3>
        </div>

        <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-900/50">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                Delete Account
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors flex-shrink-0"
            >
              Delete Account
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Account</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">This cannot be undone</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                  Are you sure you want to delete your account? This will permanently remove:
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">•</span>
                    All your stacks and savings progress
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">•</span>
                    Your transaction history
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">•</span>
                    Connected bank accounts
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">•</span>
                    All settings and preferences
                  </li>
                </ul>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type <span className="font-bold text-red-600">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="input w-full"
                  placeholder="DELETE"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Forever
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Privacy Info Card */}
      <div className="card bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
        <div className="flex gap-3">
          <Database className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Your Privacy Matters</h3>
            <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                Your data is encrypted at rest and in transit
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                We never sell your personal information to third parties
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                Bank credentials are handled securely by Plaid and never stored on our servers
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                You can export or delete your data at any time
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
