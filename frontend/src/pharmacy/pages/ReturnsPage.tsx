
import { useState } from "react";

type ReturnRecord = {
  id: number;
  saleId: string;
  medicine: string;
  quantity: number;
  reason: string;
  condition: string;
};

const medicines = [
  "Paracetamol 500mg",
  "Amoxicillin 500mg",
  "Salbutamol Inhaler 100mcg",
];

export default function ReturnsPage() {
  const [saleId, setSaleId] = useState("");
  const [medicine, setMedicine] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const [condition, setCondition] = useState("");
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [error, setError] = useState("");

  const handleAddReturn = () => {
    if (!saleId.trim() || !medicine || !reason || !condition) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setError("Please enter a valid return quantity.");
      return;
    }

    const newReturn: ReturnRecord = {
      id: Date.now(),
      saleId: saleId.trim(),
      medicine,
      quantity,
      reason,
      condition,
    };

    setReturns((previous) => [...previous, newReturn]);
    setError("");

    setSaleId("");
    setMedicine("");
    setQuantity(1);
    setReason("");
    setCondition("");
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Medicine Returns
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Record and review medicines returned by customers.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold text-gray-800">
          New Return
        </h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Sale ID *
            </label>
            <input
              type="text"
              value={saleId}
              onChange={(e) => setSaleId(e.target.value)}
              placeholder="Enter original sale ID"
              className="w-full rounded-lg border border-gray-300 p-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Medicine *
            </label>
            <select
              value={medicine}
              onChange={(e) => setMedicine(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-3"
            >
              <option value="">Select medicine</option>
              {medicines.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Return Quantity *
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 p-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Return Reason *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-3"
            >
              <option value="">Select reason</option>
              <option value="Wrong medicine">Wrong medicine</option>
              <option value="Damaged packaging">
                Damaged packaging
              </option>
              <option value="Expired medicine">
                Expired medicine
              </option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Medicine Condition *
            </label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-3"
            >
              <option value="">Select condition</option>
              <option value="Unopened">Unopened</option>
              <option value="Opened">Opened</option>
              <option value="Damaged">Damaged</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
        </div>

        {error && (
          <p className="mt-4 text-sm font-medium text-red-600">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleAddReturn}
            className="rounded-lg bg-emerald-700 px-6 py-3 font-medium text-white hover:bg-emerald-800"
          >
            Add Return
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          Return Records (Demo)
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3">Sale ID</th>
                <th className="p-3">Medicine</th>
                <th className="p-3">Quantity</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Condition</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>

            <tbody>
              {returns.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="p-3">{item.saleId}</td>
                  <td className="p-3">{item.medicine}</td>
                  <td className="p-3">{item.quantity}</td>
                  <td className="p-3">{item.reason}</td>
                  <td className="p-3">{item.condition}</td>
                  <td className="p-3">
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                      Pending Review
                    </span>
                  </td>
                </tr>
              ))}

              {returns.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="p-6 text-center text-gray-500"
                  >
                    No returns recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs stext-gray-500">
          Demo only. Returns are not saved to the database,
          verified against sales, or added back to stock.
          Returned medicines require review before any
          inventory adjustment.
        </p>
      </div>
    </div>
  );
}
