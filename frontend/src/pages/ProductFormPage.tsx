import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function ProductFormPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', sku: '', category: '', unitPrice: '', minStockAlert: '10', location: '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const product = await api.createProduct({
        name: form.name,
        sku: form.sku,
        category: form.category || undefined,
        unitPrice: parseFloat(form.unitPrice),
        minStockAlert: parseInt(form.minStockAlert, 10),
        location: form.location || undefined,
      });
      navigate(`/products/${product.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Add Product</h2>
      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(['name', 'sku', 'category', 'location'] as const).map((key) => {
            const label =
              (key === 'sku' ? 'SKU' : key.charAt(0).toUpperCase() + key.slice(1)) +
              (key === 'name' || key === 'sku' ? ' *' : '');
            return (
            <div key={key}>
              <label className="block text-sm font-medium mb-1">{label}</label>
              <input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full px-3 py-2 border rounded" required={key === 'name' || key === 'sku'} />
            </div>
            );
          })}
          <div>
            <label className="block text-sm font-medium mb-1">Unit Price *</label>
            <input type="number" step="0.01" min="0" value={form.unitPrice}
              onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
              className="w-full px-3 py-2 border rounded" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Min Stock Alert</label>
            <input type="number" min="0" value={form.minStockAlert}
              onChange={(e) => setForm({ ...form, minStockAlert: e.target.value })}
              className="w-full px-3 py-2 border rounded" />
          </div>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Product'}
          </button>
          <button type="button" onClick={() => navigate('/products')} className="px-4 py-2 border rounded">Cancel</button>
        </div>
      </form>
    </div>
  );
}
