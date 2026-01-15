import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import axios from '../../services/api';
import { format, parseISO } from 'date-fns';

interface Account {
  id: string;
  name: string;
  color: string | null;
}

interface HistoryEntry {
  accountId: string;
  balance: number;
  date: string;
}

interface ChartDataPoint {
  date: string;
  dateLabel: string;
  [key: string]: string | number; // Dynamic account balances
}

// Default colors for accounts without custom colors
const DEFAULT_COLORS = [
  '#6366f1', // indigo
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
];

export default function BalanceHistoryChart() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [months, setMonths] = useState(6);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBalanceHistory();
  }, [months]);

  const fetchBalanceHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/accounts/balance-history?months=${months}`);
      const { accounts: accts, history } = response.data;

      setAccounts(accts);

      // Group history by date and format for chart
      const dataByDate = new Map<string, ChartDataPoint>();

      history.forEach((entry: HistoryEntry) => {
        const dateKey = format(parseISO(entry.date), 'yyyy-MM-dd');
        const dateLabel = format(parseISO(entry.date), 'MMM d');

        if (!dataByDate.has(dateKey)) {
          dataByDate.set(dateKey, { date: dateKey, dateLabel });
        }

        const point = dataByDate.get(dateKey)!;
        point[entry.accountId] = entry.balance;
      });

      // Sort by date and convert to array
      const sortedData = Array.from(dataByDate.values()).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      setChartData(sortedData);
    } catch (err: any) {
      console.error('Failed to fetch balance history:', err);
      setError('Failed to load balance history');
    } finally {
      setIsLoading(false);
    }
  };

  const getAccountColor = (account: Account, index: number): string => {
    if (account.color) {
      // Map color names to hex
      const colorMap: Record<string, string> = {
        'blue': '#3b82f6',
        'green': '#22c55e',
        'purple': '#a855f7',
        'red': '#ef4444',
        'orange': '#f97316',
        'yellow': '#eab308',
        'pink': '#ec4899',
        'indigo': '#6366f1',
        'teal': '#14b8a6',
        'cyan': '#06b6d4',
      };
      return colorMap[account.color.toLowerCase()] || account.color;
    }
    return DEFAULT_COLORS[index % DEFAULT_COLORS.length];
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <p className="text-red-500 dark:text-red-400">{error}</p>
          <button
            onClick={fetchBalanceHistory}
            className="mt-4 btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Balance History</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Track your account balances over time</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <select
            value={months}
            onChange={(e) => setMonths(parseInt(e.target.value))}
            className="input py-1 px-2 text-sm"
          >
            <option value={3}>3 months</option>
            <option value={6}>6 months</option>
            <option value={12}>12 months</option>
          </select>
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-12">
          <TrendingUp className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No accounts found</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Create an account to start tracking your balance history
          </p>
        </div>
      ) : chartData.length <= 1 ? (
        <div className="text-center py-12">
          <TrendingUp className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Not enough data yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Balance history will build up over time as daily snapshots are recorded
          </p>
        </div>
      ) : (
        <>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fontSize: 12 }}
                  className="text-gray-500 dark:text-gray-400"
                />
                <YAxis
                  tickFormatter={(value) => formatCurrency(value)}
                  tick={{ fontSize: 12 }}
                  className="text-gray-500 dark:text-gray-400"
                  width={80}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => `Date: ${label}`}
                  contentStyle={{
                    backgroundColor: 'var(--tooltip-bg, #fff)',
                    borderColor: 'var(--tooltip-border, #e5e7eb)',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                {accounts.map((account, index) => (
                  <Line
                    key={account.id}
                    type="monotone"
                    dataKey={account.id}
                    name={account.name}
                    stroke={getAccountColor(account, index)}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Legend with current balances */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Current Balances</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {accounts.map((account, index) => {
                const latestBalance = chartData.length > 0
                  ? (chartData[chartData.length - 1][account.id] as number) || 0
                  : 0;
                return (
                  <div
                    key={account.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getAccountColor(account, index) }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {account.name}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(latestBalance)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
