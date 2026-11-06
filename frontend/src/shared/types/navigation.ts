export interface NavItem {
  title: string;
  path: string;
  icon: string;
  badge?: string | number;
  owner?: string;
}

export interface UserProfile {
  name: string;
  role: string;
  initials: string;
  email?: string;
}

export interface CurrentPharmacy {
  id: string;
  name: string;
  address?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

