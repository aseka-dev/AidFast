
import React, { useState } from "react";

// TODO: The FIFO allocation preview component is not yet implemented in this project.
// Prevent build breakage by rendering nothing until the component is available.
const FIFOAllocationPreview: React.FC<{ medicine: string; quantity: number }> = () => null;

type SaleItem = {
  id: number;
  medicine: string;
  quantity: number;
  unitPrice: number;
};

const SalesPage: React.FC = () => {
  const [medicine, setMedicine] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [items, setItems] = useState<SaleItem[]>([]);

  const medicines = [
    { name: "Paracetamol 500mg", price: 15 },
    { name: "Amoxicillin 500mg", price: 45 },
    { name: "Salbutamol Inhaler 100mcg", price: 850 },
  ];

  const addItem = () => {
    if (!medicine || quantity <= 0 || unitPrice < 0) {
      alert("Please enter valid medicine details.");
      return;
    }

    setItems([
      ...items,
      {
        id: Date.now(),
        medicine,
        quantity,
        unitPrice,
      },
    ]);

    setMedicine("");
    setQuantity(1);
    setUnitPrice(0);
  };

  const removeItem = (id: number) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const total = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#064e3b]">
          Sales / Stock Issues
        </h1>
        <p className="text-gray-500 mt-1">
          Create sales and manage medicine stock issues.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-5">
          New Sale
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Medicine
            </label>
            <select
              className="w-full border rounded-lg p-3"
              value={medicine}
              onChange={(e) => {
                const selected = medicines.find(
                  (m) => m.name === e.target.value
                );
                setMedicine(e.target.value);
                setUnitPrice(selected?.price ?? 0);
              }}
            >
              <option value="">Select Medicine</option>
              {medicines.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              step="1"
              className="w-full border rounded-lg p-3"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Unit Price (LKR)
            </label>
            <input
              type="number"
              min="0"
              className="w-full border rounded-lg p-3"
              value={unitPrice}
              readOnly
            />
          </div>
        </div>

        <button
          onClick={addItem}
          className="mt-5 bg-[#065f46] text-white px-6 py-3 rounded-lg hover:bg-[#064e3b]"
        >
          + Add Item
        </button>

        <FIFOAllocationPreview
         medicine={medicine}
         quantity={quantity}
        />

      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">
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
                    className="text-center text-gray-400 p-6"
                  >
                    No sale items added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mt-6">
          <div className="text-right">
            <p className="text-gray-500">Total Amount</p>
            <h2 className="text-2xl font-bold text-[#065f46]">
              LKR {total.toFixed(2)}
            </h2>
          </div>
        </div>

        <div className="flex justify-end mt-5">
          <button
            disabled
            title="Sale completion will be enabled after backend integration"
            className="bg-gray-400 text-white px-6 py-3 rounded-lg cursor-not-allowed"
          >
            Complete Sale (Coming Soon)
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalesPage;
