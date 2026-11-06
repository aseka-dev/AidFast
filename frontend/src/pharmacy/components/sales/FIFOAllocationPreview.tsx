
import { mockBatches, type MockBatch } from "./mockData";

type Props = {
  medicine: string;
  quantity: number;
};

type BatchAllocation = MockBatch & { allocated: number };

export default function FIFOAllocationPreview({
  medicine,
  quantity,
}: Props) {
  if (!medicine || quantity <= 0 || !Number.isInteger(quantity)) {
    return null;
  }

  const today = new Date();

  const eligibleBatches: MockBatch[] = mockBatches
    .filter(
      (batch: MockBatch) =>
        batch.medicine === medicine &&
        batch.status === "AVAILABLE" &&
        batch.quantityAvailable > 0 &&
        new Date(`${batch.expiryDate}T23:59:59`) >= today
    )
    .sort(
      (a: MockBatch, b: MockBatch) =>
        a.receivedDate.localeCompare(b.receivedDate) ||
        a.batchId.localeCompare(b.batchId)
    );

  const allocations: BatchAllocation[] = eligibleBatches
    .map((batch: MockBatch, index: number) => {
      const usedBefore = eligibleBatches
        .slice(0, index)
        .reduce((total: number, previous: MockBatch) => {
          return total + previous.quantityAvailable;
        }, 0);

      const allocated = Math.min(
        batch.quantityAvailable,
        Math.max(0, quantity - usedBefore)
      );

      return {
        ...batch,
        allocated,
      };
    })
    .filter((batch): batch is BatchAllocation => batch.allocated > 0);

  const totalAllocated = allocations.reduce(
    (total: number, batch: BatchAllocation) => total + batch.allocated,
    0
  );

  const remaining = quantity - totalAllocated;

  return (
    <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
      <h3 className="text-lg font-semibold text-emerald-900">
        FIFO Batch Allocation Preview
      </h3>

      <p className="mt-1 text-sm text-gray-600">
        Medicine: {medicine} | Requested: {quantity}
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-emerald-200">
              <th className="p-3">Batch</th>
              <th className="p-3">Received Date</th>
              <th className="p-3">Available</th>
              <th className="p-3">Allocated</th>
            </tr>
          </thead>

          <tbody>
            {allocations.map((batch) => (
              <tr key={batch.batchId} className="border-b">
                <td className="p-3">{batch.batchId}</td>
                <td className="p-3">{batch.receivedDate}</td>
                <td className="p-3">{batch.quantityAvailable}</td>
                <td className="p-3 font-semibold">
                  {batch.allocated}
                </td>
              </tr>
            ))}

            {allocations.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="p-4 text-center text-gray-500"
                >
                  No eligible batches available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {remaining > 0 ? (
        <p className="mt-4 text-sm font-medium text-red-600">
          Insufficient stock! Short by {remaining} units.
        </p>
      ) : (
        <p className="mt-4 text-sm font-medium text-emerald-700">
          All {quantity} units can be allocated successfully.
        </p>
      )}

      <p className="mt-2 text-xs text-gray-500">
        Demo preview only. No actual stock is deducted.
      </p>
    </div>
  );
}
