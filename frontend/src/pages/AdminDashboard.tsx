import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { fetchAdminTransactions, fetchAdminUsers, reverseTransaction } from '../api';
import type { AdminTransaction, User } from '../types';

const STATUS_OPTIONS = ['', 'PENDING', 'POSTED', 'REVERSED'] as const;

function StatusBadge({ status }: { status: AdminTransaction['status'] }) {
  const styles = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    POSTED: 'bg-green-100 text-green-800',
    REVERSED: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}

export function AdminDashboard() {
  const { user, logout } = useAuth();
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [customers, setCustomers] = useState<Pick<User, 'id' | 'full_name' | 'email'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reversing, setReversing] = useState<string | null>(null);
  const [reverseError, setReverseError] = useState('');

  const [status, setStatus] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    fetchAdminTransactions({
      status: status || undefined,
      customer_id: customerId || undefined,
      from: from || undefined,
      to: to || undefined,
    })
      .then(data => { if (!cancelled) setTransactions(data); })
      .catch(() => { if (!cancelled) setError('Failed to load transactions.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [status, customerId, from, to]);

  useEffect(() => {
    fetchAdminUsers().then(setCustomers).catch(() => {});
  }, []);

  async function handleReverse(id: string) {
    if (!confirm('Reverse this transaction? This cannot be undone.')) return;
    setReversing(id);
    setReverseError('');
    try {
      const updated = await reverseTransaction(id);
      setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, ...updated } : tx));
    } catch (err) {
      setReverseError(err instanceof Error ? err.message : 'Failed to reverse');
    } finally {
      setReversing(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <span className="font-semibold text-gray-900">CardApp</span>
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:block">{user?.full_name}</span>
            <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">All Transactions</h2>
            <p className="text-sm text-gray-500 mt-0.5">{transactions.length} result{transactions.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Status pills */}
            <div className="flex gap-2 flex-wrap">
              {STATUS_OPTIONS.map(s => (
                <button
                  key={s || 'all'}
                  onClick={() => setStatus(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    status === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s || 'All'}
                </button>
              ))}
            </div>

            {/* Customer dropdown */}
            <select
              value={customerId}
              onChange={e => setCustomerId(e.target.value)}
              className="sm:ml-auto px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">All customers</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.full_name}</option>
              ))}
            </select>
          </div>

          {/* Date range */}
          <div className="flex gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-gray-500 whitespace-nowrap">From</label>
              <input
                type="date"
                value={from}
                onChange={e => setFrom(e.target.value)}
                className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-gray-500 whitespace-nowrap">To</label>
              <input
                type="date"
                value={to}
                onChange={e => setTo(e.target.value)}
                className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {(from || to) && (
              <button onClick={() => { setFrom(''); setTo(''); }} className="text-xs text-gray-400 hover:text-gray-700 underline">
                Clear
              </button>
            )}
          </div>
        </div>

        {reverseError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
            {reverseError}
          </p>
        )}

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Loading…</div>
          ) : error ? (
            <div className="flex items-center justify-center py-16 text-red-500 text-sm">{error}</div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-sm gap-2">
              <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              No transactions found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Date</th>
                    <th className="text-left px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Customer</th>
                    <th className="text-left px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Merchant</th>
                    <th className="text-right px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Amount</th>
                    <th className="text-left px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 sm:px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 sm:px-6 py-4 text-gray-500 whitespace-nowrap">
                        {new Date(tx.transaction_date).toLocaleDateString('en-CA')}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-gray-600">{tx.customer_name}</td>
                      <td className="px-4 sm:px-6 py-4 text-gray-900 font-medium">{tx.merchant}</td>
                      <td className="px-4 sm:px-6 py-4 text-right text-gray-900 font-mono whitespace-nowrap">
                        ${tx.amount.toFixed(2)}
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <StatusBadge status={tx.status} />
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right">
                        {tx.status === 'POSTED' && (
                          <button
                            onClick={() => handleReverse(tx.id)}
                            disabled={reversing === tx.id}
                            className="text-xs text-red-600 hover:text-red-800 font-medium disabled:opacity-50 transition-colors"
                          >
                            {reversing === tx.id ? 'Reversing…' : 'Reverse'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
