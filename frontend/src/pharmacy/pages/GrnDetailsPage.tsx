import { API_BASE, authenticatedFetch } from '../../shared/api';

import React, {
  useEffect,
  useState
} from 'react';

import {
  Link,
  useParams,
  useSearchParams
} from 'react-router-dom';

import useAuth from '../../shared/context/useAuth';

interface GrnItem {
  _id?: string;
  medicineId?: string | {
    _id: string;
    medicineName?: string;
    genericName?: string;
    brandTradeName?: string;
  };
  batchNumber?: string;
  expiryDate?: string;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  wholesalePrice?: number;
  lineTotal?: number;
}

interface Grn {
  _id: string;
  grnNumber: string;
  status: string;
  receivedDate: string;
  invoiceNumber: string;
  invoiceDate?: string;
  supplierId?: string | {
    supplierName: string;
    contact?: string;
  };
  purchaseOrderId?: string;
  verificationComment?: string;
  createdAt?: string;
  confirmedAt?: string;
  verifiedAt?: string;
  totalAmount?: number;
  items?: GrnItem[];
}



const money = (value: number) =>
  `LKR ${value.toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

const date = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString('en-GB')
    : '—';

const GrnDetailsPage: React.FC = () => {
  const { grnId } = useParams<{ grnId: string }>();
  const [params] = useSearchParams();

  const auth = useAuth();

  const pharmacyId =
    auth.currentPharmacy?.pharmacyId;

  const [grn, setGrn] = useState<Grn | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [processing, setProcessing] = useState(false);

  const endpoint = pharmacyId && grnId
    ? `${API_BASE}/api/v1/pharmacies/${encodeURIComponent(
        pharmacyId
      )}/grns/${encodeURIComponent(grnId)}`
    : '';

  const printRequested = params.get('print') === '1';

  // Reload GRN details after a verification action.
  const load = async () => {
    if (!endpoint) {
      setError('Pharmacy or GRN is not selected.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authenticatedFetch(endpoint, {
        credentials: 'omit'
      });

      if (!response.ok) {
        throw new Error(
          `Unable to load GRN (${response.status}).`
        );
      }

      const result = await response.json();
      const record = result.data?.grn || result.data || result;

      if (!record?._id) {
        throw new Error('Unexpected GRN response format.');
      }

      setGrn(record);
      setComment(record.verificationComment || '');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Loading failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Initial GRN loading.
  useEffect(() => {
    if (!endpoint) {
      return;
    }

    const controller = new AbortController();

    const fetchGrn = async () => {
      try {
        const response = await authenticatedFetch(endpoint, {
          credentials: 'omit',
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(
            `Unable to load GRN (${response.status}).`
          );
        }

        const result = await response.json();
        const record = result.data?.grn || result.data || result;

        if (!record?._id) {
          throw new Error('Unexpected GRN response format.');
        }

        if (controller.signal.aborted) {
          return;
        }

        setGrn(record);
        setComment(record.verificationComment || '');
        setError('');
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }

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

    void fetchGrn();

    return () => {
      controller.abort();
    };
  }, [endpoint]);

  // Print after GRN data is available.
  useEffect(() => {
    if (grn && printRequested && !loading) {
      window.print();
    }
  }, [grn, printRequested, loading]);

  // Confirm GRN or request changes.
  const performAction = async (
    action: 'confirm' | 'request-changes'
  ) => {
    if (!endpoint || !grn) {
      return;
    }

    if (
      action === 'request-changes' &&
      !comment.trim()
    ) {
      setError(
        'Enter verification remarks before requesting changes.'
      );
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const response = await authenticatedFetch(
        `${endpoint}/${action}`,
        {
          method: 'POST',
          credentials: 'omit',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            verificationComment: comment
          })
        }
      );

      if (!response.ok) {
        throw new Error(
          response.status === 501
            ? 'GRN verification API is not implemented yet.'
            : `Action failed (${response.status}).`
        );
      }

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Action failed.'
      );
    } finally {
      setProcessing(false);
    }
  };

  if (!endpoint) {
    return (
      <div className="p-6 text-red-700">
        Pharmacy or GRN is not selected.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        Loading GRN details...
      </div>
    );
  }

  if (!grn) {
    return (
      <div className="p-6 text-red-700">
        {error || 'GRN not found.'}
      </div>
    );
  }

  const supplierName =
    typeof grn.supplierId === 'object'
      ? grn.supplierId.supplierName
      : '—';

  const acceptedValue = (grn.items || []).reduce(
    (sum, item) =>
      sum +
      item.acceptedQuantity *
        Number(item.wholesalePrice || 0),
    0
  );

  return (
    <div className="space-y-5 p-6 pb-20">
      <Link
        to={
          grn.status === 'CONFIRMED'
            ? '/dashboard/purchasing'
            : '/dashboard/purchasing/verification'
        }
        className="text-sm font-semibold text-emerald-700"
      >
        ← Back to{' '}
        {grn.status === 'CONFIRMED'
          ? 'GRN Register'
          : 'GRN Verification'}
      </Link>

      {/* GRN Header */}
      <section className="rounded-xl border bg-white p-5">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-emerald-950">
            {grn.grnNumber}
          </h1>

          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs">
            {grn.status.replaceAll('_', ' ')}
          </span>
        </div>

        <p className="mt-2 text-sm text-gray-500">
          Received {date(grn.receivedDate)} · Goods receipt details
        </p>
      </section>

      {/* Inventory Status */}
      {grn.status !== 'CONFIRMED' && (
        <div className="rounded-lg border border-sky-100 bg-sky-50 p-4 text-sm text-sky-800">
          This GRN has not updated inventory.
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* GRN Information */}
      <section className="rounded-xl border bg-white p-5">
        <h2 className="mb-5 border-b pb-3 font-semibold text-emerald-950">
          Goods Receipt Information
        </h2>

        <div className="grid gap-5 text-sm md:grid-cols-3">
          {([
            ['GRN Number', grn.grnNumber],
            ['Received Date', date(grn.receivedDate)],
            ['Distributor', supplierName],
            [
              'Distributor Invoice Number',
              grn.invoiceNumber
            ],
            ['Invoice Date', date(grn.invoiceDate)],
            [
              'Purchase Order Reference',
              grn.purchaseOrderId || '—'
            ],
            ['Prepared Date', date(grn.createdAt)],
            [
              'Verification Date',
              date(grn.verifiedAt)
            ],
            [
              'Verification Remarks',
              grn.verificationComment || '—'
            ]
          ] as const).map(([label, value]) => (
            <div key={label}>
              <p className="text-xs text-gray-500">
                {label}
              </p>
              <p className="mt-1 font-medium text-emerald-950">
                {value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Medicine Items */}
      <section className="overflow-hidden rounded-xl border bg-white">
        <div className="p-5">
          <h2 className="font-semibold text-emerald-950">
            Received Medicine Items
          </h2>

          <p className="text-xs text-gray-500">
            Only accepted quantities from a confirmed GRN
            update inventory.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                {[
                  'Medicine',
                  'Batch Number',
                  'Expiry Date',
                  'Received',
                  'Accepted',
                  'Rejected',
                  'Wholesale Price',
                  'Line Amount'
                ].map((heading) => (
                  <th key={heading} className="p-3">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {(grn.items || []).map((item, index) => {
                const medicine =
                  typeof item.medicineId === 'object'
                    ? item.medicineId
                    : null;

                return (
                  <tr
                    key={item._id || index}
                    className="border-t"
                  >
                    <td className="p-3">
                      {medicine?.medicineName ||
                        medicine?.genericName ||
                        (typeof item.medicineId === 'string'
                          ? item.medicineId
                          : '—')}
                    </td>

                    <td className="p-3">
                      {item.batchNumber || '—'}
                    </td>

                    <td className="p-3">
                      {date(item.expiryDate)}
                    </td>

                    <td className="p-3">
                      {item.receivedQuantity}
                    </td>

                    <td className="p-3">
                      {item.acceptedQuantity}
                    </td>

                    <td className="p-3">
                      {item.rejectedQuantity}
                    </td>

                    <td className="p-3">
                      {money(
                        Number(item.wholesalePrice || 0)
                      )}
                    </td>

                    <td className="p-3">
                      {money(
                        Number(
                          item.lineTotal ??
                            item.acceptedQuantity *
                              Number(
                                item.wholesalePrice || 0
                              )
                        )
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {(!grn.items || grn.items.length === 0) && (
            <p className="p-5 text-sm text-gray-500">
              No item details were returned by the API.
            </p>
          )}
        </div>
      </section>

      {/* Financial Summary */}
      <div className="grid gap-4 rounded-xl border bg-white p-5 md:grid-cols-2">
        <div>
          <p className="text-xs text-gray-500">
            Total Invoice Amount
          </p>

          <p className="font-bold text-emerald-700">
            {grn.totalAmount == null
              ? '—'
              : money(Number(grn.totalAmount))}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500">
            Accepted Stock Value
          </p>

          <p className="font-bold text-emerald-700">
            {grn.items
              ? money(acceptedValue)
              : '—'}
          </p>
        </div>
      </div>

      {/* Independent Verification */}
      {grn.status === 'PENDING_VERIFICATION' && (
        <section className="space-y-4 rounded-xl border bg-white p-5">
          <h2 className="font-semibold text-emerald-950">
            Independent Verification
          </h2>

          <label className="block space-y-2 text-sm">
            <span>Verification Remarks</span>

            <textarea
              value={comment}
              onChange={(e) =>
                setComment(e.target.value)
              }
              rows={3}
              className="w-full rounded-lg border p-3"
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={processing}
              onClick={() =>
                void performAction('request-changes')
              }
              className="rounded-lg border px-5 py-3 text-sm font-semibold text-amber-700 disabled:opacity-50"
            >
              Request Changes
            </button>

            <button
              type="button"
              disabled={processing}
              onClick={() =>
                void performAction('confirm')
              }
              className="rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              Confirm GRN
            </button>
          </div>

          <p className="text-xs text-gray-500">
            The backend must verify the user's role and
            prevent the creator from independently confirming
            their own GRN.
          </p>
        </section>
      )}

      {/* Bottom Actions */}
      <div className="flex justify-end gap-3 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg border px-5 py-3 text-sm"
        >
          Print GRN
        </button>

        <Link
          to="/dashboard/purchasing/verification"
          className="rounded-lg bg-emerald-700 px-5 py-3 text-sm text-white"
        >
          Back to GRN Verification
        </Link>
      </div>
    </div>
  );
};

export default GrnDetailsPage;
