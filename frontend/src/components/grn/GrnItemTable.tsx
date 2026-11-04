
import React from 'react';

export interface GrnItem {
  medicineId: string;
  batchNumber: string;
  expiryDate: string;
  receivedQuantity: number;
  damagedQuantity: number;
  returnedQuantity: number;
  rejectedQuantity: number;
  wholesalePrice: number;
}

interface Props {
  items: GrnItem[];
  medicines: { _id: string; name: string }[];
  onChange: (items: GrnItem[]) => void;
}

const emptyItem = (): GrnItem => ({
  medicineId: '',
  batchNumber: '',
  expiryDate: '',
  receivedQuantity: 0,
  damagedQuantity: 0,
  returnedQuantity: 0,
  rejectedQuantity: 0,
  wholesalePrice: 0
});

const accepted = (item: GrnItem) =>
  Math.max(0, item.receivedQuantity - item.rejectedQuantity);

export const calculateGrnTotal = (items: GrnItem[]) =>
  items.reduce(
    (sum, item) => sum + accepted(item) * item.wholesalePrice,
    0
  );

const GrnItemTable: React.FC<Props> = ({
  items,
  medicines,
  onChange
}) => {
  const updateItem = (
    index: number,
    field: keyof GrnItem,
    value: string
  ) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      [field]:
        field === 'medicineId' ||
        field === 'batchNumber' ||
        field === 'expiryDate'
          ? value
          : Number(value)
    };
    onChange(updated);
  };

  const addItem = () => onChange([...items, emptyItem()]);

  const removeItem = (index: number) =>
    onChange(items.filter((_, i) => i !== index));

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-emerald-950">
            Received Medicine Items
          </h2>
          <p className="text-sm text-gray-500">
            Record batch and quantity information.
          </p>
        </div>

        <button
          type="button"
          onClick={addItem}
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm text-white hover:bg-emerald-800"
        >
          + Add Item
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1150px] text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              {[
                'Medicine', 'Batch', 'Expiry',
                'Received', 'Damaged', 'Returned',
                'Rejected', 'Accepted',
                'Wholesale Price', 'Line Total', 'Action'
              ].map((heading) => (
                <th key={heading} className="p-3">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-t border-gray-100">
                <td className="p-2">
                  <select
                    aria-label="Medicine"
                    value={item.medicineId}
                    onChange={(e) =>
                      updateItem(index, 'medicineId', e.target.value)
                    }
                    className="w-44 rounded border p-2"
                  >
                    <option value="">Select medicine</option>
                    {medicines.map((medicine) => (
                      <option key={medicine._id} value={medicine._id}>
                        {medicine.name}
                      </option>
                    ))}
                  </select>
                </td>

                <td className="p-2">
                  <input
                    aria-label="Batch number"
                    value={item.batchNumber}
                    onChange={(e) =>
                      updateItem(index, 'batchNumber', e.target.value)
                    }
                    className="w-32 rounded border p-2"
                  />
                </td>

                <td className="p-2">
                  <input
                    aria-label="Expiry date"
                    type="date"
                    value={item.expiryDate}
                    onChange={(e) =>
                      updateItem(index, 'expiryDate', e.target.value)
                    }
                    className="rounded border p-2"
                  />
                </td>

                {([
                  'receivedQuantity',
                  'damagedQuantity',
                  'returnedQuantity',
                  'rejectedQuantity',
                  'wholesalePrice'
                ] as const).map((field) => (
                  <td key={field} className="p-2">
                    <input
                      aria-label={field}
                      type="number"
                      min="0"
                      step={field === 'wholesalePrice' ? '0.01' : '1'}
                      value={item[field]}
                      onChange={(e) =>
                        updateItem(index, field, e.target.value)
                      }
                      className="w-24 rounded border p-2"
                    />
                  </td>
                )).reduce<React.ReactNode[]>((cells, cell, i) => {
                  if (i === 4) {
                    cells.splice(
                      3,
                      0,
                      <td key="accepted" className="p-2 font-medium">
                        {accepted(item)}
                      </td>
                    );
                  }
                  cells.push(cell);
                  return cells;
                }, [])}

                <td className="p-2 font-medium">
                  {(accepted(item) * item.wholesalePrice).toFixed(2)}
                </td>

                <td className="p-2">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {items.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-500">
            No items added. Select Add Item to begin.
          </p>
        )}
      </div>

      <div className="mt-5 border-t pt-4 text-right">
        <span className="mr-4 font-medium">GRN Total (LKR)</span>
        <span className="text-xl font-bold text-emerald-800">
          {calculateGrnTotal(items).toLocaleString('en-LK', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </span>
      </div>
    </section>
  );
};

export default GrnItemTable;
