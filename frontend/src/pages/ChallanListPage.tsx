import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Challan } from '../types';

export default function ChallanListPage() {
  const [challans, setChallans] = useState<Challan[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getChallans({ status: statusFilter || undefined, page, limit: 10 });
      setChallans(res.data);
      setTotalPages(res.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load challans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter, page]);

  const statusColor = (s: string) =>
    s === 'Confirmed' ? 'bg-green-100 text-green-800' :
    s === 'Draft' ? 'bg-yellow-100 text-yellow-800' :
    'bg-gray-100 text-gray-600';

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Sales Challans</h2>
        <Link to="/challans/new" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
          Create Challan
        </Link>
      </div>

      <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        className="mb-4 px-3 py-2 border rounded text-sm">
        <option value="">All Statuses</option>
        <option value="Draft">Draft</option>
        <option value="Confirmed">Confirmed</option>
        <option value="Cancelled">Cancelled</option>
      </select>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">{error}</div>}

      {loading ? <p className="text-gray-500">Loading...</p> : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3">Challan #</th>
                <th className="text-left p-3">Customer</th>
                <th className="text-right p-3">Qty</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Date</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {challans.map((c) => (
                <tr key={c.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono">{c.challanNumber}</td>
                  <td className="p-3">{c.customer?.name || '—'}</td>
                  <td className="p-3 text-right">{c.totalQuantity}</td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs ${statusColor(c.status)}`}>{c.status}</span></td>
                  <td className="p-3">{new Date(c.createdDate).toLocaleDateString()}</td>
                  <td className="p-3">
                    <Link to={`/challans/${c.id}`} className="text-blue-600 hover:underline">View</Link>
                  </td>
                </tr>
              ))}
              {challans.length === 0 && (
                <tr><td colSpan={6} className="p-6 text-center text-gray-500">No challans found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex gap-2 mt-4">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
          <span className="px-3 py-1 text-sm">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  );
}
