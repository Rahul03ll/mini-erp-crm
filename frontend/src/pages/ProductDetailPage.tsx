import { useState, useEffect, FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { Product, StockMovement } from '../types';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [editing, setEditing] = useState(false);
  const [showMovement, setShowMovement] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [movement, setMovement] = useState({ quantityChanged: '', movementType: 'IN', reason: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!id) return;
    try {
      const [prod, mov] = await Promise.all([api.getProduct(id), api.getStockMovements(id)]);
      setProduct(prod);
      setMovements(mov.data);
      setForm({
        name: prod.name, sku: prod.sku, category: prod.category || '',
        unitPrice: String(prod.unitPrice), minStockAlert: String(prod.minStockAlert),
        location: prod.location || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await api.updateProduct(id, {
        name: form.name, sku: form.sku, category: form.category || undefined,
        unitPrice: parseFloat(form.unitPrice), minStockAlert: parseInt(form.minStockAlert, 10),
        location: form.location || undefined,
      });
      setEditing(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const handleMovement = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await api.addStockMovement(id, {
        quantityChanged: parseInt(movement.quantityChanged, 10),
        movementType: movement.movementType,
        reason: movement.reason,
      });
      setMovement({ quantityChanged: '', movementType: 'IN', reason: '' });
      setShowMovement(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Stock movement failed');
    }
  };

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (!product) return <p className="text-red-600">Product not found</p>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/products" className="text-blue-600 text-sm hover:underline">&larr; Back</Link>
        <h2 className="text-2xl font-bold">{product.name}</h2>
        <span className="font-mono text-sm text-gray-500">{product.sku}</span>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">{error}</div>}

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex justify-between mb-4">
          <h3 className="font-semibold">Product Details</h3>
          <div className="flex gap-2">
            <button onClick={() => setShowMovement(!showMovement)} className="text-sm px-3 py-1 bg-green-600 text-white rounded">
              Stock Movement
            </button>
            <button onClick={() => setEditing(!editing)} className="text-sm text-blue-600 hover:underline">
              {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>
        </div>

        {editing ? (
          <form onSubmit={handleUpdate} className="grid grid-cols-2 gap-3">
            {['name', 'sku', 'category', 'unitPrice', 'minStockAlert', 'location'].map((key) => (
              <div key={key}>
                <label className="block text-sm font-medium mb-1 capitalize">{key}</label>
                <input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full px-3 py-2 border rounded text-sm" />
              </div>
            ))}
            <div className="col-span-2">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded text-sm">Save</button>
            </div>
          </form>
        ) : (
          <dl className="grid grid-cols-3 gap-3 text-sm">
            <div><dt className="text-gray-500">Price</dt><dd>₹{Number(product.unitPrice).toFixed(2)}</dd></div>
            <div><dt className="text-gray-500">Stock</dt><dd className={product.currentStock <= product.minStockAlert ? 'text-red-600 font-bold' : 'font-bold'}>{product.currentStock}</dd></div>
            <div><dt className="text-gray-500">Min Alert</dt><dd>{product.minStockAlert}</dd></div>
            <div><dt className="text-gray-500">Category</dt><dd>{product.category || '—'}</dd></div>
            <div><dt className="text-gray-500">Location</dt><dd>{product.location || '—'}</dd></div>
          </dl>
        )}

        {showMovement && (
          <form onSubmit={handleMovement} className="mt-4 p-4 bg-gray-50 rounded space-y-3">
            <h4 className="font-medium text-sm">Record Stock Movement</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs mb-1">Type</label>
                <select value={movement.movementType} onChange={(e) => setMovement({ ...movement, movementType: e.target.value })}
                  className="w-full px-2 py-1 border rounded text-sm">
                  <option value="IN">IN</option><option value="OUT">OUT</option>
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1">Quantity</label>
                <input type="number" min="1" value={movement.quantityChanged}
                  onChange={(e) => setMovement({ ...movement, quantityChanged: e.target.value })}
                  className="w-full px-2 py-1 border rounded text-sm" required />
              </div>
              <div>
                <label className="block text-xs mb-1">Reason</label>
                <input value={movement.reason} onChange={(e) => setMovement({ ...movement, reason: e.target.value })}
                  className="w-full px-2 py-1 border rounded text-sm" required />
              </div>
            </div>
            <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Record</button>
          </form>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="font-semibold mb-4">Stock Movement Log</h3>
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr>
              <th className="text-left p-2">Date</th>
              <th className="text-left p-2">Type</th>
              <th className="text-right p-2">Qty</th>
              <th className="text-left p-2">Reason</th>
              <th className="text-left p-2">By</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((m) => (
              <tr key={m.id} className="border-b">
                <td className="p-2">{new Date(m.createdAt).toLocaleString()}</td>
                <td className="p-2"><span className={m.movementType === 'IN' ? 'text-green-600' : 'text-red-600'}>{m.movementType}</span></td>
                <td className="p-2 text-right">{m.quantityChanged}</td>
                <td className="p-2">{m.reason}</td>
                <td className="p-2">{m.user?.name || '—'}</td>
              </tr>
            ))}
            {movements.length === 0 && (
              <tr><td colSpan={5} className="p-4 text-center text-gray-500">No movements recorded</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
