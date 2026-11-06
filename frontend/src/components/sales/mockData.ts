
export type MockBatch = {
  batchId: string;
  medicine: string;
  receivedDate: string;
  expiryDate: string;
  quantityAvailable: number;
  unitPrice: number;
  status: "AVAILABLE" | "BLOCKED" | "QUARANTINED";
};

export const mockBatches: MockBatch[] = [
  {
    batchId: "B001",
    medicine: "Paracetamol 500mg",
    receivedDate: "2026-09-01",
    expiryDate: "2027-09-01",
    quantityAvailable: 8,
    unitPrice: 15,
    status: "AVAILABLE",
  },
  {
    batchId: "B002",
    medicine: "Paracetamol 500mg",
    receivedDate: "2026-10-01",
    expiryDate: "2027-10-01",
    quantityAvailable: 20,
    unitPrice: 15,
    status: "AVAILABLE",
  },
  {
    batchId: "B003",
    medicine: "Amoxicillin 500mg",
    receivedDate: "2026-09-15",
    expiryDate: "2027-09-15",
    quantityAvailable: 30,
    unitPrice: 45,
    status: "AVAILABLE",
  },
  {
    batchId: "B004",
    medicine: "Salbutamol Inhaler 100mcg",
    receivedDate: "2026-10-10",
    expiryDate: "2027-10-10",
    quantityAvailable: 10,
    unitPrice: 850,
    status: "AVAILABLE",
  },
];

export default mockBatches;
