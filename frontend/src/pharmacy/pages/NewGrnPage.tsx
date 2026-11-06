
import React, { useEffect, useState } from 'react';

import {
  Link,
  useNavigate,
  useParams
} from 'react-router-dom';

import useAuth from '../../shared/context/useAuth';
import GrnItemTable from '../components/grn/GrnItemTable';

import {
  calculateGrnTotal,
  type GrnItem
} from '../components/grn/grnUtils';

interface Supplier {
  _id: string;
  supplierName: string;
}

interface Medicine {
  _id: string;
  name: string;
}

interface GrnForm {
  grnNumber: string;
  supplierId: string;
  invoiceNumber: string;
  invoiceDate: string;
  receivedDate: string;
  purchaseOrderId: string;
}

interface ExistingGrn {
  _id: string;
  status: string;
  grnNumber: string;
  supplierId: string | { _id: string };
  invoiceNumber: string;
  invoiceDate?: string;
  receivedDate: string;
  purchaseOrderId?: string | { _id: string };
  items?: GrnItem[];
}

type AuthSelection = {
  selectedPharmacyId?: string;
  selectedPharmacy?: {
    _id?: string;
    id?: string;
  };
};

const API_BASE = (
  import.meta.env.VITE_API_URL || ''
).replace(/\/$/, '');

const emptyForm: GrnForm = {
  grnNumber: '',
  supplierId: '',
  invoiceNumber: '',
  invoiceDate: '',
  receivedDate: '',
  purchaseOrderId: ''
};

const dateInput = (value?: string) =>
  value ? value.slice(0, 10) : '';

const referenceId = (
  value?: string | { _id: string }
): string => {
  if (!value) return '';
  return typeof value === 'string'
    ? value
    : value._id;
};

