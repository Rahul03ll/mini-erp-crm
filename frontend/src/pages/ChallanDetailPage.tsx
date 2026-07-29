import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { Challan } from '../types';

export default function ChallanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [challan, setChallan] = useState<Challan | null>(null);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!id) return;
    try {
      const data = await api.getChallan(id);
      setChallan(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load challan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleConfirm = async () => {
    if (!id || !confirm('Confirm this challan? Stock will be deducted.')) return;
    setActionLoading('confirm');
    setError('');
    try {
      await api.confirmChallan(id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Confirm failed');
    } finally {
      setActionLoading('');
    }
  };

  const handleCancel = async () => {
    if (!id || !confirm('Cancel this challan?')) return;
    setActionLoading('cancel');
    setError('');
    try {
      await api.cancelChallan(id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cancel failed');
    } finally {
      setActionLoading('');
    }
  };

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (!challan) return <p className="text-red-600">Challan not found</p>;

  const totalAmount = challan.lineItems.reduce(
    (sum, li) => sum + Number(li.unitPriceSnapshot) * li.quantity, 0
  );

  const statusColor = challan.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
    challan.status === 'Draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600';

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/challans" className="text-blue-600 text-sm hover:underline">&larr; Back</Link>
        <h2 className="text-2xl font-bold font-mono">{challan.challanNumber}</h2>
        <span className={`px-2 py-0.5 rounded text-xs ${statusColor}`}>{challan.status}</span>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">{error}</div>}

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <dl className="grid grid-cols-2 gap-3 text-sm mb-6">
          <div><dt className="text-gray-500">Customer</dt><dd className="font-medium">{challan.customer?.name}</dd></div>
          <div><dt className="text-gray-500">Business</dt><dd>{challan.customer?.businessName || '—'}</dd></div>
          <div><dt className="text-gray-500">Created By</dt><dd>{challan.creator?.name || '—'}</dd></div>
          <div><dt className="text-gray-500">Date</dt><dd>{new Date(challan.createdDate).toLocaleString()}</dd></div>
        </dl>

        <table className="w-full text-sm border rounded mb-4">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">Product</th>
              <th className="text-left p-2">SKU</th>
              <th className="text-right p-2">Price</th>
              <th className="text-right p-2">Qty</th>
              <th className="text-right p-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {challan.lineItems.map((li) => (
              <tr key={li.id} className="border-t">
                <td className="p-2">{li.productNameSnapshot}</td>
                <td className="p-2 font-mono text-xs">{li.skuSnapshot}</td>
                <td className="p-2 text-right">₹{Number(li.unitPriceSnapshot).toFixed(2)}</td>
                <td className="p-2 text-right">{li.quantity}</td>
                <td className="p-2 text-right">₹{(Number(li.unitPriceSnapshot) * li.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t bg-gray-50">
            <tr>
              <td colSpan={3} className="p-2 font-medium">Total</td>
              <td className="p-2 text-right font-medium">{challan.totalQuantity}</td>
              <td className="p-2 text-right font-medium">₹{totalAmount.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        {challan.status === 'Draft' && (
          <div className="flex gap-3">
            <button onClick={handleConfirm} disabled={!!actionLoading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm">
              {actionLoading === 'confirm' ? 'Confirming...' : 'Confirm Challan'}
            </button>
            <button onClick={handleCancel} disabled={!!actionLoading}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-sm">
              {actionLoading === 'cancel' ? 'Cancelling...' : 'Cancel Challan'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
