import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../shared/context/useAuth';
import { apiUrl, authenticatedFetch } from '../../shared/api';
import { SearchIcon, PlusIcon } from '../../shared/components/Icons';

interface StaffUser {
  membershipId: string;
  isActive: boolean;
  user: {
    _id: string;
    fullName: string;
    email: string;
    lastLogin?: string;
    createdAt?: string;
  };
  role: {
    _id: string;
    name: string;
  };
}

export const SettingsPage: React.FC = () => {
  const { user, currentPharmacy } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'settings' | 'users'>('settings');

  // Pharmacy Profile Fields
  const [pharmacyName, setPharmacyName] = useState('Greenway Community Pharmacy');
  const [address, setAddress] = useState('128 Lake Road, Colombo 06, Sri Lanka');
  const [phoneNumber, setPhoneNumber] = useState('+94 11 245 6072');
  const [email, setEmail] = useState('care@greenwaypharmacy.lk');

  // Alert Settings Fields
  const [expiryAlertEnabled, setExpiryAlertEnabled] = useState(true);
  const [expiryAlertMonths, setExpiryAlertMonths] = useState(12);

  const [expiryWarningEnabled, setExpiryWarningEnabled] = useState(true);
  const [expiryWarningMonths, setExpiryWarningMonths] = useState(9);

  const [criticalExpiryEnabled, setCriticalExpiryEnabled] = useState(true);
  const [criticalExpiryMonths, setCriticalExpiryMonths] = useState(6);

  const [lowStockEnabled, setLowStockEnabled] = useState(true);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);

  // System Settings Fields
  const [dateFormat, setDateFormat] = useState('DD MMM YYYY');
  const [currency, setCurrency] = useState('LKR \u2014 Sri Lankan Rupee');

  // User Management State
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add User Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUserFullName, setNewUserFullName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'PHARMACIST' | 'STAFF' | 'VERIFIER' | 'ADMIN'>('PHARMACIST');
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserError, setAddUserError] = useState<string | null>(null);

  // Edit Role Modal State
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);
  const [editRole, setEditRole] = useState<'PHARMACIST' | 'STAFF' | 'VERIFIER' | 'ADMIN'>('PHARMACIST');
  const [editRoleLoading, setEditRoleLoading] = useState(false);
  const [editRoleError, setEditRoleError] = useState<string | null>(null);

  // Change Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pwdCurrent, setPwdCurrent] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = useCallback((type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  }, []);

  // Fetch Settings & Users from Backend
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Settings & Pharmacy Profile
      const settingsRes = await authenticatedFetch(apiUrl('/api/settings'));
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        if (data.pharmacy) {
          setPharmacyName(data.pharmacy.name || '');
          setAddress(data.pharmacy.address || '');
          setPhoneNumber(data.pharmacy.contactNumber || '');
          setEmail(data.pharmacy.email || '');
        }
        if (data.settings) {
          setLowStockThreshold(data.settings.lowStockThreshold ?? 10);
          setDateFormat(data.settings.dateFormat || 'DD MMM YYYY');
          setCurrency(data.settings.currency || 'LKR \u2014 Sri Lankan Rupee');

          const months = data.settings.expiryAlertMonths || [12, 9, 6];
          setExpiryAlertMonths(months.includes(12) ? 12 : 12);
          setExpiryWarningMonths(months.includes(9) ? 9 : 9);
          setCriticalExpiryMonths(months.includes(6) ? 6 : 6);
        }
      }

      // 2. Fetch Pharmacy Users
      const usersRes = await authenticatedFetch(apiUrl('/api/users'));
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      }
    } catch (err) {
      console.warn('Settings load warning:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;
    const fetchData = async () => {
      try {
        const settingsRes = await authenticatedFetch(apiUrl('/api/settings'));
        if (!isCancelled && settingsRes.ok) {
          const data = await settingsRes.json();
          if (data.pharmacy) {
            setPharmacyName(data.pharmacy.name || '');
            setAddress(data.pharmacy.address || '');
            setPhoneNumber(data.pharmacy.contactNumber || '');
            setEmail(data.pharmacy.email || '');
          }
          if (data.settings) {
            setLowStockThreshold(data.settings.lowStockThreshold ?? 10);
            setDateFormat(data.settings.dateFormat || 'DD MMM YYYY');
            setCurrency(data.settings.currency || 'LKR \u2014 Sri Lankan Rupee');

            const months = data.settings.expiryAlertMonths || [12, 9, 6];
            setExpiryAlertMonths(months.includes(12) ? 12 : 12);
            setExpiryWarningMonths(months.includes(9) ? 9 : 9);
            setCriticalExpiryMonths(months.includes(6) ? 6 : 6);
          }
        }

        const usersRes = await authenticatedFetch(apiUrl('/api/users'));
        if (!isCancelled && usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(usersData.users || []);
        }
      } catch (err) {
        console.warn('Initial settings fetch warning:', err);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void fetchData();

    return () => {
      isCancelled = true;
    };
  }, [currentPharmacy?.pharmacyId]);

  // Save Settings Handler
  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const activeAlertMonths: number[] = [];
      if (expiryAlertEnabled) activeAlertMonths.push(expiryAlertMonths);
      if (expiryWarningEnabled) activeAlertMonths.push(expiryWarningMonths);
      if (criticalExpiryEnabled) activeAlertMonths.push(criticalExpiryMonths);

      const payload = {
        name: pharmacyName,
        address,
        contactNumber: phoneNumber,
        email,
        lowStockThreshold: Number(lowStockThreshold),
        expiryAlertMonths: activeAlertMonths.length > 0 ? activeAlertMonths : [12, 9, 6],
        dateFormat,
        currency
      };

      const res = await authenticatedFetch(apiUrl('/api/settings'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showNotification('success', 'Pharmacy settings and profile saved successfully.');
      } else {
        const err = await res.json().catch(() => ({}));
        showNotification('error', err.message || 'Failed to save settings.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred while saving';
      showNotification('error', msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Add User Handler
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddUserError(null);

    if (!newUserFullName.trim() || !newUserEmail.trim() || !newUserPassword) {
      setAddUserError('All fields are required.');
      return;
    }

    if (newUserPassword.length < 8) {
      setAddUserError('Password must contain at least 8 characters.');
      return;
    }

    setAddUserLoading(true);
    try {
      const res = await authenticatedFetch(apiUrl('/api/users'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: newUserFullName.trim(),
          email: newUserEmail.trim().toLowerCase(),
          password: newUserPassword,
          roleName: newUserRole
        })
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewUserFullName('');
        setNewUserEmail('');
        setNewUserPassword('');
        setNewUserRole('PHARMACIST');
        showNotification('success', 'Staff member added successfully.');
        loadData();
      } else {
        const err = await res.json().catch(() => ({}));
        setAddUserError(err.message || 'Unable to add staff member.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to server';
      setAddUserError(msg);
    } finally {
      setAddUserLoading(false);
    }
  };

  // Open Edit User Role
  const handleOpenEditRole = (u: StaffUser) => {
    setEditingUser(u);
    const currRole = (u.role?.name?.toUpperCase() || 'PHARMACIST') as 'PHARMACIST' | 'STAFF' | 'VERIFIER' | 'ADMIN';
    setEditRole(currRole);
    setEditRoleError(null);
  };

  // Update Role Handler
  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditRoleLoading(true);
    setEditRoleError(null);

    try {
      const res = await authenticatedFetch(apiUrl(`/api/users/${editingUser.membershipId}/role`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleName: editRole })
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showNotification('success', `Role for ${editingUser.user?.fullName} updated to ${editRole}.`);
        setEditingUser(null);
        loadData();
      } else {
        setEditRoleError(data.message || 'Failed to update user role.');
      }
    } catch {
      setEditRoleError('Network error while updating role.');
    } finally {
      setEditRoleLoading(false);
    }
  };

  // Remove User Handler
  const handleRemoveUser = async (membershipId: string, staffName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${staffName} from this pharmacy?`)) {
      return;
    }

    try {
      const res = await authenticatedFetch(apiUrl(`/api/users/${membershipId}`), {
        method: 'DELETE'
      });

      if (res.ok) {
        showNotification('success', `${staffName} removed from pharmacy.`);
        loadData();
      } else {
        const err = await res.json().catch(() => ({}));
        showNotification('error', err.message || 'Failed to remove user.');
      }
    } catch {
      showNotification('error', 'Error removing staff member.');
    }
  };

  // Change Password Handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!pwdCurrent || !pwdNew) {
      setPasswordError('Current password and new password are required.');
      return;
    }

    if (pwdNew.length < 8) {
      setPasswordError('New password must contain at least 8 characters.');
      return;
    }

    if (pwdNew !== pwdConfirm) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await authenticatedFetch(apiUrl('/api/auth/change-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: pwdCurrent,
          newPassword: pwdNew
        })
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setPasswordSuccess(data.message || 'Password changed successfully!');
        setPwdCurrent('');
        setPwdNew('');
        setPwdConfirm('');
        setTimeout(() => {
          setPasswordSuccess(null);
          setShowPasswordModal(false);
          showNotification('success', 'Your password was changed successfully.');
        }, 1500);
      } else {
        setPasswordError(data.message || 'Unable to change password.');
      }
    } catch {
      setPasswordError('Network error while changing password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Sub-tab filter
      if (userFilter === 'active' && !u.isActive) return false;
      if (userFilter === 'inactive' && u.isActive) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = u.user?.fullName?.toLowerCase().includes(q);
        const emailMatch = u.user?.email?.toLowerCase().includes(q);
        return nameMatch || emailMatch;
      }
      return true;
    });
  }, [users, userFilter, searchQuery]);

  const activeCount = users.filter((u) => u.isActive).length;
  const inactiveCount = users.filter((u) => !u.isActive).length;

  const getInitials = (name?: string) => {
    if (!name) return 'SA';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getRoleBadge = (roleName?: string) => {
    const r = roleName?.toUpperCase();
    if (r === 'ADMIN' || r === 'OWNER') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
          Owner
        </span>
      );
    }
    if (r === 'PHARMACIST') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
          Pharmacist
        </span>
      );
    }
    if (r === 'VERIFIER') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
          Verifier
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
        Staff
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Top Header matching Figma */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          {activeTab === 'settings' ? 'Settings & Pharmacy Profile' : 'User Management'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {activeTab === 'settings'
            ? 'Manage your pharmacy profile, alert thresholds, account, and system preferences.'
            : 'Add and manage staff members for your pharmacy.'}
        </p>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-sm flex items-center justify-between transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{feedback.type === 'success' ? '\u2713' : '\u26A0'}</span>
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-gray-400 hover:text-gray-700 text-xs font-bold"
          >
            \u2715
          </button>
        </div>
      )}

      {/* Tabs Navigation matching Figma */}
      <div className="flex items-center gap-8 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`pb-3 text-sm font-semibold transition-colors relative cursor-pointer ${
            activeTab === 'settings'
              ? 'text-[#0a5c40] border-b-2 border-[#0a5c40]'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          Pharmacy & System Settings
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`pb-3 text-sm font-semibold transition-colors relative flex items-center gap-2 cursor-pointer ${
            activeTab === 'users'
              ? 'text-[#0a5c40] border-b-2 border-[#0a5c40]'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <span>User Management</span>
          <span className="text-xs bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
            {users.length}
          </span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: PHARMACY & SYSTEM SETTINGS (Figma Screen 1)        */}
      {/* ========================================================= */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* 1. Top-Left Card: Pharmacy Profile */}
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-200/80 space-y-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">Pharmacy Profile</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Information used across AidFast pharmacy records.
                </p>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label htmlFor="pharmacyName" className="block text-xs font-medium text-gray-500 mb-1">
                    Pharmacy name
                  </label>
                  <input
                    id="pharmacyName"
                    type="text"
                    value={pharmacyName}
                    onChange={(e) => setPharmacyName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
                  />
                </div>

                <div>
                  <label htmlFor="pharmacyAddress" className="block text-xs font-medium text-gray-500 mb-1">
                    Address
                  </label>
                  <input
                    id="pharmacyAddress"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-emerald-600 ring-2 ring-emerald-50 rounded-xl focus:outline-hidden transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label htmlFor="phoneNumber" className="block text-xs font-medium text-gray-500 mb-1">
                      Phone number
                    </label>
                    <input
                      id="phoneNumber"
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="pharmacyEmail" className="block text-xs font-medium text-gray-500 mb-1">
                      Email
                    </label>
                    <input
                      id="pharmacyEmail"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Top-Right Card: Alert Settings */}
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-200/80 space-y-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">Alert Settings</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Thresholds used for operational inventory alerts.
                </p>
              </div>

              <div className="space-y-4 pt-1">
                {/* Expiry Alert (12 months) */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setExpiryAlertEnabled(!expiryAlertEnabled)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        expiryAlertEnabled ? 'bg-amber-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out mt-0.5 ml-0.5 ${
                          expiryAlertEnabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <div>
                      <p className="text-xs font-bold text-gray-900">Expiry Alert</p>
                      <p className="text-[11px] text-gray-400">
                        Set the early visibility period for batches approaching expiry.
                      </p>
                    </div>
                  </div>
                  <div className="px-3.5 py-1.5 rounded-xl border border-amber-300 text-amber-700 bg-amber-50/40 text-xs font-semibold shrink-0">
                    {expiryAlertMonths} months
                  </div>
                </div>

                {/* Expiry Warning (9 months) */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setExpiryWarningEnabled(!expiryWarningEnabled)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        expiryWarningEnabled ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out mt-0.5 ml-0.5 ${
                          expiryWarningEnabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <div>
                      <p className="text-xs font-bold text-gray-900">Expiry Warning</p>
                      <p className="text-[11px] text-gray-400">
                        Set the elevated warning period for approaching expiry.
                      </p>
                    </div>
                  </div>
                  <div className="px-3.5 py-1.5 rounded-xl border border-orange-300 text-orange-700 bg-orange-50/40 text-xs font-semibold shrink-0">
                    {expiryWarningMonths} months
                  </div>
                </div>

                {/* Critical Expiry (6 months) */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCriticalExpiryEnabled(!criticalExpiryEnabled)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        criticalExpiryEnabled ? 'bg-red-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out mt-0.5 ml-0.5 ${
                          criticalExpiryEnabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <div>
                      <p className="text-xs font-bold text-gray-900">Critical Expiry</p>
                      <p className="text-[11px] text-gray-400">
                        Set the critical priority period for approaching expiry.
                      </p>
                    </div>
                  </div>
                  <div className="px-3.5 py-1.5 rounded-xl border border-red-300 text-red-700 bg-red-50/40 text-xs font-semibold shrink-0">
                    {criticalExpiryMonths} months
                  </div>
                </div>

                {/* Low Stock (10 units) */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setLowStockEnabled(!lowStockEnabled)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        lowStockEnabled ? 'bg-amber-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out mt-0.5 ml-0.5 ${
                          lowStockEnabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <div>
                      <p className="text-xs font-bold text-gray-900">Low Stock</p>
                      <p className="text-[11px] text-gray-400">
                        Flag medicine stock when available units reach this level.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      value={lowStockThreshold}
                      onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                      className="w-16 px-2 py-1 text-xs font-semibold text-center border border-amber-300 bg-amber-50/40 text-amber-800 rounded-xl focus:outline-hidden"
                    />
                    <span className="text-xs text-gray-500 font-medium">units</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Bottom-Left Card: Account Settings */}
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-200/80 space-y-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">Account Settings</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Credentials for the authorized pharmacy user.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label htmlFor="accountUserName" className="block text-xs font-medium text-gray-500 mb-1">
                      User name
                    </label>
                    <input
                      id="accountUserName"
                      type="text"
                      disabled
                      value={user?.fullName || 'Samira Ahmed'}
                      className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-700 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label htmlFor="accountUserEmail" className="block text-xs font-medium text-gray-500 mb-1">
                      Email / username
                    </label>
                    <input
                      id="accountUserEmail"
                      type="text"
                      disabled
                      value={user?.email || 'samira@greenwaypharmacy.lk'}
                      className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-700 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    Last active: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setPasswordError(null);
                      setPasswordSuccess(null);
                      setShowPasswordModal(true);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                  >
                    Change password
                  </button>
                </div>
              </div>
            </div>

            {/* 4. Bottom-Right Card: System Settings */}
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-200/80 space-y-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">System Settings</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Display preferences for this pharmacy workspace.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label htmlFor="systemDateFormat" className="block text-xs font-medium text-gray-500 mb-1">
                      Date format
                    </label>
                    <select
                      id="systemDateFormat"
                      value={dateFormat}
                      onChange={(e) => setDateFormat(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:outline-hidden focus:border-emerald-600 transition"
                    >
                      <option value="DD MMM YYYY">DD MMM YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    </select>
                    <p className="text-[11px] text-gray-400 mt-1">Example: 01 Oct 2026</p>
                  </div>

                  <div>
                    <label htmlFor="systemCurrency" className="block text-xs font-medium text-gray-500 mb-1">
                      Currency
                    </label>
                    <select
                      id="systemCurrency"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:outline-hidden focus:border-emerald-600 transition"
                    >
                      <option value="LKR \u2014 Sri Lankan Rupee">LKR \u2014 Sri Lankan Rupee</option>
                      <option value="USD \u2014 US Dollar">USD \u2014 US Dollar</option>
                      <option value="GBP \u2014 British Pound">GBP \u2014 British Pound</option>
                    </select>
                    <p className="text-[11px] text-gray-400 mt-1">Example: LKR 12,500.00</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Actions Bar matching Figma */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={loadData}
              disabled={isSaving}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0a5c40] hover:bg-[#084b34] transition shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ========================================================= */}
      {/* TAB 2: USER MANAGEMENT (Figma Screen 2)                    */}
      {/* ========================================================= */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-6 space-y-6">

          {/* Sub-tabs: All Users / Active / Inactive */}
          <div className="flex items-center gap-6 border-b border-gray-100 pb-3">
            <button
              type="button"
              onClick={() => setUserFilter('all')}
              className={`text-xs font-semibold transition cursor-pointer pb-2 relative ${
                userFilter === 'all'
                  ? 'text-[#0a5c40] after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#0a5c40]'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              All Users ({users.length})
            </button>
            <button
              type="button"
              onClick={() => setUserFilter('active')}
              className={`text-xs font-semibold transition cursor-pointer pb-2 relative ${
                userFilter === 'active'
                  ? 'text-[#0a5c40] after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#0a5c40]'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setUserFilter('inactive')}
              className={`text-xs font-semibold transition cursor-pointer pb-2 relative ${
                userFilter === 'inactive'
                  ? 'text-[#0a5c40] after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#0a5c40]'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Inactive ({inactiveCount})
            </button>
          </div>

          {/* Toolbar: Search input + Add User button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:max-w-md">
              <SearchIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search staff members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#0a5c40] hover:bg-[#084b34] transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Add User</span>
            </button>
          </div>

          {/* Staff Table matching Figma Screen 2 */}
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#fcfdfd] border-b border-gray-100 text-gray-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">NAME</th>
                  <th className="py-3 px-4">EMAIL / USERNAME</th>
                  <th className="py-3 px-4">ROLE</th>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      Loading pharmacy team members...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      No team members found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isOwner = u.role?.name?.toUpperCase() === 'ADMIN' || u.role?.name?.toUpperCase() === 'OWNER';
                    const initials = getInitials(u.user?.fullName);

                    return (
                      <tr key={u.membershipId} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-[#dcf4e5] text-[#0a5c40] font-bold text-[11px] flex items-center justify-center shrink-0">
                              {initials}
                            </div>
                            <span className="font-semibold text-gray-900">{u.user?.fullName}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-gray-500">
                          {u.user?.email}
                        </td>
                        <td className="py-3.5 px-4">
                          {getRoleBadge(u.role?.name)}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                            <span className={u.isActive ? 'text-gray-700' : 'text-gray-400'}>
                              {u.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {isOwner ? (
                            <span className="text-gray-400 font-medium">Owner</span>
                          ) : (
                            <div className="flex items-center justify-end gap-3">
                              <button
                                type="button"
                                onClick={() => handleOpenEditRole(u)}
                                className="text-gray-600 hover:text-gray-900 font-semibold cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveUser(u.membershipId, u.user?.fullName)}
                                className="text-red-500 hover:text-red-700 font-semibold cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Actions Bar */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={loadData}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => showNotification('success', 'User list up to date.')}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0a5c40] hover:bg-[#084b34] transition shadow-xs cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD NEW STAFF USER                                 */}
      {/* ========================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Add Staff Member</h3>
                <p className="text-xs text-gray-500">Invite or register a user for this pharmacy branch.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-700 text-lg font-bold p-1 cursor-pointer"
              >
                \u2715
              </button>
            </div>

            {addUserError && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                {addUserError}
              </div>
            )}

            <form onSubmit={handleAddUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nuwan Perera"
                  value={newUserFullName}
                  onChange={(e) => setNewUserFullName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email / Username
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. nuwan@greenwaypharmacy.lk"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Temporary Password (min 8 chars)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Pharmacy Role
                </label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as 'PHARMACIST' | 'STAFF' | 'VERIFIER' | 'ADMIN')}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:outline-hidden focus:border-emerald-600"
                >
                  <option value="PHARMACIST">Pharmacist (Dispensing, Catalog & Approvals)</option>
                  <option value="STAFF">Staff (Sales Counter & Catalog Lookup)</option>
                  <option value="VERIFIER">Verifier (GRN & Quality Verification)</option>
                  <option value="ADMIN">Admin / Owner (Full Pharmacy Authority)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addUserLoading}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#0a5c40] hover:bg-[#084b34] transition cursor-pointer disabled:opacity-50"
                >
                  {addUserLoading ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT USER ROLE                                     */}
      {/* ========================================================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Edit Member Role</h3>
                <p className="text-xs text-gray-500">Update role assignments and permissions for this staff member.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-gray-700 text-lg font-bold p-1 cursor-pointer"
              >
                \u2715
              </button>
            </div>

            {editRoleError && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                {editRoleError}
              </div>
            )}

            <form onSubmit={handleUpdateRole} className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                <p className="text-xs font-semibold text-gray-900">{editingUser.user?.fullName}</p>
                <p className="text-xs text-gray-500">{editingUser.user?.email}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Assigned Role
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as 'PHARMACIST' | 'STAFF' | 'VERIFIER' | 'ADMIN')}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-gray-300 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                >
                  <option value="PHARMACIST">Pharmacist (Dispensing, Catalog & Approvals)</option>
                  <option value="STAFF">Staff (Sales Counter & Catalog Lookup)</option>
                  <option value="VERIFIER">Verifier (GRN & Quality Verification)</option>
                  <option value="ADMIN">Admin / Owner (Full Pharmacy Authority)</option>
                </select>
                <p className="text-[11px] text-gray-400 mt-1">
                  Changing roles will immediately update their navigation and permission gates upon next request.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editRoleLoading}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#0a5c40] hover:bg-[#084b34] transition cursor-pointer disabled:opacity-50"
                >
                  {editRoleLoading ? 'Saving...' : 'Save Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CHANGE PASSWORD                                    */}
      {/* ========================================================= */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">Change Password</h3>
                <p className="text-xs text-gray-500">
                  Update password for <span className="font-semibold text-gray-800">{user?.email}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-400 hover:text-gray-700 text-lg font-bold p-1 cursor-pointer"
              >
                \u2715
              </button>
            </div>

            {passwordError && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200">
                {passwordSuccess}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
                  value={pwdCurrent}
                  onChange={(e) => setPwdCurrent(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">New Password (min 8 chars)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
                  value={pwdNew}
                  onChange={(e) => setPwdNew(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
                  value={pwdConfirm}
                  onChange={(e) => setPwdConfirm(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-4 py-1.5 bg-[#0a5c40] text-white text-xs font-semibold rounded-xl hover:bg-[#084b34] cursor-pointer disabled:opacity-50"
                >
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default SettingsPage;
