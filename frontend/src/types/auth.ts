export interface User {
  id: string;
  fullName: string;
  email: string;
  role?: string;
}

export interface PharmacySummary {
  pharmacyId: string;
  pharmacyName: string;
  role: string;
  permissions: string[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  currentPharmacy: PharmacySummary | null;
  availablePharmacies: PharmacySummary[];
  isAuthenticated: boolean;
  isLoading: boolean;
}

