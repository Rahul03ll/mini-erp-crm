import { useState, useEffect, FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { Customer } from '../types';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState('');
  const [form, setForm] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!id) return;
    try {
      const data = await api.getCustomer(id);
      setCustomer(data);
      setForm({
        name: data.name,
        mobileNumber: data.mobileNumber,
        email: data.email || '',
        businessName: data.businessName || '',
        gstNumber: data.gstNumber || '',
        customerType: data.customerType,
        address: data.address || '',
        status: data.status,
        followUpDate: data.followUpDate ? data.followUpDate.split('T')[0] : '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customer');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await api.updateCustomer(id, {
        ...form,
        email: form.email || undefined,
        followUpDate: form.followUpDate ? new Date(form.followUpDate).toISOString() : null,
      });
      setEditing(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const handleAddNote = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || !note.trim()) return;
    try {
      await api.addCustomerNote(id, note);
      setNote('');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add note');
    }
  };

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (!customer) return <p className="text-red-600">Customer not found</p>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/customers" className="text-blue-600 text-sm hover:underline">&larr; Back</Link>
        <h2 className="text-2xl font-bold">{customer.name}</h2>
        <span className={`px-2 py-0.5 rounded text-xs ${
          customer.status === 'Active' ? 'bg-green-100 text-green-800' :
          customer.status === 'Lead' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-600'
        }`}>{customer.status}</span>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">{error}</div>}

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex justify-between mb-4">
          <h3 className="font-semibold">Customer Details</h3>
          <button onClick={() => setEditing(!editing)} className="text-sm text-blue-600 hover:underline">
            {editing ? 'Cancel Edit' : 'Edit'}
          </button>
        </div>

        {editing ? (
          <form onSubmit={handleUpdate} className="space-y-3">
            {Object.entries({
              name: 'Name', mobileNumber: 'Mobile', email: 'Email',
              businessName: 'Business Name', gstNumber: 'GST', address: 'Address',
            }).map(([key, label]) => (
              <div key={key}>
                <label className="block text-sm font-medium mb-1">{label}</label>
                <input value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full px-3 py-2 border rounded text-sm" />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select value={form.customerType} onChange={(e) => setForm({ ...form, customerType: e.target.value })} className="w-full px-3 py-2 border rounded text-sm">
                  <option value="Retail">Retail</option><option value="Wholesale">Wholesale</option><option value="Distributor">Distributor</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border rounded text-sm">
                  <option value="Lead">Lead</option><option value="Active">Active</option><option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded text-sm">Save Changes</button>
          </form>
        ) : (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-gray-500">Mobile</dt><dd>{customer.mobileNumber}</dd></div>
            <div><dt className="text-gray-500">Email</dt><dd>{customer.email || '—'}</dd></div>
            <div><dt className="text-gray-500">Business</dt><dd>{customer.businessName || '—'}</dd></div>
            <div><dt className="text-gray-500">GST</dt><dd>{customer.gstNumber || '—'}</dd></div>
            <div><dt className="text-gray-500">Type</dt><dd>{customer.customerType}</dd></div>
            <div><dt className="text-gray-500">Follow-up</dt><dd>{customer.followUpDate ? new Date(customer.followUpDate).toLocaleDateString() : '—'}</dd></div>
            <div className="col-span-2"><dt className="text-gray-500">Address</dt><dd>{customer.address || '—'}</dd></div>
          </dl>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="font-semibold mb-4">Follow-up Notes</h3>
        <form onSubmit={handleAddNote} className="mb-4 flex gap-2">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a follow-up note..."
            className="flex-1 px-3 py-2 border rounded text-sm" />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded text-sm">Add</button>
        </form>
        <div className="space-y-3">
          {customer.followUpNotes?.map((n) => (
            <div key={n.id} className="p-3 bg-gray-50 rounded text-sm">
              <p>{n.content}</p>
              <p className="text-xs text-gray-500 mt-1">
                {n.author?.name} &middot; {new Date(n.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
          {(!customer.followUpNotes || customer.followUpNotes.length === 0) && (
            <p className="text-gray-500 text-sm">No notes yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