const NewGrnPage: React.FC = () => {
  const navigate = useNavigate();

  const { grnId: editGrnId } =
    useParams<{ grnId: string }>();

  const isEditMode = Boolean(editGrnId);
  const auth = useAuth() as AuthSelection;

  const pharmacyId =
    auth.selectedPharmacyId ||
    auth.selectedPharmacy?._id ||
    auth.selectedPharmacy?.id;

  const root = pharmacyId
    ? `${API_BASE}/api/v1/pharmacies/${encodeURIComponent(pharmacyId)}`
    : '';

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [items, setItems] = useState<GrnItem[]>([]);

  const [form, setForm] = useState<GrnForm>(emptyForm);
  const [savedGrnId, setSavedGrnId] =
    useState<string | null>(null);

  const [recordStatus, setRecordStatus] =
    useState('DRAFT');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const canEdit =
    recordStatus === 'DRAFT' ||
    recordStatus === 'CHANGES_REQUESTED';

  const activeId = editGrnId || savedGrnId;

  useEffect(() => {
    if (!root) return;

    const controller = new AbortController();

    const loadData = async () => {
      try {
        const requests: Promise<Response>[] = [
          fetch(`${root}/suppliers`, {
            credentials: 'include',
            signal: controller.signal
          }),
          fetch(`${root}/medicines`, {
            credentials: 'include',
            signal: controller.signal
          })
        ];

        if (editGrnId) {
          requests.push(
            fetch(
              `${root}/grns/${encodeURIComponent(editGrnId)}`,
              {
                credentials: 'include',
                signal: controller.signal
              }
            )
          );
        }

        const responses = await Promise.all(requests);

        for (const response of responses) {
          if (!response.ok) {
            throw new Error(
              response.status === 501
                ? 'A required backend API is not implemented yet.'
                : `Unable to load data (${response.status}).`
            );
          }
        }

        const results = await Promise.all(
          responses.map((response) => response.json())
        );

        const supplierResult = results[0];
        const medicineResult = results[1];

        const supplierRecords = Array.isArray(supplierResult)
          ? supplierResult
          : Array.isArray(supplierResult.data)
            ? supplierResult.data
            : supplierResult.data?.suppliers;

        const medicineRecords = Array.isArray(medicineResult)
          ? medicineResult
          : Array.isArray(medicineResult.data)
            ? medicineResult.data
            : medicineResult.data?.medicines;

        if (
          !Array.isArray(supplierRecords) ||
          !Array.isArray(medicineRecords)
        ) {
          throw new Error(
            'Supplier or medicine API returned an unexpected format.'
          );
        }

        if (controller.signal.aborted) return;

        setSuppliers(supplierRecords);
        setMedicines(medicineRecords);

        if (editGrnId) {
          const result = results[2];

          const existing: ExistingGrn =
            result.data?.grn || result.data || result;

          if (!existing?._id) {
            throw new Error(
              'GRN record was not returned.'
            );
          }

          if (!Array.isArray(existing.items)) {
            throw new Error(
              'GRN details API must return the associated items to edit this record.'
            );
          }

          setRecordStatus(existing.status);
          setSavedGrnId(existing._id);

          setForm({
            grnNumber: existing.grnNumber || '',
            supplierId: referenceId(
              existing.supplierId
            ),
            invoiceNumber:
              existing.invoiceNumber || '',
            invoiceDate: dateInput(
              existing.invoiceDate
            ),
            receivedDate: dateInput(
              existing.receivedDate
            ),
            purchaseOrderId: referenceId(
              existing.purchaseOrderId
            )
          });

          setItems(existing.items);
        } else {
          setRecordStatus('DRAFT');
          setSavedGrnId(null);
          setForm(emptyForm);
          setItems([]);
        }

        setError('');
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load GRN.'
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => controller.abort();
  }, [root, editGrnId]);

  const updateForm = (
    field: keyof GrnForm,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value
    }));
  };

  const validate = (): string => {
    if (!form.grnNumber.trim()) {
      return 'GRN number is required.';
    }

    if (!form.supplierId) {
      return 'Please select a distributor.';
    }

    if (!form.invoiceNumber.trim()) {
      return 'Distributor invoice number is required.';
    }

    if (!form.receivedDate) {
      return 'Goods received date is required.';
    }

    if (items.length === 0) {
      return 'Please add at least one medicine item.';
    }

    for (const item of items) {
      if (!item.medicineId) {
        return 'Please select a medicine for every item.';
      }

      if (!item.batchNumber.trim()) {
        return 'Batch number is required.';
      }

      if (!item.expiryDate) {
        return 'Expiry date is required.';
      }

      if (
        !Number.isInteger(item.receivedQuantity) ||
        item.receivedQuantity <= 0
      ) {
        return 'Received quantity must be a positive whole number.';
      }

      const quantities = [
        item.damagedQuantity,
        item.returnedQuantity,
        item.rejectedQuantity
      ];

      if (
        quantities.some(
          (quantity) =>
            !Number.isInteger(quantity) ||
            quantity < 0
        )
      ) {
        return 'Quantities must be non-negative whole numbers.';
      }

      if (
        item.rejectedQuantity <
        item.damagedQuantity + item.returnedQuantity
      ) {
        return 'Rejected quantity must include damaged and returned units.';
      }

      if (
        item.rejectedQuantity >
        item.receivedQuantity
      ) {
        return 'Rejected quantity cannot exceed received quantity.';
      }

      if (
        !Number.isFinite(item.wholesalePrice) ||
        item.wholesalePrice < 0
      ) {
        return 'Please enter a valid wholesale price.';
      }
    }

    return '';
  };

  const saveDraft = async (): Promise<string | null> => {
    if (!root || !canEdit || loading) return null;

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return null;
    }

    setSaving(true);
    setError('');
    setNotice('');

    const payload = {
      ...form,
      purchaseOrderId:
        form.purchaseOrderId || undefined,
      invoiceDate:
        form.invoiceDate || undefined,
      totalAmount: calculateGrnTotal(items),
      items: items.map((item) => ({
        ...item,
        acceptedQuantity:
          item.receivedQuantity -
          item.rejectedQuantity,
        lineTotal:
          (
            item.receivedQuantity -
            item.rejectedQuantity
          ) * item.wholesalePrice
      }))
    };

    try {
      const url = activeId
        ? `${root}/grns/${encodeURIComponent(activeId)}`
        : `${root}/grns`;

      const response = await fetch(url, {
        method: activeId ? 'PUT' : 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(
          response.status === 501
            ? 'GRN saving API is not implemented yet.'
            : `Unable to save GRN (${response.status}).`
        );
      }

      const result = await response.json();
      const saved =
        result.data?.grn || result.data || result;

      const id =
        saved?._id || saved?.id || activeId;

      if (!id) {
        throw new Error(
          'Saved GRN ID was not returned.'
        );
      }

      setSavedGrnId(id);
      setNotice('GRN draft saved successfully.');

      return id;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to save GRN.'
      );

      return null;
    } finally {
      setSaving(false);
    }
  };

  const submitForVerification = async () => {
    const id = await saveDraft();

    if (!id || !root) return;

    setSaving(true);
    setError('');

    try {
      const response = await fetch(
        `${root}/grns/${encodeURIComponent(id)}/submit`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(
          response.status === 501
            ? 'GRN submission API is not implemented yet.'
            : `Unable to submit GRN (${response.status}).`
        );
      }

      setRecordStatus('PENDING_VERIFICATION');

      navigate(
        '/dashboard/purchasing/verification'
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Submission failed.'
      );
    } finally {
      setSaving(false);
    }
  };

  const fieldClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-600 disabled:bg-gray-100';

  return (
    <div className="space-y-6 p-6 pb-28">
      <Link
        to="/dashboard/purchasing"
        className="text-sm font-semibold text-emerald-700"
      >
        ← Back to GRN Register
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-emerald-950">
          {isEditMode
            ? 'Edit Goods Received Note'
            : 'New Goods Received Note'}
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Prepare received goods for independent verification.
          Draft and submitted quantities do not update inventory.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-emerald-100 bg-gray-50 p-4 text-center text-xs text-gray-500">
        <span className="font-semibold text-emerald-700">
          Goods Received
        </span>

        {' → Draft GRN → Submit for Verification → '}
        Independent Verification → Confirmed GRN → Inventory Update
      </div>

      {loading && root && (
        <p className="text-sm text-gray-500">
          Loading GRN information...
        </p>
      )}

      {!root && (
        <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
          Please select a pharmacy.
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          {notice}
        </div>
      )}

      {isEditMode && !canEdit && !loading && (
        <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
          This GRN cannot be edited because its current status is{' '}
          {recordStatus}.
        </div>
      )}

      <fieldset disabled={loading || !canEdit || !root}>
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-5 border-b pb-4">
            <h2 className="text-lg font-semibold text-emerald-950">
              General Information
            </h2>

            <p className="text-sm text-gray-500">
              Distributor invoice and receipt references for this GRN.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium">
                GRN Number *
              </span>

              <input
                className={fieldClass}
                value={form.grnNumber}
                onChange={(e) =>
                  updateForm(
                    'grnNumber',
                    e.target.value
                  )
                }
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium">
                Distributor *
              </span>

              <select
                className={fieldClass}
                value={form.supplierId}
                onChange={(e) =>
                  updateForm(
                    'supplierId',
                    e.target.value
                  )
                }
              >
                <option value="">
                  Select distributor
                </option>

                {suppliers.map((supplier) => (
                  <option
                    key={supplier._id}
                    value={supplier._id}
                  >
                    {supplier.supplierName}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium">
                Distributor Invoice Number *
              </span>

              <input
                className={fieldClass}
                value={form.invoiceNumber}
                onChange={(e) =>
                  updateForm(
                    'invoiceNumber',
                    e.target.value
                  )
                }
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium">
                Invoice Date
              </span>

              <input
                type="date"
                className={fieldClass}
                value={form.invoiceDate}
                onChange={(e) =>
                  updateForm(
                    'invoiceDate',
                    e.target.value
                  )
                }
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium">
                Goods Received Date *
              </span>

              <input
                type="date"
                className={fieldClass}
                value={form.receivedDate}
                onChange={(e) =>
                  updateForm(
                    'receivedDate',
                    e.target.value
                  )
                }
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium">
                Purchase Order Reference (Optional)
              </span>

              <input
                className={fieldClass}
                value={form.purchaseOrderId}
                onChange={(e) =>
                  updateForm(
                    'purchaseOrderId',
                    e.target.value
                  )
                }
              />
            </label>
          </div>
        </section>

        <div className="mt-6">
          <GrnItemTable
            items={items}
            medicines={medicines}
            onChange={setItems}
          />
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center justify-end gap-3 rounded-xl border bg-white p-4">
        <button
          type="button"
          onClick={() =>
            navigate(
              '/dashboard/purchasing/verification'
            )
          }
          className="rounded-lg px-4 py-3 text-sm font-semibold text-emerald-700"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={() => void saveDraft()}
          disabled={
            saving ||
            loading ||
            !root ||
            !canEdit
          }
          className="rounded-lg border border-emerald-200 px-5 py-3 text-sm font-semibold text-emerald-800 disabled:opacity-50"
        >
          Save Draft
        </button>

        <button
          type="button"
          onClick={() =>
            void submitForVerification()
          }
          disabled={
            saving ||
            loading ||
            !root ||
            !canEdit
          }
          className="rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving
            ? 'Processing...'
            : 'Submit for Verification'}
        </button>
      </div>
    </div>
  );
};

export default NewGrnPage;
