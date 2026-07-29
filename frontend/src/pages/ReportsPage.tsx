import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Challan } from '../types';

export default function ReportsPage() {
  const [challans, setChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getChallans({ status: 'Confirmed', limit: 50 })
      .then((res) => setChallans(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

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
              </tr>
            </thead>
            <tbody>
              {challans.map((c) => {
                const amount = c.lineItems.reduce((s, li) => s + Number(li.unitPriceSnapshot) * li.quantity, 0);
                return (
                  <tr key={c.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-mono">{c.challanNumber}</td>
                    <td className="p-3">{c.customer?.name}</td>
                    <td className="p-3 text-right">{c.totalQuantity}</td>
                    <td className="p-3 text-right">₹{amount.toFixed(2)}</td>
                    <td className="p-3">{new Date(c.createdDate).toLocaleDateString()}</td>
                  </tr>
                );
              })}
              {challans.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-gray-500">No confirmed challans yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
