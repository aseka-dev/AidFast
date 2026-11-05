
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../context/useAuth';

interface Grn {
  _id: string;
  grnNumber: string;
  receivedDate: string;
  invoiceNumber: string;
  status: string;
  supplierId?: {
    _id: string;
    supplierName: string;
  } | string;
  items?: unknown[];
  totalAmount?: number;
}

type AuthSelection = {
  selectedPharmacyId?: string;
  selectedPharmacy?: { _id?: string; id?: string };
};

const API_BASE = (
  import.meta.env.VITE_API_URL || ''
).replace(/\/$/, '');

const statuses = [
  'ALL',
  'DRAFT',
  'PENDING_VERIFICATION',
  'CHANGES_REQUESTED',
  'REVERSED'
];

const formatStatus = (status: string) =>
  status.replaceAll('_', ' ').toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const GrnVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const auth = useAuth() as AuthSelection;
  const pharmacyId =
    auth.selectedPharmacyId ||
    auth.selectedPharmacy?._id ||
    auth.selectedPharmacy?.id;

  const [grns, setGrns] = useState<Grn[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [processingId, setProcessingId] = useState('');

  const endpoint = pharmacyId
    ? `${API_BASE}/api/v1/pharmacies/${encodeURIComponent(pharmacyId)}/grns`
    : '';

  const loadGrns = async () => {
    if (!endpoint) {
      setError('Please select a pharmacy.');
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

      setGrns(records);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Loading failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadGrns();
  }, [endpoint]);

  const supplierName = (grn: Grn) =>
    typeof grn.supplierId === 'object'
      ? grn.supplierId?.supplierName || '—'
      : '—';

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return grns.filter((grn) => {
      if (grn.status === 'CONFIRMED') return false;
      if (status !== 'ALL' && grn.status !== status) return false;

      return [
        grn.grnNumber,
        grn.invoiceNumber,
        supplierName(grn)
      ].some((value) => value.toLowerCase().includes(query));
    });
  }, [grns, search, status]);

  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const submitGrn = async (grn: Grn) => {
    if (!endpoint) return;

    setProcessingId(grn._id);
    setError('');

    try {
      const response = await fetch(
        `${endpoint}/${encodeURIComponent(grn._id)}/submit`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (!response.ok) {
        throw new Error(
          response.status === 501
            ? 'GRN submission API is not implemented yet.'
            : `Submission failed (${response.status}).`
        );
      }

      await loadGrns();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed.');
    } finally {
      setProcessingId('');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <nav className="flex flex-wrap gap-2 border-b pb-4 text-sm">
        <Link
          to="/dashboard/purchasing"
          className="rounded-lg border bg-white px-4 py-2"
        >
          GRN Register
        </Link>
        <Link
          to="/dashboard/purchasing/distributors"
          className="rounded-lg border bg-white px-4 py-2"
        >
          Distributors
        </Link>
        <span className="rounded-lg bg-emerald-700 px-4 py-2 text-white">
          GRN Verification
        </span>
      </nav>

      <div>
        <h1 className="text-3xl font-bold text-emerald-950">
          GRN Verification
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Review unconfirmed goods received notes through independent verification.
        </p>
      </div>

      <section className="rounded-xl border bg-white p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span>Search queue</span>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search GRN number, invoice number, or distributor"
              className="w-full rounded-lg border p-3"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span>Status</span>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border p-3"
            >
              {statuses.map((value) => (
                <option key={value} value={value}>
                  {value === 'ALL' ? 'All statuses' : formatStatus(value)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 text-xs text-emerald-700">
          Awaiting My Verification
        </div>
      </section>

      {error && (
        <div role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-xl border bg-white">
        <div className="border-b p-4">
          <h2 className="font-semibold text-emerald-950">
            GRN Verification Queue
          </h2>
          <p className="text-xs text-gray-500">
            {filtered.length} unconfirmed records
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                {[
                  'GRN Number', 'Received Date', 'Distributor',
                  'Invoice Number', 'Number of Items',
                  'Total Amount (LKR)', 'Status', 'Actions'
                ].map((heading) => (
                  <th key={heading} className="p-3">{heading}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {visible.map((grn) => (
                <tr key={grn._id} className="border-t">
                  <td className="p-3 font-semibold text-emerald-800">
                    {grn.grnNumber}
                  </td>
                  <td className="p-3">
                    {grn.receivedDate
                      ? new Date(grn.receivedDate).toLocaleDateString('en-GB')
                      : '—'}
                  </td>
                  <td className="p-3">{supplierName(grn)}</td>
                  <td className="p-3">{grn.invoiceNumber}</td>
                  <td className="p-3">{grn.items?.length ?? '—'}</td>
                  <td className="p-3">
                    {grn.totalAmount == null
                      ? '—'
                      : Number(grn.totalAmount).toFixed(2)}
                  </td>
                  <td className="p-3">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs">
                      {formatStatus(grn.status)}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-3 text-xs font-semibold text-emerald-700">
                      <Link
                        to={`/dashboard/purchasing/grns/${grn._id}`}
                      >
                        View
                      </Link>

                      {(grn.status === 'DRAFT' ||
                        grn.status === 'CHANGES_REQUESTED') && (
                        <Link
                          to={`/dashboard/purchasing/grns/${grn._id}/edit`}
                        >
                          Edit
                        </Link>
                      )}

                      {(grn.status === 'DRAFT' ||
                        grn.status === 'CHANGES_REQUESTED') && (
                        <button
                          disabled={processingId === grn._id}
                          onClick={() => void submitGrn(grn)}
                        >
                          {grn.status === 'DRAFT'
                            ? 'Submit for Verification'
                            : 'Resubmit'}
                        </button>
                      )}

                      {grn.status === 'PENDING_VERIFICATION' && (
                        <button
                          onClick={() =>
                            navigate(`/dashboard/purchasing/grns/${grn._id}`)
                          }
                        >
                          Review GRN
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && visible.length === 0 && (
            <p className="p-8 text-center text-gray-500">
              No GRNs match the current filters.
            </p>
          )}

          {loading && (
            <p className="p-8 text-center text-gray-500">
              Loading GRNs...
            </p>
          )}
        </div>

        <div className="flex justify-between border-t p-4 text-sm">
          <span>Showing {visible.length} of {filtered.length} GRNs</span>
          <div className="flex gap-3">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="disabled:opacity-30"
            >
              Previous
            </button>
            <span>{page} / {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default GrnVerificationPage;
