import { RoleName } from '../models/Role';

/**
 * Standard permissions catalogue for AidFast (Agreed across M1–M6)
 */
export const PERMISSIONS = {
  // Platform, Users & Settings (Member 1)
  USERS_READ: 'users:read',
  USERS_CREATE: 'users:create',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  SETTINGS_MANAGE: 'pharmacy:settings',

  // Catalog & Inventory (Member 2)
  CATALOG_READ: 'catalog:read',
  CATALOG_CREATE: 'catalog:create',
  CATALOG_UPDATE: 'catalog:update',
  INVENTORY_READ: 'inventory:read',
  INVENTORY_ADJUST: 'inventory:adjust',

  // Purchasing & GRN Management (Member 3)
  SUPPLIERS_READ: 'suppliers:read',
  SUPPLIERS_CREATE: 'suppliers:create',
  PO_READ: 'po:read',
  PO_CREATE: 'po:create',
  GRN_READ: 'grn:read',
  GRN_CREATE: 'grn:create',
  GRN_SUBMIT: 'grn:submit',
  GRN_VERIFY: 'grn:verify',
  GRN_CONFIRM: 'grn:confirm',
  GRN_REVERSE: 'grn:reverse',

  // Sales, Allocations & Returns (Member 4)
  SALES_READ: 'sales:read',
  SALES_CREATE: 'sales:create',
  SALES_VOID: 'sales:void',
  RETURNS_READ: 'returns:read',
  RETURNS_CREATE: 'returns:create',
  RETURNS_APPROVE: 'returns:approve',

  // Alerts, Safety Recalls & Reports (Member 5)
  ALERTS_READ: 'alerts:read',
  SAFETY_READ: 'safety:read',
  SAFETY_CREATE: 'safety:create',
  SAFETY_VERIFY: 'safety:verify',
  REPORTS_READ: 'reports:read',

  // Community Medicine Requests (Member 6)
  REQUESTS_READ: 'requests:read',
  REQUESTS_RESPOND: 'requests:respond'
} as const;

export type PermissionKey = typeof PERMISSIONS[keyof typeof PERMISSIONS];

/**
 * Sprint 1 Agreed Role-Permission Matrix
 */
export const ROLE_PERMISSIONS: Record<RoleName, { description: string; permissions: string[] }> = {
  ADMIN: {
    description: 'Full pharmacy administration and system access',
    permissions: ['*']
  },
  PHARMACIST: {
    description: 'Licensed pharmacist with dispensing, catalog, returns approval and management access',
    permissions: [
      PERMISSIONS.USERS_READ,
      PERMISSIONS.SETTINGS_MANAGE,
      PERMISSIONS.CATALOG_READ,
      PERMISSIONS.CATALOG_CREATE,
      PERMISSIONS.CATALOG_UPDATE,
      PERMISSIONS.INVENTORY_READ,
      PERMISSIONS.INVENTORY_ADJUST,
      PERMISSIONS.SALES_READ,
      PERMISSIONS.SALES_CREATE,
      PERMISSIONS.RETURNS_READ,
      PERMISSIONS.RETURNS_CREATE,
      PERMISSIONS.RETURNS_APPROVE,
      PERMISSIONS.ALERTS_READ,
      PERMISSIONS.SAFETY_READ,
      PERMISSIONS.SAFETY_VERIFY,
      PERMISSIONS.REPORTS_READ,
      PERMISSIONS.REQUESTS_READ,
      PERMISSIONS.REQUESTS_RESPOND
    ]
  },
  STAFF: {
    description: 'Dispensing and sales assistant for counter transactions and catalog lookup',
    permissions: [
      PERMISSIONS.CATALOG_READ,
      PERMISSIONS.INVENTORY_READ,
      PERMISSIONS.SALES_READ,
      PERMISSIONS.SALES_CREATE,
      PERMISSIONS.RETURNS_READ,
      PERMISSIONS.RETURNS_CREATE,
      PERMISSIONS.REQUESTS_READ
    ]
  },
  VERIFIER: {
    description: 'Specialized quality and GRN stock verification officer',
    permissions: [
      PERMISSIONS.USERS_READ,
      PERMISSIONS.SUPPLIERS_READ,
      PERMISSIONS.PO_READ,
      PERMISSIONS.GRN_READ,
      PERMISSIONS.GRN_VERIFY,
      PERMISSIONS.INVENTORY_READ,
      PERMISSIONS.SAFETY_READ
    ]
  }
};

