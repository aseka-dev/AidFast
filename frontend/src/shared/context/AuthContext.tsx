import React, { useState } from 'react';
import type { User, PharmacySummary, AuthState } from '../types/auth';
import { AuthContext } from './AuthContextDefinition';

const STORAGE_KEYS = {
  TOKEN: 'aidfast_token',
  USER: 'aidfast_user',
  PHARMACY: 'aidfast_pharmacy',
  PHARMACIES: 'aidfast_pharmacies'
};

const getInitialAuthState = (): AuthState => {
  try {
    const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
    const storedPharmacy = localStorage.getItem(STORAGE_KEYS.PHARMACY);
    const storedPharmacies = localStorage.getItem(STORAGE_KEYS.PHARMACIES);

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
    localStorage.clear();
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

      const res = await fetch('/api/auth/select-pharmacy', {
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
      // 1. Try real backend API
      const response = await fetch('/api/auth/login', {
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

        // Auto-select primary pharmacy in background
        if (selectedPharmacy) {
          try {
            const selectRes = await fetch('/api/auth/select-pharmacy', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${activeToken}`
              },
              body: JSON.stringify({ pharmacyId: selectedPharmacy.pharmacyId })
            });

            if (selectRes.ok) {
              const selectData = await selectRes.json();
              activeToken = selectData.token;
              selectedPharmacy = {
                pharmacyId: selectData.pharmacy.id,
                pharmacyName: selectData.pharmacy.name,
                role: selectData.role,
                permissions: selectData.permissions
              };
            }
          } catch (e) {
            console.warn('Auto-select fallback to first pharmacy:', e);
          }
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
        return { success: false, error: errData.message || 'Invalid email or password' };
      }
    } catch (networkError) {
      console.warn('Network error or backend unreachable. Checking demo credentials...', networkError);

      // Graceful offline fallback for demo/testing if backend is offline
      if (email.toLowerCase() === 'admin@aidfast.lk' && password === 'AidFast@123') {
        const demoUser: User = {
          id: 'demo-admin-id',
          fullName: 'AidFast Administrator',
          email: 'admin@aidfast.lk',
          role: 'ADMIN'
        };
        const demoPharmacy: PharmacySummary = {
          pharmacyId: 'demo-pharmacy-id',
          pharmacyName: 'Greenway Community Pharmacy',
          role: 'ADMIN',
          permissions: ['*']
        };

        localStorage.setItem(STORAGE_KEYS.TOKEN, 'demo-jwt-token');
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(demoUser));
        localStorage.setItem(STORAGE_KEYS.PHARMACY, JSON.stringify(demoPharmacy));
        localStorage.setItem(STORAGE_KEYS.PHARMACIES, JSON.stringify([demoPharmacy]));

        setState({
          user: demoUser,
          token: 'demo-jwt-token',
          currentPharmacy: demoPharmacy,
          availablePharmacies: [demoPharmacy],
          isAuthenticated: true,
          isLoading: false
        });

        return { success: true };
      }

      return {
        success: false,
        error: 'Unable to connect to server. Please verify backend is running on port 5000.'
      };
    }
  };

  const logout = () => {
    try {
      const currentToken = state.token;
      if (currentToken) {
        fetch('/api/auth/logout', {
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

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        selectPharmacy
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
