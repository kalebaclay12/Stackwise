import { useEffect, useState } from 'react';
import { Building2, Trash2, ArrowDownCircle } from 'lucide-react';
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
  onTransferClick?: (linkedBankId: string) => void;
}

export default function LinkedBanksList({ onTransferClick }: LinkedBanksListProps) {
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
  }, []);

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
        <p className="text-sm text-gray-500 mt-1">Link a bank account to transfer funds</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {linkedBanks.map((bank) => (
        <div key={bank.id} className="card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{bank.institutionName}</h3>
              <p className="text-sm text-gray-600">
                {bank.accountName} {bank.accountMask && `(...${bank.accountMask})`}
              </p>
              {bank.accountType && (
                <p className="text-xs text-gray-500 capitalize">{bank.accountType}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onTransferClick && (
              <button
                onClick={() => onTransferClick(bank.id)}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <ArrowDownCircle className="w-4 h-4" />
                Transfer
              </button>
            )}
            <button
              onClick={() => handleUnlink(bank.id, bank.institutionName)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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
