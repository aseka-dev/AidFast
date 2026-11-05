
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../context/useAuth';

interface Grn {
  _id: string;
  grnNumber: string;
  receivedDate: string;
  invoiceNumber: string;
  status: string;
  supplierId?: string | {
    _id: string;
    supplierName: string;
  };
  totalAmount?: number;
  items?: unknown[];
}

type AuthSelection = {
  selectedPharmacyId?: string;
  selectedPharmacy?: { _id?: string; id?: string };
};

const API_BASE = (
  import.meta.env.VITE_API_URL || ''
).replace(/\/$/, '');

const GrnRegisterPage: React.FC = () => {
  const auth = useAuth() as AuthSelection;
  const pharmacyId =
    auth.selectedPharmacyId ||
    auth.selectedPharmacy?._id ||
    auth.selectedPharmacy?.id;

  const [grns, setGrns] = useState<Grn[]>([]);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [supplier, setSupplier] = useState('ALL');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const endpoint = pharmacyId
    ? `${API_BASE}/api/v1/pharmacies/${encodeURIComponent(pharmacyId)}/grns`
    : '';

  useEffect(() => {
    if (!endpoint) {
      setError('Please select a pharmacy.');
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(endpoint, {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(
            response.status === 501
              ? 'GRN listing API is not implemented yet.'
              : `Unable to load GRNs (${response.status}).`
          );
        }

        const result = await response.json();
        const records = Array.isArray(result)
          ? result
          : Array.isArray(result.data)
            ? result.data
            : result.data?.grns;

        if (!Array.isArray(records)) {
          throw new Error('Unexpected GRN response format.');
        }

        if (!cancelled) setGrns(records);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Loading failed.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [endpoint]);

  const getSupplierName = (grn: Grn) =>
    typeof grn.supplierId === 'object'
      ? grn.supplierId?.supplierName || '—'
      : '—';

  const confirmed = grns.filter((grn) => grn.status === 'CONFIRMED');

  const suppliers = [...new Set(
    confirmed.map(getSupplierName).filter((name) => name !== '—')
  )].sort();

  const filtered = useMemo(() => confirmed.filter((grn) => {
    const query = search.toLowerCase().trim();
    const date = grn.receivedDate?.slice(0, 10) || '';
    const name = getSupplierName(grn);

    return (
      [grn.grnNumber, grn.invoiceNumber, name]
        .some((value) => value.toLowerCase().includes(query)) &&
      (!startDate || date >= startDate) &&
      (!endDate || date <= endDate) &&
      (supplier === 'ALL' || name === supplier)
    );
  }), [grns, search, startDate, endDate, supplier]);

  return (
    <div className="space-y-6 p-6">
      <nav className="flex flex-wrap gap-2 border-b pb-4 text-sm">
        <span className="rounded-lg bg-emerald-700 px-4 py-2 text-white">
          GRN Register
        </span>
        <Link
          to="/dashboard/purchasing/distributors"
          className="rounded-lg border bg-white px-4 py-2"
        >
          Distributors
        </Link>
        <Link
          to="/dashboard/purchasing/verification"
          className="rounded-lg border bg-white px-4 py-2"
        >
          GRN Verification
        </Link>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-emerald-950">
            Goods Received Note Register
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage medicines received from distributors and their associated invoices.
          </p>
        </div>

        <Link
          to="/dashboard/purchasing/new-grn"
          className="rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white"
        >
          + New GRN
        </Link>
      </div>

      <section className="grid gap-4 rounded-xl border bg-white p-5 md:grid-cols-4">
        <label className="space-y-2 text-sm md:col-span-2">
          <span>Search register</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search GRN number, invoice number, or distributor"
            className="w-full rounded-lg border p-3"
          />
        </label>

        <div className="space-y-2 text-sm">
          <span>Date range</span>
          <div className="flex gap-2">
            <input
              aria-label="From date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full min-w-0 rounded-lg border p-2"
            />
            <input
              aria-label="To date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full min-w-0 rounded-lg border p-2"
            />
          </div>
        </div>

        <label className="space-y-2 text-sm">
          <span>Distributor</span>
          <select
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            className="w-full rounded-lg border p-3"
          >
            <option value="ALL">All distributors</option>
            {suppliers.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </label>
      </section>

      {error && (
        <div role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-xl border bg-white">
        <div className="border-b p-4">
          <h2 className="font-semibold text-emerald-950">GRN Register</h2>
          <p className="text-xs text-gray-500">
            {filtered.length} records match the current filters
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                {[
                  'GRN Number', 'Received Date', 'Distributor',
                  'Invoice Number', 'Number of Items',
                  'Total Invoice Amount (LKR)', 'Status', 'Actions'
                ].map((heading) => (
                  <th key={heading} className="p-3">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((grn) => (
                <tr key={grn._id} className="border-t">
                  <td className="p-3 font-semibold text-emerald-800">
                    {grn.grnNumber}
                  </td>
                  <td className="p-3">
                    {new Date(grn.receivedDate).toLocaleDateString('en-GB')}
                  </td>
                  <td className="p-3">{getSupplierName(grn)}</td>
                  <td className="p-3">{grn.invoiceNumber}</td>
                  <td className="p-3">{grn.items?.length ?? '—'}</td>
                  <td className="p-3">
                    {grn.totalAmount == null
                      ? '—'
                      : Number(grn.totalAmount).toFixed(2)}
                  </td>
                  <td className="p-3">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs">
                      Confirmed
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-3 text-xs font-semibold text-emerald-700">
                      <Link to={`/dashboard/purchasing/grns/${grn._id}`}>
                        View
                      </Link>
                      <Link to={`/dashboard/purchasing/grns/${grn._id}?print=1`}>
                        Print GRN
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {loading && (
            <p className="p-8 text-center text-gray-500">Loading GRNs...</p>
          )}
          {!loading && filtered.length === 0 && (
            <p className="p-8 text-center text-gray-500">
              No confirmed GRNs found.
            </p>
          )}
        </div>
        <p className="border-t p-4 text-xs text-gray-500">
          Showing {filtered.length} confirmed GRNs
        </p>
      </section>
    </div>
  );
};

export default GrnRegisterPage;
