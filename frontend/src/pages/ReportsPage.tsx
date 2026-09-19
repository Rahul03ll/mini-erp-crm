import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Challan } from '../types';

export default function ReportsPage() {
  const [challans, setChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    api.getChallans({ status: 'Confirmed', limit: 50 })
      .then((res) => setChallans(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleDownloadInvoice = async (c: Challan) => {
    setDownloadingId(c.id);
    setError('');
    try {
      await api.downloadInvoice(c.id, c.challanNumber);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download invoice');
    } finally {
      setDownloadingId(null);
    }
  };

  const totalRevenue = challans.reduce((sum, c) =>
    sum + c.lineItems.reduce((s, li) => s + Number(li.unitPriceSnapshot) * li.quantity, 0), 0
  );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Reports & Invoices</h2>
      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Confirmed Challans</p>
          <p className="text-2xl font-bold">{challans.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Total Units Sold</p>
          <p className="text-2xl font-bold">{challans.reduce((s, c) => s + c.totalQuantity, 0)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold">₹{totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      {loading ? <p className="text-gray-500">Loading...</p> : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <h3 className="p-4 font-semibold border-b">Confirmed Challans (Invoice View)</h3>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3">Challan #</th>
                <th className="text-left p-3">Customer</th>
                <th className="text-right p-3">Qty</th>
                <th className="text-right p-3">Amount</th>
                <th className="text-left p-3">Date</th>
                <th className="text-right p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {challans.map((c) => {
                const amount = c.lineItems.reduce((s, li) => s + Number(li.unitPriceSnapshot) * li.quantity, 0);
                return (
                  <tr key={c.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-mono">
                      <Link to={`/challans/${c.id}`} className="text-blue-600 hover:underline font-medium">
                        {c.challanNumber}
                      </Link>
                    </td>
                    <td className="p-3">{c.customer?.name}</td>
                    <td className="p-3 text-right">{c.totalQuantity}</td>
                    <td className="p-3 text-right">₹{amount.toFixed(2)}</td>
                    <td className="p-3">{new Date(c.createdDate).toLocaleDateString()}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDownloadInvoice(c)}
                        disabled={downloadingId === c.id}
                        className="text-xs px-2.5 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded hover:bg-blue-100 disabled:opacity-50"
                      >
                        {downloadingId === c.id ? 'Downloading...' : 'PDF Invoice'}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {challans.length === 0 && (
                <tr><td colSpan={6} className="p-6 text-center text-gray-500">No confirmed challans yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

