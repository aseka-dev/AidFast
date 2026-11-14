
export interface DraftSaleItem {
  medicineId: string;
  quantity: number;
  unitPrice: number;
}

export interface SaleRecord {
  _id: string;
  saleNumber: string;
  saleDate: string;
  status: "DRAFT" | "COMPLETED" | "VOIDED";
  totalAmount: { $numberDecimal: string } | string;
}

const API_BASE = (
  import.meta.env.VITE_API_URL || ""
).replace(/\/$/, "");

async function salesRequest<T>(
  pharmacyId: string,
  token: string,
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(
    `${API_BASE}/api/v1/pharmacies/${pharmacyId}/sales${path}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers
      }
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || "Sales request failed"
    );
  }

  return result.data as T;
}

export const createDraftSale = (
  pharmacyId: string,
  token: string,
  items: DraftSaleItem[]
) =>
  salesRequest<SaleRecord>(pharmacyId, token, "", {
    method: "POST",
    body: JSON.stringify({ items })
  });

export const getSaleHistory = (
  pharmacyId: string,
  token: string
) =>
  salesRequest<SaleRecord[]>(
    pharmacyId,
    token,
    ""
  );
