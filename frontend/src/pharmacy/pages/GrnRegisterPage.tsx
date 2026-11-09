import { API_BASE, authenticatedFetch } from '../../shared/api';

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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
  supplierId?: string | {
    _id: string;
    supplierName: string;
  };
  totalAmount?: number;
  items?: unknown[];
  createdBy?: string | { _id: string };
}



const getSupplierName = (
  grn: Grn,
  suppliers: Supplier[]
): string => {
  if (typeof grn.supplierId === 'object') {
    return grn.supplierId?.supplierName || '—';
  }

  return suppliers.find(
    (supplier) => supplier._id === grn.supplierId
  )?.supplierName || '—';
};

const GrnRegisterPage: React.FC = () => {
  const auth = useAuth();

  const pharmacyId =
    auth.currentPharmacy?.pharmacyId;

  const [grns, setGrns] = useState<Grn[]>([]);
  const [supplierRecords, setSupplierRecords] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [supplier, setSupplier] = useState('ALL');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const endpoint = pharmacyId
    ? `${API_BASE}/api/v1/pharmacies/${encodeURIComponent(pharmacyId)}/grns`
    : '';
  const supplierEndpoint = pharmacyId
    ? `${API_BASE}/api/v1/pharmacies/${encodeURIComponent(pharmacyId)}/suppliers`
    : '';

  useEffect(() => {
    if (!endpoint || !supplierEndpoint) {
      return;
    }

    const controller = new AbortController();

    const fetchGrns = async () => {
      setLoading(true);
      setGrns([]);
      setSupplierRecords([]);
      try {
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
            response.status === 401
              ? 'Your session is invalid or expired. Please sign in again.'
              : response.status === 403
                ? 'You are not authorized for the selected pharmacy.'
                : response.status === 501
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
          setSupplierRecords(
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

    void fetchGrns();

    return () => controller.abort();
  }, [auth.token, endpoint, supplierEndpoint]);

  const registerRecords = useMemo(
    () => endpoint
      ? grns
      : [],
    [endpoint, grns]
  );

  const supplierOptions = useMemo(
    () => [
      ...new Set(
        registerRecords
          .map((grn) => getSupplierName(grn, supplierRecords))
          .filter((name) => name !== '—')
      )
    ].sort(),
    [registerRecords, supplierRecords]
  );

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();

    return registerRecords.filter((grn) => {
      const receivedDate =
        grn.receivedDate?.slice(0, 10) || '';

      const name = getSupplierName(grn, supplierRecords);

      const matchesSearch = [
        grn.grnNumber,
        grn.invoiceNumber,
        name
      ].some((value) =>
        (value || '').toLowerCase().includes(query)
      );

      return (
        matchesSearch &&
        (!startDate || receivedDate >= startDate) &&
        (!endDate || receivedDate <= endDate) &&
        (supplier === 'ALL' || name === supplier)
      );
    });
  }, [
    registerRecords,
    supplierRecords,
    search,
    startDate,
    endDate,
    supplier
  ]);

  return (
    <div className="space-y-5 p-5 md:p-6">
      <nav className="flex flex-wrap gap-2 pb-2 text-sm">
        <span className="rounded-lg bg-emerald-700 px-4 py-2 text-white">
          GRN Register
        </span>

        <Link
          to="/dashboard/purchasing/distributors"
          className="rounded-lg border border-[#E2E8E5] bg-white px-4 py-2 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
        >
          Distributors
        </Link>

        {auth.hasPermission('grn:verify') && (
          <Link
            to="/dashboard/purchasing/verification"
            className="rounded-lg border border-[#E2E8E5] bg-white px-4 py-2 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
          >
            GRN Verification
          </Link>
        )}
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-emerald-950">
            Goods Received Note Register
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage medicines received from distributors
            and their associated invoices.
          </p>
        </div>

        {auth.hasPermission('grn:create') && (
          <Link
            to="/dashboard/purchasing/new-grn"
            className="rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white"
          >
            + New GRN
          </Link>
        )}
      </div>

      <section className="grid gap-4 rounded-xl bg-white p-5 md:grid-cols-4">
        <label className="space-y-2 text-sm md:col-span-2">
          <span>Search register</span>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search GRN number, invoice number, or distributor"
            className="w-full rounded-lg border border-[#E2E8E5] p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
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
              className="w-full min-w-0 rounded-lg border border-[#E2E8E5] p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            />

            <input
              aria-label="To date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full min-w-0 rounded-lg border border-[#E2E8E5] p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            />
          </div>
        </div>

        <label className="space-y-2 text-sm">
          <span>Distributor</span>

          <select
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            className="w-full rounded-lg border border-[#E2E8E5] p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
          >
            <option value="ALL">
              All distributors
            </option>

            {supplierOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
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
            GRN Register
          </h2>

          <p className="text-xs text-gray-500">
            {filtered.length} records match the current filters
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
                  'Total Invoice Amount (LKR)',
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
              {filtered.map((grn) => (
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
                    {getSupplierName(grn, supplierRecords)}
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
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                      {formatGrnStatus(grn.status)}
                    </span>
                  </td>

                  <td className="p-3">
                    <div className="flex gap-3 text-xs font-semibold text-emerald-700">
                      <Link
                        to={`/dashboard/purchasing/grns/${grn._id}`}
                      >
                        View
                      </Link>

                      <Link
                        to={`/dashboard/purchasing/grns/${grn._id}?print=1`}
                      >
                        Print GRN
                      </Link>
                      {auth.hasPermission('grn:create') &&
                        grn.status === 'DRAFT' &&
                        (auth.currentPharmacy?.role !== 'STAFF' ||
                          (typeof grn.createdBy === 'string'
                            ? grn.createdBy
                            : grn.createdBy?._id) === auth.user?.id) && (
                          <Link
                            to={`/dashboard/purchasing/grns/${grn._id}/edit`}
                          >
                            Edit draft
                          </Link>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {loading && (
            <p className="p-8 text-center text-gray-500">
              Loading GRNs...
            </p>
          )}

          {!loading && filtered.length === 0 && (
            <p className="p-8 text-center text-gray-500">
              No GRNs found.
            </p>
          )}
        </div>

        <p className="border-t border-[#E2E8E5] p-4 text-xs text-gray-500">
          Showing {filtered.length} GRNs
        </p>
      </section>
    </div>
  );
};

export default GrnRegisterPage;
