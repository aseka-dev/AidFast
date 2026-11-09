import { API_BASE, authenticatedFetch } from '../../shared/api';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  Link,
  useNavigate
} from 'react-router-dom';

import useAuth from '../../shared/context/useAuth';
import {
  formatGrnDate,
  formatGrnStatus,
  responseRecords
} from '../components/grn/grnUtils';

interface Supplier {
  _id: string;
  supplierName: string;
}

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



const statuses = [
  'ALL',
  'DRAFT',
  'PENDING_VERIFICATION',
  'CHANGES_REQUESTED',
  'REVERSED'
];

const supplierName = (grn: Grn, suppliers: Supplier[]): string => {
  if (typeof grn.supplierId === 'object') {
    return grn.supplierId?.supplierName || '—';
  }

  return suppliers.find(
    (supplier) => supplier._id === grn.supplierId
  )?.supplierName || '—';
};

const GrnVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const auth = useAuth();

  const pharmacyId =
    auth.currentPharmacy?.pharmacyId;

  const [grns, setGrns] = useState<Grn[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [processingId, setProcessingId] = useState('');

  const endpoint = pharmacyId
    ? `${API_BASE}/api/v1/pharmacies/${encodeURIComponent(pharmacyId)}/grns`
    : '';
  const supplierEndpoint = pharmacyId
    ? `${API_BASE}/api/v1/pharmacies/${encodeURIComponent(pharmacyId)}/suppliers`
    : '';

  const loadGrns = useCallback(async (signal?: AbortSignal) => {
    if (!endpoint) return;

    setLoading(true);
    setError('');

    try {
      const response = await authenticatedFetch(endpoint, {
        credentials: 'omit',
        signal
      }, auth.token);

      if (!response.ok) {
        throw new Error(
          response.status === 501
            ? 'GRN listing API is not implemented yet.'
            : `Unable to load GRNs (${response.status}).`
        );
      }

      const result = await response.json();

      const records = responseRecords<Grn>(result, 'grns');

      if (!Array.isArray(records)) {
        throw new Error('Unexpected GRN response format.');
      }

      setGrns(records);
    } catch (err) {
      if (signal?.aborted) return;
      setError(
        err instanceof Error
          ? err.message
          : 'Loading failed.'
      );
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [auth.token, endpoint]);

  useEffect(() => {
    if (!endpoint || !supplierEndpoint) {
      return;
    }

    const controller = new AbortController();

    const fetchInitialGrns = async () => {
      setGrns([]);
      setSuppliers([]);
      try {
        setLoading(true);
        const [response, supplierResult] = await Promise.all([
          authenticatedFetch(endpoint, {
            credentials: 'omit',
            signal: controller.signal
          }, auth.token),
          authenticatedFetch(supplierEndpoint, {
            credentials: 'omit',
            signal: controller.signal
          }, auth.token)
            .then((supplierResponse) =>
              supplierResponse.ok
                ? supplierResponse.json()
                : null
            )
            .catch(() => null)
        ]);

        if (!response.ok) {
          throw new Error(
            response.status === 501
              ? 'GRN listing API is not implemented yet.'
              : `Unable to load GRNs (${response.status}).`
          );
        }

        const result = await response.json();

        const records = responseRecords<Grn>(result, 'grns');

        if (!Array.isArray(records)) {
          throw new Error('Unexpected GRN response format.');
        }

        if (controller.signal.aborted) return;

        setGrns(records);
        if (supplierResult) {
          setSuppliers(
            responseRecords<Supplier>(supplierResult, 'suppliers') || []
          );
        }
        setError('');
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : 'Loading failed.'
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void fetchInitialGrns();

    return () => controller.abort();
  }, [auth.token, endpoint, supplierEndpoint]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return (endpoint ? grns : []).filter((grn) => {
      if (grn.status === 'CONFIRMED') return false;

      if (
        status !== 'ALL' &&
        grn.status !== status
      ) {
        return false;
      }

      return [
        grn.grnNumber,
        grn.invoiceNumber,
        supplierName(grn, suppliers)
      ].some((value) =>
        (value || '').toLowerCase().includes(query)
      );
    });
  }, [endpoint, grns, search, status, suppliers]);

  const pageSize = 8;

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / pageSize)
  );

  const currentPage = Math.min(page, totalPages);

  const visible = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const submitGrn = async (grn: Grn) => {
    if (!endpoint || !auth.hasPermission('grn:submit')) return;

    setProcessingId(grn._id);
    setError('');

    try {
      const response = await authenticatedFetch(
        `${endpoint}/${encodeURIComponent(grn._id)}/submit`,
        {
          method: 'POST',
          credentials: 'omit',
          headers: {
            'Content-Type': 'application/json'
          }
        },
        auth.token
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
      setError(
        err instanceof Error
          ? err.message
          : 'Submission failed.'
      );
    } finally {
      setProcessingId('');
    }
  };

  return (
    <div className="space-y-5 p-5 md:p-6">
      <nav className="flex flex-wrap gap-2 pb-2 text-sm">
        <Link
          to="/dashboard/purchasing"
          className="rounded-lg border border-[#E2E8E5] bg-white px-4 py-2 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
        >
          GRN Register
        </Link>

        <Link
          to="/dashboard/purchasing/distributors"
          className="rounded-lg border border-[#E2E8E5] bg-white px-4 py-2 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
        >
          Distributors
        </Link>

        <span className="rounded-lg bg-emerald-700 px-4 py-2 text-white">
          GRN Verification
        </span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-emerald-950">
          GRN Verification
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Track GRNs awaiting verification, returned for corrections,
          or reversed.
        </p>
      </div>

      <section className="rounded-xl bg-white p-5">
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
              className="w-full rounded-lg border border-[#E2E8E5] p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
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
              className="w-full rounded-lg border border-[#E2E8E5] p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            >
              {statuses.map((value) => (
                <option key={value} value={value}>
                  {value === 'ALL'
                    ? 'All statuses'
                    : formatGrnStatus(value)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 text-xs text-emerald-700">
          Awaiting verification: {filtered.filter(
            (grn) => grn.status === 'PENDING_VERIFICATION'
          ).length}
        </div>
      </section>

      {!pharmacyId && (
        <div
          role="alert"
          className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800"
        >
          Please select a pharmacy.
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-[#E2E8E5] bg-white">
        <div className="border-b border-[#E2E8E5] p-4">
          <h2 className="font-semibold text-emerald-950">
            GRN Verification Queue
          </h2>

          <p className="text-xs text-gray-500">
            {filtered.length} non-confirmed records
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                {[
                  'GRN Number',
                  'Received Date',
                  'Distributor',
                  'Invoice Number',
                  'Number of Items',
                  'Total Amount (LKR)',
                  'Status',
                  'Actions'
                ].map((heading) => (
                  <th key={heading} className="p-3">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {visible.map((grn) => (
                <tr
                  key={grn._id}
                  className="border-t border-[#E2E8E5]"
                >
                  <td className="p-3 font-semibold text-emerald-800">
                    {grn.grnNumber}
                  </td>

                  <td className="p-3">
                    {formatGrnDate(grn.receivedDate)}
                  </td>

                  <td className="p-3">
                    {supplierName(grn, suppliers)}
                  </td>

                  <td className="p-3">
                    {grn.invoiceNumber}
                  </td>

                  <td className="p-3">
                    {grn.items?.length ?? '—'}
                  </td>

                  <td className="p-3">
                    {grn.totalAmount == null
                      ? '—'
                      : Number(
                          grn.totalAmount
                        ).toFixed(2)}
                  </td>

                  <td className="p-3">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs">
                      {formatGrnStatus(grn.status)}
                    </span>
                  </td>

                  <td className="p-3">
                    <div className="flex flex-wrap gap-3 text-xs font-semibold text-emerald-700">
                      <Link
                        to={`/dashboard/purchasing/grns/${grn._id}`}
                      >
                        View
                      </Link>

                      {auth.hasPermission('grn:create') &&
                        grn.status === 'DRAFT' && (
                        <Link
                          to={`/dashboard/purchasing/grns/${grn._id}/edit`}
                        >
                          Edit
                        </Link>
                      )}

                      {auth.hasPermission('grn:submit') &&
                        grn.status === 'DRAFT' && (
                        <button
                          type="button"
                          disabled={
                            processingId === grn._id
                          }
                          onClick={() =>
                            void submitGrn(grn)
                          }
                          className="disabled:opacity-50"
                        >
                          Submit for Verification
                        </button>
                      )}

                      {grn.status ===
                        'PENDING_VERIFICATION' && (
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/dashboard/purchasing/grns/${grn._id}`
                            )
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

        <div className="flex justify-between border-t border-[#E2E8E5] p-4 text-sm">
          <span>
            Showing {visible.length} of {filtered.length} GRNs
          </span>

          <div className="flex gap-3">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() =>
                setPage(currentPage - 1)
              }
              className="disabled:opacity-30"
            >
              Previous
            </button>

            <span>
              {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() =>
                setPage(currentPage + 1)
              }
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
