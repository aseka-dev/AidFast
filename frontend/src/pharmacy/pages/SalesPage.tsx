
import React, {
  useCallback,
  useEffect,
  useState
} from "react";

import useAuth from "../../shared/context/useAuth";

import {
  createDraftSale,
  getSaleHistory
} from "../services/salesApi";


import FIFOAllocationPreview from "../components/FIFOAllocationPreview";


import type {
  DraftSaleItem,
  SaleRecord
} from "../services/salesApi";

type FormItem = DraftSaleItem & {
  id: string;
  medicineName: string;
};

const demoMedicines = [
  {
    id: "replace-with-real-medicine-id-1",
    name: "Paracetamol 500mg",
    price: 15
  },
  {
    id: "replace-with-real-medicine-id-2",
    name: "Amoxicillin 500mg",
    price: 45
  },
  {
    id: "replace-with-real-medicine-id-3",
    name: "Salbutamol Inhaler 100mcg",
    price: 850
  }
];

// Replace demoMedicines with M2's catalog API
// before testing real database persistence.

const SalesPage: React.FC = () => {
  const { token, currentPharmacy } = useAuth();

  const pharmacyId = currentPharmacy?.pharmacyId;

  const [medicineId, setMedicineId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [items, setItems] = useState<FormItem[]>([]);
  const [history, setHistory] = useState<SaleRecord[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const selectedMedicine = demoMedicines.find(
    (medicine) => medicine.id === medicineId
  );

  const loadHistory = useCallback(async () => {
    if (!pharmacyId || !token) return;

    try {
      const sales = await getSaleHistory(pharmacyId, token);
      setHistory(sales);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load sale history"
      );
    }
  }, [pharmacyId, token]);


useEffect(() => {
  if (!pharmacyId || !token) return;

  let cancelled = false;

  const fetchHistory = async () => {
    try {
      const sales = await getSaleHistory(pharmacyId, token);

      if (!cancelled) {
        setHistory(sales);
      }
    } catch (err) {
      if (!cancelled) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load sale history"
        );
      }
    }
  };

  void fetchHistory();

  return () => {
    cancelled = true;
  };
}, [pharmacyId, token]);


  const addItem = () => {
    setError("");

    if (!selectedMedicine) {
      setError("Please select a medicine");
      return;
    }

    if (!Number.isSafeInteger(quantity) || quantity <= 0) {
      setError("Quantity must be a positive whole number");
      return;
    }

    if (selectedMedicine.price <= 0) {
      setError("Invalid medicine price");
      return;
    }

    setItems((previous) => [
      ...previous,
      {
        id: crypto.randomUUID(),
        medicineId: selectedMedicine.id,
        medicineName: selectedMedicine.name,
        quantity,
        unitPrice: selectedMedicine.price
      }
    ]);

    setMedicineId("");
    setQuantity(1);
  };


{pharmacyId && token && medicineId && quantity > 0 && (
  <FIFOAllocationPreview
    pharmacyId={pharmacyId}
    token={token}
    medicineId={medicineId}
    quantity={quantity}
  />
)}


  const removeItem = (id: string) => {
    setItems((previous) =>
      previous.filter((item) => item.id !== id)
    );
  };

  const total = items.reduce(
    (sum, item) =>
      sum + item.quantity * item.unitPrice,
    0
  );

  const saveDraft = async () => {
    if (!pharmacyId || !token) {
      setError("Please sign in and select a pharmacy");
      return;
    }

    if (items.length === 0) {
      setError("Add at least one medicine");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const sale = await createDraftSale(
        pharmacyId,
        token,
        items.map(({ medicineId, quantity, unitPrice }) => ({
          medicineId,
          quantity,
          unitPrice
        }))
      );

      setMessage(`Draft ${sale.saleNumber} saved successfully`);
      setItems([]);
      await loadHistory();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save draft"
      );
    } finally {
      setSaving(false);
    }
  };

  const amount = (
    value: SaleRecord["totalAmount"]
  ): string => {
    const number = typeof value === "string"
      ? Number(value)
      : Number(value.$numberDecimal);

    return number.toFixed(2);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-emerald-900">
          Sales / Stock Issues
        </h1>
        <p className="text-gray-500">
          Create draft sales and view transaction history
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div role="status" className="rounded-lg bg-green-50 p-4 text-green-700">
          {message}
        </div>
      )}

      <div className="rounded-xl border bg-white p-6 space-y-5">
        <h2 className="text-lg font-semibold">
          New Sale Draft
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block mb-2 text-sm">
              Medicine
            </label>
            <select
              value={medicineId}
              onChange={(e) => setMedicineId(e.target.value)}
              className="w-full rounded-lg border p-3"
            >
              <option value="">Select medicine</option>
              {demoMedicines.map((medicine) => (
                <option key={medicine.id} value={medicine.id}>
                  {medicine.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 text-sm">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm">
              Unit Price (LKR)
            </label>
            <input
              type="number"
              readOnly
              value={selectedMedicine?.price ?? 0}
              className="w-full rounded-lg border bg-gray-50 p-3"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={addItem}
          className="rounded-lg bg-emerald-700 px-5 py-3 text-white"
        >
          + Add Item
        </button>
      </div>

      <div className="rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">
          Sale Items
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-green-50 text-emerald-900">
              <tr>
                <th className="p-3">Medicine</th>
                <th className="p-3">Quantity</th>
                <th className="p-3">Unit Price</th>
                <th className="p-3">Subtotal</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="p-3">{item.medicineName}</td>
                  <td className="p-3">{item.quantity}</td>
                  <td className="p-3">
                    {item.unitPrice.toFixed(2)}
                  </td>
                  <td className="p-3">
                    {(item.quantity * item.unitPrice).toFixed(2)}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-600"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-400">
                    No items added
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 text-right">
          <p className="text-gray-500">Total Amount</p>
          <h2 className="text-2xl font-bold text-emerald-800">
            LKR {total.toFixed(2)}
          </h2>

          <button
            onClick={saveDraft}
            disabled={saving || items.length === 0}
            className="mt-4 rounded-lg bg-emerald-700 px-6 py-3 text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save as Draft"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">
          Sale History
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-green-50 text-emerald-900">
              <tr>
                <th className="p-3">Sale Number</th>
                <th className="p-3">Date</th>
                <th className="p-3">Total (LKR)</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((sale) => (
                <tr key={sale._id} className="border-b">
                  <td className="p-3">{sale.saleNumber}</td>
                  <td className="p-3">
                    {new Date(sale.saleDate).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    {amount(sale.totalAmount)}
                  </td>
                  <td className="p-3">{sale.status}</td>
                </tr>
              ))}

              {history.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-gray-400">
                    No saved sales found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesPage;
