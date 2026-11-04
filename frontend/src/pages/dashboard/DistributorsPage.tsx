
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../context/useAuth';

interface Supplier {
  _id: string;
  supplierName: string;
  contact?: string;
  email?: string;
  address?: string;
  status?: string;
  grnCount?: number;
}

type AuthSelection = {
  selectedPharmacyId?: string;
  selectedPharmacy?: { _id?: string; id?: string };
};

const API_BASE = (
  import.meta.env.VITE_API_URL || ''
).replace(/\/$/, '');

const DistributorsPage: React.FC = () => {
  const auth = useAuth() as AuthSelection;
  const pharmacyId =
    auth.selectedPharmacyId ||
    auth.selectedPharmacy?._id ||
    auth.selectedPharmacy?.id;

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Supplier | null>(null);

  const [form, setForm] = useState({
    supplierName: '',
    contact: '',
    email: '',
    address: ''
  });

  const endpoint = pharmacyId
    ? `${API_BASE}/api/v1/pharmacies/${encodeURIComponent(pharmacyId)}/suppliers`
    : '';

  const loadSuppliers = async () => {
    if (!endpoint) {
      setError('No pharmacy is selected.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(endpoint, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(
          response.status === 501
            ? 'Supplier API is not implemented yet.'
            : `Unable to load distributors (${response.status}).`
        );
      }

      const result = await response.json();
      const records = Array.isArray(result)
        ? result
        : Array.isArray(result.data)
          ? result.data
          : Array.isArray(result.data?.suppliers)
            ? result.data.suppliers
            : null;

      if (!records) {
        throw new Error('Unexpected supplier API response format.');
      }

      setSuppliers(records);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSuppliers();
    // Reload whenever the selected pharmacy changes.
  }, [endpoint]);

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();
    return suppliers.filter((supplier) =>
      [
        supplier.supplierName,
        supplier.contact,
        supplier.email
      ].some((value) => value?.toLowerCase().includes(query))
    );
  }, [suppliers, search]);

  const pageSize = 6;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const saveSupplier = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!endpoint) return;

    setSaving(true);
    setError('');

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (!response.ok) {
        throw new Error(
          response.status === 501
            ? 'Supplier creation API is not implemented yet.'
            : `Unable to save distributor (${response.status}).`
        );
      }

      setShowForm(false);
      setForm({
        supplierName: '',
        contact: '',
        email: '',
        address: ''
      });
      await loadSuppliers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <nav className="flex flex-wrap gap-2 border-b pb-4">
        <Link to="/dashboard/purchasing" className="rounded-lg border bg-white px-4 py-2 text-sm">
          GRN Register
        </Link>
        <span className="rounded-lg bg-emerald-700 px-4 py-2 text-sm text-white">
          Distributors
        </span>
        <span className="rounded-lg border px-4 py-2 text-sm text-gray-500">
          GRN Verification
        </span>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-emerald-950">
            Distributors
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage approved medicine distributors and their contact details.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="rounded-xl bg-emerald-700 px-5 py-3 font-medium text-white"
        >
          {showForm ? 'Cancel' : 'Add Distributor'}
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={saveSupplier} className="grid gap-4 rounded-xl border bg-white p-5 md:grid-cols-2">
          {([
            ['supplierName', 'Distributor Name'],
            ['contact', 'Contact Person / Phone'],
            ['email', 'Email'],
            ['address', 'Address']
          ] as const).map(([field, label]) => (
            <label key={field} className="space-y-1 text-sm">
              <span className="font-medium">{label}</span>
              <input
                type={field === 'email' ? 'email' : 'text'}
                required={field === 'supplierName'}
                value={form[field]}
                onChange={(e) =>
                  setForm({ ...form, [field]: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 p-3"
              />
            </label>
          ))}
          <div className="md:col-span-2">
            <button
              disabled={saving || !pharmacyId}
              className="rounded-lg bg-emerald-700 px-5 py-2 text-white disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Distributor'}
            </button>
          </div>
        </form>
      )}

      <input
        aria-label="Search distributors"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        placeholder="Search by distributor name, contact person, phone, or email..."
        className="w-full rounded-xl border border-gray-200 bg-white p-4 outline-none focus:border-emerald-600"
      />

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h2 className="font-semibold text-emerald-950">
              Distributor Directory
            </h2>
            <p className="text-xs text-gray-500">
              Approved distributors connected to GRN records
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                {[
                  'Distributor Name',
                  'Contact',
                  'Email',
                  'Number of GRNs',
                  'Actions'
                ].map((heading) => (
                  <th key={heading} className="p-4">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((supplier) => (
                <tr key={supplier._id} className="border-t">
                  <td className="p-4 font-semibold text-emerald-800">
                    {supplier.supplierName}
                  </td>
                  <td className="p-4">{supplier.contact || '—'}</td>
                  <td className="p-4">{supplier.email || '—'}</td>
                  <td className="p-4">
                    {supplier.grnCount ?? '—'}
                  </td>
                  <td className="p-4">
                    <button
                      type="button"
                      onClick={() => setSelected(supplier)}
                      className="font-medium text-emerald-700 hover:underline"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && visible.length === 0 && (
            <p className="p-8 text-center text-gray-500">
              No distributors found.
            </p>
          )}
          {loading && (
            <p className="p-8 text-center text-gray-500">
              Loading distributors...
            </p>
          )}
        </div>

        <div className="flex items-center justify-between border-t p-4 text-sm text-gray-500">
          <span>Showing {visible.length} of {filtered.length} distributors</span>
          <div className="flex items-center gap-3">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="disabled:opacity-30"
            >
              Previous
            </button>
            <span>{page} / {pageCount}</span>
            <button
              disabled={page >= pageCount}
              onClick={() => setPage(page + 1)}
              className="disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {selected && (
        <div className="rounded-xl border bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{selected.supplierName}</h2>
            <button onClick={() => setSelected(null)}>Close</button>
          </div>
          <p className="mt-3 text-sm">Contact: {selected.contact || '—'}</p>
          <p className="text-sm">Email: {selected.email || '—'}</p>
          <p className="text-sm">Address: {selected.address || '—'}</p>
          <p className="text-sm">Status: {selected.status || '—'}</p>
        </div>
      )}
    </div>
  );
};

export default DistributorsPage;
