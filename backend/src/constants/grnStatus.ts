export const GRN_STATUS = {
  DRAFT: "DRAFT",
  PENDING_VERIFICATION: "PENDING_VERIFICATION",
  CHANGES_REQUESTED: "CHANGES_REQUESTED",
  CONFIRMED: "CONFIRMED",
  REVERSED: "REVERSED",
} as const;

export type GRNStatus =
  (typeof GRN_STATUS)[keyof typeof GRN_STATUS];

export const ALLOWED_GRN_TRANSITIONS: Record<
  GRNStatus,
  readonly GRNStatus[]
> = {
  DRAFT: ["PENDING_VERIFICATION"],
  PENDING_VERIFICATION: ["CHANGES_REQUESTED", "CONFIRMED"],
  CHANGES_REQUESTED: ["PENDING_VERIFICATION"],
  CONFIRMED: ["REVERSED"],
  REVERSED: [],
};

export function canChangeGRNStatus(
  currentStatus: GRNStatus,
  newStatus: GRNStatus
): boolean {
  return ALLOWED_GRN_TRANSITIONS[currentStatus].includes(newStatus);
}
