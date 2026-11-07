
import React, { useState } from "react";
import FIFOAllocationPreview from "../components/sales/FIFOAllocationPreview";
import { mockBatches } from "../components/sales/mockData";

type SaleItem = {
  id: number;
  medicine: string;
  quantity: number;
  unitPrice: number;
};

const medicines = [
  { name: "Paracetamol 500mg", price: 15 },
  { name: "Amoxicillin 500mg", price: 45 },
  { name: "Salbutamol Inhaler 100mcg", price: 850 },
];

const SalesPage: React.FC = () => {
  const [medicine, setMedicine] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [error, setError] = useState("");

  const selectedMedicine = medicines.find(
    (item) => item.name === medicine
  );

  const unitPrice = selectedMedicine?.price ?? 0;

  // Calculate available stock from eligible mock batches
  const getAvailableStock = (medicineName: string) => {
    const today = new Date();

    return mockBatches
      .filter(
        (batch) =>
          batch.medicine === medicineName &&
          batch.status === "AVAILABLE" &&
          batch.quantityAvailable > 0 &&
          new Date(batch.expiryDate + "T23:59:59") >= today
      )
      .reduce(
        (total, batch) => total + batch.quantityAvailable,
        0
      );
  };

  // Add an item only when all validations pass
  const addItem = () => {
    setError("");

    if (!medicine) {
      setError("Please select a medicine.");
      return;
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setError("Quantity must be a positive whole number.");
      return;
    }

    const availableStock = getAvailableStock(medicine);

    // Include items already added to this sale
    const alreadyAdded = items
      .filter((item) => item.medicine === medicine)
      .reduce((total, item) => total + item.quantity, 0);

    if (quantity + alreadyAdded > availableStock) {
      setError(
        `Insufficient stock. Only ${
          availableStock - alreadyAdded
        } units are remaining for this sale.`
      );
      return;
    }

    setItems((previous) => [
      ...previous,
      {
        id: Date.now() + Math.random(),
        medicine,
        quantity,
        unitPrice,
      },
    ]);

    setMedicine("");
    setQuantity(1);
  };

  // Remove a sale item
  const removeItem = (id: number) => {
    setItems((previous) =>
      previous.filter((item) => item.id !== id)
    );
    setError("");
  };

  // Automatically calculate total amount
  const total = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#064e3b]">
          Sales / Stock Issues
        </h1>
        <p className="mt-1 text-gray-500">
          Create sales and manage medicine stock issues.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-5 text-lg font-semibold">
          New Sale
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Medicine
            </label>
            <select
              className="w-full rounded-lg border p-3"
              value={medicine}
              onChange={(e) => {
                setMedicine(e.target.value);
                setError("");
              }}
            >
              <option value="">Select Medicine</option>
              {medicines.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              step="1"
              className="w-full rounded-lg border p-3"
              value={quantity}
              onChange={(e) => {
                setQuantity(Number(e.target.value));
                setError("");
              }}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Unit Price (LKR)
            </label>
            <input
              type="number"
              value={unitPrice}
              readOnly
              className="w-full rounded-lg border bg-gray-50 p-3"
            />
          </div>
        </div>

        {error && (
          <p className="mt-4 text-sm font-medium text-red-600">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={addItem}
          className="mt-5 rounded-lg bg-[#065f46] px-6 py-3 text-white hover:bg-[#064e3b]"
        >
          + Add Item
        </button>

        <FIFOAllocationPreview
          medicine={medicine}
          quantity={quantity}
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">
          Sale Items
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#f0fdf4] text-[#064e3b]">
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
                  <td className="p-3">{item.medicine}</td>
                  <td className="p-3">{item.quantity}</td>
                  <td className="p-3">
                    {item.unitPrice.toFixed(2)}
                  </td>
                  <td className="p-3">
                    {(item.quantity * item.unitPrice).toFixed(2)}
                  </td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="p-6 text-center text-gray-400"
                  >
                    No sale items added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-end">
          <div className="text-right">
            <p className="text-gray-500">Total Amount</p>
            <h2 className="text-2xl font-bold text-[#065f46]">
              LKR {total.toFixed(2)}
            </h2>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            disabled
            title="Sale completion requires backend integration"
            className="cursor-not-allowed rounded-lg bg-gray-400 px-6 py-3 text-white"
          >
            Complete Sale (Coming Soon)
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalesPage;
