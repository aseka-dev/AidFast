
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../context/useAuth';
import GrnItemTable from '../../components/grn/GrnItemTable';
import { calculateGrnTotal, type GrnItem } from '../../components/grn/grnUtils';

interface Supplier {
  _id: string;
  supplierName: string;
}

interface Medicine {
  _id: string;
  name: string;
}

type AuthSelection = {
  selectedPharmacyId?: string;
  selectedPharmacy?: { _id?: string; id?: string };
};

const API_BASE = (
  import.meta.env.VITE_API_URL || ''
).replace(/\/$/, '');

const NewGrnPage: React.FC = () => {
  const navigate = useNavigate();
  const auth = useAuth() as AuthSelection;

  const pharmacyId =
    auth.selectedPharmacyId ||
    auth.selectedPharmacy?._id ||
    auth.selectedPharmacy?.id;

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [items, setItems] = useState<GrnItem[]>([]);
  const [grnId, setGrnId] = useState<string | null>(null);

  const [form, setForm] = useState({
    grnNumber: '',
    supplierId: '',
    invoiceNumber: '',
    invoiceDate: '',
    receivedDate: '',
    purchaseOrderId: ''
  });

  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const root = pharmacyId
    ? `${API_BASE}/api/v1/pharmacies/${encodeURIComponent(pharmacyId)}`
    : '';

  const activeError = !root ? 'Please select a pharmacy before creating a GRN.' : error;

  useEffect(() => {
    if (!root) {
      return;
    }

    let cancelled = false;

    const loadOptions = async () => {
      try {
        const [supplierResponse, medicineResponse] = await Promise.all([
          fetch(`${root}/suppliers`, { credentials: 'include' }),
          fetch(`${root}/medicines`, { credentials: 'include' })
        ]);

        if (!supplierResponse.ok || !medicineResponse.ok) {
          throw new Error(
            'Unable to load suppliers or medicines. Check the backend API.'
          );
        }

        const supplierResult = await supplierResponse.json();
        const medicineResult = await medicineResponse.json();

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

        if (!Array.isArray(supplierRecords) ||
            !Array.isArray(medicineRecords)) {
          throw new Error('Unexpected API response format.');
        }

        if (!cancelled) {
          setSuppliers(supplierRecords);
          setMedicines(medicineRecords);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Unable to load data.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadOptions();
    return () => { cancelled = true; };
  }, [root]);

  const updateForm = (field: keyof typeof form, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const validate = () => {
    if (!form.grnNumber.trim()) return 'GRN number is required.';
    if (!form.supplierId) return 'Select a distributor.';
    if (!form.invoiceNumber.trim()) return 'Invoice number is required.';
    if (!form.receivedDate) return 'Goods received date is required.';
    if (items.length === 0) return 'Add at least one medicine item.';

    for (const item of items) {
      if (!item.medicineId) return 'Select a medicine for every item.';
      if (!item.batchNumber.trim()) return 'Batch number is required.';
      if (!item.expiryDate) return 'Expiry date is required.';
      if (!Number.isInteger(item.receivedQuantity) ||
          item.receivedQuantity <= 0) {
        return 'Received quantity must be a positive whole number.';
      }
      if ([
        item.damagedQuantity,
        item.returnedQuantity,
        item.rejectedQuantity
      ].some((quantity) =>
        !Number.isInteger(quantity) || quantity < 0
      )) {
        return 'All quantities must be non-negative whole numbers.';
      }
      if (item.rejectedQuantity < (
        item.damagedQuantity + item.returnedQuantity
      )) {
        return 'Rejected quantity must include damaged and returned units.';
      }
      if (item.rejectedQuantity > item.receivedQuantity) {
        return 'Rejected quantity cannot exceed received quantity.';
      }
      if (!Number.isFinite(item.wholesalePrice) ||
          item.wholesalePrice < 0) {
        return 'Enter a valid wholesale price.';
      }
    }

    return '';
  };

  const saveDraft = async (): Promise<string | null> => {
    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return null;
    }

    if (!root) {
      setError('No pharmacy selected.');
      return null;
    }

    setSaving(true);
    setError('');
    setNotice('');

    const payload = {
      ...form,
      purchaseOrderId: form.purchaseOrderId || undefined,
      invoiceDate: form.invoiceDate || undefined,
      status: 'DRAFT',
      totalAmount: calculateGrnTotal(items),
      items: items.map((item) => ({
        ...item,
        acceptedQuantity:
          item.receivedQuantity - item.rejectedQuantity,
        lineTotal:
          (item.receivedQuantity - item.rejectedQuantity) *
          item.wholesalePrice
      }))
    };

    try {
      const response = await fetch(
        grnId ? `${root}/grns/${grnId}` : `${root}/grns`,
        {
          method: grnId ? 'PUT' : 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        throw new Error(
          response.status === 501
            ? 'GRN draft API is not implemented yet.'
            : `Unable to save GRN (${response.status}).`
        );
      }

      const result = await response.json();
      const saved = result.data?.grn || result.data || result;
      const savedId = saved._id || saved.id || grnId;

      if (!savedId) {
        throw new Error(
          'GRN was returned without an ID. Cannot safely submit it.'
        );
      }

      setGrnId(savedId);
      setNotice('GRN draft saved successfully.');
      return savedId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.');
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
      const response = await fetch(`${root}/grns/${id}/submit`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(
          response.status === 501
            ? 'GRN submission API is not implemented yet.'
            : `Unable to submit GRN (${response.status}).`
        );
      }

      setNotice('GRN submitted for independent verification.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed.');
    } finally {
      setSaving(false);
    }
  };

  const fieldClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-600';

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
          New Goods Received Note
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

      {loading && <p className="text-sm">Loading form data...</p>}

      {activeError && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {activeError}
        </div>
      )}

      {notice && (
        <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          {notice}
        </div>
      )}

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
            <span className="font-medium">GRN Number *</span>
            <input
              className={fieldClass}
              value={form.grnNumber}
              onChange={(e) =>
                updateForm('grnNumber', e.target.value)
              }
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium">Distributor *</span>
            <select
              className={fieldClass}
              value={form.supplierId}
              onChange={(e) =>
                updateForm('supplierId', e.target.value)
              }
            >
              <option value="">Select distributor</option>
              {suppliers.map((supplier) => (
                <option key={supplier._id} value={supplier._id}>
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
                updateForm('invoiceNumber', e.target.value)
              }
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium">Invoice Date</span>
            <input
              type="date"
              className={fieldClass}
              value={form.invoiceDate}
              onChange={(e) =>
                updateForm('invoiceDate', e.target.value)
              }
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium">Goods Received Date *</span>
            <input
              type="date"
              className={fieldClass}
              value={form.receivedDate}
              onChange={(e) =>
                updateForm('receivedDate', e.target.value)
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
                updateForm('purchaseOrderId', e.target.value)
              }
            />
          </label>
        </div>
      </section>

      <GrnItemTable
        items={items}
        medicines={medicines}
        onChange={setItems}
      />

      <div className="flex flex-wrap items-center justify-end gap-3 rounded-xl border bg-white p-4">
        <button
          type="button"
          onClick={() => navigate('/dashboard/purchasing')}
          className="rounded-lg px-4 py-3 text-sm font-semibold text-emerald-700"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={() => void saveDraft()}
          disabled={saving || loading || !pharmacyId}
          className="rounded-lg border border-emerald-200 px-5 py-3 text-sm font-semibold text-emerald-800 disabled:opacity-50"
        >
          Save Draft
        </button>

        <button
          type="button"
          onClick={() => void submitForVerification()}
          disabled={saving || loading || !pharmacyId}
          className="rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? 'Processing...' : 'Submit for Verification'}
        </button>
      </div>
    </div>
  );
};

export default NewGrnPage;
