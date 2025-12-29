import { useEffect } from 'react';
import { useAccountStore } from '../store/accountStore';
import StackCard from './StackCard';
import { Layers } from 'lucide-react';

interface StackListProps {
  accountId: string;
}

export default function StackList({ accountId }: StackListProps) {
  const { stacks, fetchStacks } = useAccountStore();
  const accountStacks = stacks[accountId] || [];

  useEffect(() => {
    fetchStacks(accountId);
  }, [accountId, fetchStacks]);

  if (accountStacks.length === 0) {
    return (
      <div className="card text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <Layers className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No stacks yet</h3>
        <p className="text-gray-600 mb-4">
          Create your first stack to organize your money
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {accountStacks
        .sort((a, b) => a.priority - b.priority)
        .map((stack) => (
          <StackCard key={stack.id} stack={stack} />
        ))}
    </div>
  );
}
