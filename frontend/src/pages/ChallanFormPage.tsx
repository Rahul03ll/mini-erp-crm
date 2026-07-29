import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Customer, Product } from '../types';

interface LineItem { productId: string; quantity: number; productName?: string }

export default function ChallanFormPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getCustomers({ limit: 100 }),
      api.getProducts({ limit: 100 }),
    ]).then(([custRes, prodRes]) => {
      setCustomers(custRes.data);
      setProducts(prodRes.data);
    }).catch((err) => setError(err.message));
  }, []);

  const addLineItem = () => {
    if (!selectedProduct || !quantity || parseInt(quantity) <= 0) return;
    const product = products.find((p) => p.id === selectedProduct);
    if (!product) return;

    const existing = lineItems.find((li) => li.productId === selectedProduct);
    if (existing) {
      setLineItems(lineItems.map((li) =>
        li.productId === selectedProduct
          ? { ...li, quantity: li.quantity + parseInt(quantity, 10) }
          : li
      ));
    } else {
      setLineItems([...lineItems, {
        productId: selectedProduct,
        quantity: parseInt(quantity, 10),
        productName: product.name,
      }]);
    }
    setSelectedProduct('');
    setQuantity('');
  };

  const removeLineItem = (productId: string) => {
    setLineItems(lineItems.filter((li) => li.productId !== productId));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!customerId || lineItems.length === 0) {
      setError('Select a customer and add at least one product');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const challan = await api.createChallan({
        customerId,
        lineItems: lineItems.map(({ productId, quantity: qty }) => ({ productId, quantity: qty })),
      });
      navigate(`/challans/${challan.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create challan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold mb-6">Create Sales Challan</h2>
      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Customer *</label>
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}
            className="w-full px-3 py-2 border rounded" required>
            <option value="">Select customer...</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name} {c.businessName ? `(${c.businessName})` : ''}</option>
            ))}
          </select>
        </div>

        <div>
          <h3 className="font-medium mb-3">Line Items</h3>
          <div className="flex gap-2 mb-3">
            <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}
              className="flex-1 px-3 py-2 border rounded text-sm">
              <option value="">Select product...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.sku}) — Stock: {p.currentStock}</option>
              ))}
            </select>
            <input type="number" min="1" placeholder="Qty" value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-24 px-3 py-2 border rounded text-sm" />
            <button type="button" onClick={addLineItem}
              className="px-4 py-2 bg-gray-600 text-white rounded text-sm">Add</button>
          </div>

          {lineItems.length > 0 && (
            <table className="w-full text-sm border rounded">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-2">Product</th>
                  <th className="text-right p-2">Qty</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((li) => (
                  <tr key={li.productId} className="border-t">
                    <td className="p-2">{li.productName}</td>
                    <td className="p-2 text-right">{li.quantity}</td>
                    <td className="p-2 text-right">
                      <button type="button" onClick={() => removeLineItem(li.productId)}
                        className="text-red-600 text-xs hover:underline">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Saving...' : 'Save as Draft'}
          </button>
          <button type="button" onClick={() => navigate('/challans')} className="px-4 py-2 border rounded">Cancel</button>
        </div>
      </form>
    </div>
  );
}
