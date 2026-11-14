
import { useState } from "react";

type ReturnStatus = "Pending Review" | "Approved" | "Rejected";

type ReturnDisposition =
  | "QUARANTINE"
  | "DAMAGED"
  | "RETURN_TO_SUPPLIER"
  | "RESTOCK_APPROVED";

type ReturnRecord = {
  id: number;
  saleId: string;
  medicine: string;
  quantity: number;
  reason: string;
  condition: string;
  status: ReturnStatus;
  disposition: ReturnDisposition | null;
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

  // Add a new customer return
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
      status: "Pending Review",
      disposition: null,
    };

    setReturns((previous) => [...previous, newReturn]);
    setError("");

    // Reset form
    setSaleId("");
    setMedicine("");
    setQuantity(1);
    setReason("");
    setCondition("");
  };

  // Review a pending return
  const handleReviewReturn = (
    id: number,
    status: "Approved" | "Rejected",
    disposition: ReturnDisposition | null = null
  ) => {
    setReturns((previous) =>
      previous.map((item) =>
        item.id === id && item.status === "Pending Review"
          ? {
              ...item,
              status,
              disposition:
                status === "Approved" ? disposition : null,
            }
          : item
      )
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Returns & Disposal
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Record and review returned medicines and manage
          their disposition.
        </p>
      </div>

      {/* New Return Form */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold text-gray-800">
          New Customer Return
        </h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Sale ID */}
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

          {/* Medicine */}
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

          {/* Quantity */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Return Quantity *
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) =>
                setQuantity(Number(e.target.value))
              }
              className="w-full rounded-lg border border-gray-300 p-3"
            />
          </div>

          {/* Reason */}
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
              <option value="Wrong medicine">
                Wrong medicine
              </option>
              <option value="Damaged packaging">
                Damaged packaging
              </option>
              <option value="Expired medicine">
                Expired medicine
              </option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Condition */}
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

        {/* Validation Error */}
        {error && (
          <p role="alert" className="mt-4 text-sm font-medium text-red-600">
            {error}
          </p>
        )}

        {/* Add Button */}
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

      {/* Return Records */}
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
                <th className="p-3">Disposition</th>
                <th className="p-3">Actions</th>
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

                  {/* Status Badge */}
                  <td className="p-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        item.status === "Approved"
                          ? "bg-green-100 text-green-800"
                          : item.status === "Rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>

                  {/* Disposition */}
                  <td className="p-3">
                    {item.disposition ?? "Not assigned"}
                  </td>

                  {/* Review Actions */}
                  <td className="p-3">
                    {item.status === "Pending Review" ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleReviewReturn(
                              item.id,
                              "Approved",
                              "QUARANTINE"
                            )
                          }
                          className="rounded bg-emerald-700 px-3 py-2 text-white hover:bg-emerald-800"
                        >
                          Approve
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleReviewReturn(
                              item.id,
                              "Rejected"
                            )
                          }
                          className="rounded bg-red-600 px-3 py-2 text-white hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400">
                        Reviewed
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              {returns.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="p-6 text-center text-gray-500"
                  >
                    No returns recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-gray-500">
          Demo only. Returns are stored in temporary frontend
          state. They are not verified against original sales,
          saved to the database, or added back to inventory.
          Approval assigns quarantine for future backend
          processing and does not change stock.
        </p>
      </div>
    </div>
  );
}
