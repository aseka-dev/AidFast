import React, { useState } from 'react';
import type { User, PharmacySummary, AuthState } from '../types/auth';
import { AuthContext } from './AuthContextDefinition';
import { apiUrl } from '../api';

const STORAGE_KEYS = {
  TOKEN: 'aidfast_token',
  USER: 'aidfast_user',
  PHARMACY: 'aidfast_pharmacy',
  PHARMACIES: 'aidfast_pharmacies'
};

const ROLE_PERMISSIONS_FALLBACK: Record<string, string[]> = {
  ADMIN: ['*'],
  OWNER: ['*'],
  PHARMACIST: [
    'pharmacy:settings', 'pharmacy:settings:read',
    'users:read', 'users:create', 'users:update', 'users:delete',
    'catalog:read', 'catalog:create', 'catalog:update',
    'inventory:read', 'inventory:adjust',
    'grn:read', 'grn:create', 'grn:submit', 'suppliers:read', 'po:read',
    'sales:read', 'sales:create',
    'returns:read', 'returns:create', 'returns:approve',
    'alerts:read',
    'requests:read', 'requests:respond',
    'safety:read', 'safety:create', 'safety:verify',
    'reports:read'
  ],
  STAFF: [
    'pharmacy:settings:read',
    'users:read',
    'catalog:read',
    'inventory:read',
    'grn:read', 'grn:create', 'suppliers:read', 'po:read',
    'sales:read', 'sales:create',
    'returns:read', 'returns:create',
    'alerts:read',
    'requests:read',
    'safety:read',
    'reports:read'
  ],
  VERIFIER: [
    'pharmacy:settings:read',
    'users:read',
    'catalog:read',
    'inventory:read',
    'grn:read', 'grn:verify', 'suppliers:read', 'po:read',
    'sales:read',
    'returns:read',
    'alerts:read',
    'requests:read',
    'safety:read',
    'safety:verify',
    'reports:read'
  ]
};

const getInitialAuthState = (): AuthState => {
  try {
    const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
    const storedPharmacy = localStorage.getItem(STORAGE_KEYS.PHARMACY);
    const storedPharmacies = localStorage.getItem(STORAGE_KEYS.PHARMACIES);

    if (storedToken === 'demo-jwt-token') throw new Error('Demo sessions are no longer supported');
    if (storedToken && storedUser) {
      return {
        token: storedToken,
        user: JSON.parse(storedUser),
        currentPharmacy: storedPharmacy ? JSON.parse(storedPharmacy) : null,
        availablePharmacies: storedPharmacies ? JSON.parse(storedPharmacies) : [],
        isAuthenticated: true,
        isLoading: false
      };
    }
  } catch (e) {
    console.error('Failed to parse stored auth session:', e);
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  }

  return {
    user: null,
    token: null,
    currentPharmacy: null,
    availablePharmacies: [],
    isAuthenticated: false,
    isLoading: false
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>(getInitialAuthState);

  const selectPharmacy = async (pharmacyId: string): Promise<boolean> => {
    try {
      const currentToken = state.token || localStorage.getItem(STORAGE_KEYS.TOKEN);
      if (!currentToken) return false;

      const res = await fetch(apiUrl('/api/auth/select-pharmacy'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`
        },
        body: JSON.stringify({ pharmacyId })
      });

      if (res.ok) {
        const data = await res.json();
        const updatedPharmacy: PharmacySummary = {
          pharmacyId: data.pharmacy.id,
          pharmacyName: data.pharmacy.name,
          role: data.role,
          permissions: data.permissions
        };

        localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
        localStorage.setItem(STORAGE_KEYS.PHARMACY, JSON.stringify(updatedPharmacy));

        setState((prev) => ({
          ...prev,
          token: data.token,
          currentPharmacy: updatedPharmacy
        }));
        return true;
      }
    } catch (err) {
      console.warn('Backend select-pharmacy error:', err);
    }
    return false;
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Authenticate against the shared backend.
      const response = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        const loggedUser: User = data.user;
        const pharmacies: PharmacySummary[] = data.pharmacies || [];
        let activeToken = data.token;
        let selectedPharmacy: PharmacySummary | null = pharmacies.length > 0 ? pharmacies[0] : null;

        // Require a pharmacy-scoped token before persisting the session.
        if (selectedPharmacy) {
          const selectRes = await fetch(apiUrl('/api/auth/select-pharmacy'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${activeToken}`
            },
            body: JSON.stringify({ pharmacyId: selectedPharmacy.pharmacyId })
          });
          if (!selectRes.ok) {
            const error = await selectRes.json().catch(() => ({}));
            return { success: false, error: error.message || `Unable to select pharmacy (HTTP ${selectRes.status}).` };
          }
          const selectData = await selectRes.json();
          activeToken = selectData.token;
          selectedPharmacy = {
            pharmacyId: selectData.pharmacy.id,
            pharmacyName: selectData.pharmacy.name,
            role: selectData.role,
            permissions: selectData.permissions
          };
        } else {
          return { success: false, error: 'No active pharmacy membership found.' };
        }

        // Persist session
        localStorage.setItem(STORAGE_KEYS.TOKEN, activeToken);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(loggedUser));
        localStorage.setItem(STORAGE_KEYS.PHARMACIES, JSON.stringify(pharmacies));
        if (selectedPharmacy) {
          localStorage.setItem(STORAGE_KEYS.PHARMACY, JSON.stringify(selectedPharmacy));
        }

        setState({
          user: loggedUser,
          token: activeToken,
          currentPharmacy: selectedPharmacy,
          availablePharmacies: pharmacies,
          isAuthenticated: true,
          isLoading: false
        });

        return { success: true };
      } else {
        const errData = await response.json().catch(() => ({}));
        return { success: false, error: response.status === 401
          ? 'Invalid email or password'
          : errData.message || `Sign-in request failed (HTTP ${response.status}). Please try again.` };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof TypeError
          ? 'Unable to connect to the server. Please check your connection and try again.'
          : 'The server returned an unexpected response. Please try again.'
      };
    }
  };

  const logout = () => {
    try {
      const currentToken = state.token;
      if (currentToken) {
        fetch(apiUrl('/api/auth/logout'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentToken}`
          }
        }).catch((err) => {
          console.warn('Logout notification failed:', err);
        });
      }
    } catch (err) {
      console.warn('Logout cleanup error:', err);
    }

    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.PHARMACY);
    localStorage.removeItem(STORAGE_KEYS.PHARMACIES);

    setState({
      user: null,
      token: null,
      currentPharmacy: null,
      availablePharmacies: [],
      isAuthenticated: false,
      isLoading: false
    });
  };
  const hasPermission = (permission: string): boolean => {
    if (!state.currentPharmacy) return false;
    const permissions = state.currentPharmacy.permissions || [];
    const rawRole = (state.currentPharmacy.role || state.user?.role || '').toUpperCase();

    // Admin / Owner or wildcard has full access
    if (rawRole === 'ADMIN' || rawRole === 'OWNER' || permissions.includes('*')) {
      return true;
    }

    // Direct match from server session permissions
    if (permissions.includes(permission)) {
      return true;
    }

    // RBAC matrix fallback based on role
    const normalizedRole = rawRole.includes('PHARMACIST')
      ? 'PHARMACIST'
      : rawRole.includes('VERIFIER')
      ? 'VERIFIER'
      : rawRole.includes('STAFF')
      ? 'STAFF'
      : rawRole;

    const rolePerms = ROLE_PERMISSIONS_FALLBACK[normalizedRole] || [];
    return rolePerms.includes(permission);
  };


  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        selectPharmacy,
        hasPermission
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

