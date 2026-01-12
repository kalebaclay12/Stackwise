import { useEffect, useState } from 'react';
import { Building2, Trash2 } from 'lucide-react';
import axios from '../services/api';

interface LinkedBank {
  id: string;
  institutionName: string;
  accountName: string | null;
  accountMask: string | null;
  accountType: string | null;
  isActive: boolean;
  createdAt: string;
}

interface LinkedBanksListProps {
  refreshTrigger?: number;
}

export default function LinkedBanksList({ refreshTrigger }: LinkedBanksListProps) {
  const [linkedBanks, setLinkedBanks] = useState<LinkedBank[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    fetchLinkedBanks();
  }, [refreshTrigger]);

  const handleUnlink = async (id: string, institutionName: string) => {
    if (!confirm(`Are you sure you want to unlink ${institutionName}?`)) return;

    try {
      await axios.delete(`/plaid/linked-banks/${id}`);
      fetchLinkedBanks();
    } catch (error) {
      console.error('Error unlinking bank:', error);
    }
  };

  if (isLoading) {
    return <div className="card"><p className="text-gray-500">Loading linked banks...</p></div>;
  }

  if (linkedBanks.length === 0) {
    return (
      <div className="card text-center py-8">
        <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-3" />
        <p className="text-gray-600">No linked bank accounts</p>
        <p className="text-sm text-gray-500 mt-1">Link a bank account to view balances and transactions</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {linkedBanks.map((bank) => (
        <div key={bank.id} className="bg-white border border-gray-100 rounded-xl p-5 flex items-center justify-between hover:shadow-md hover:border-gray-200 transition-all duration-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-sm">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{bank.institutionName}</h3>
              <p className="text-sm text-gray-600">
                {bank.accountName} {bank.accountMask && `(...${bank.accountMask})`}
              </p>
              {bank.accountType && (
                <span className="inline-block mt-1 text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full font-medium capitalize">
                  {bank.accountType}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleUnlink(bank.id, bank.institutionName)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
              title="Unlink bank"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
