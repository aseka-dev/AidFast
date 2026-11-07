import React from 'react';
import { NavLink } from 'react-router-dom';
import AidFastLogo from '../../shared/components/AidFastLogo';
import PharmacySwitcher from '../components/PharmacySwitcher';
import { useAuth } from '../../shared/context/useAuth';
import {
  DashboardIcon,
  MedicinesIcon,
  InventoryIcon,
  PurchasingIcon,
  TransactionsIcon,
  AlertsIcon,
  CommunityDemandIcon,
  SafetyNoticesIcon,
  ReportsIcon,
  SettingsIcon,
  CloseIcon
} from '../../shared/components/Icons';

interface DashboardSidebarProps {
  onCloseMobile?: () => void;
  user?: {
    name: string;
    role: string;
    initials: string;
  };
  pharmacyName?: string;
  onSignOut?: () => void;
}

interface NavItem {
  title: string;
  path: string;
  icon: React.FC<{ className?: string }>;
  owner: string;
  requiredPermissions: string[];
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  onCloseMobile,
  user = {
    name: 'Samira Ahmed',
    role: 'Pharmacy Manager',
    initials: 'SA'
  },
  pharmacyName = 'Greenway Community Pharmacy',
  onSignOut
}) => {
  const { currentPharmacy, hasPermission } = useAuth();

  const userRole = currentPharmacy?.role?.toUpperCase() || user.role?.toUpperCase();
  const permissions = currentPharmacy?.permissions || [];
  const isAdmin = userRole === 'ADMIN' || permissions.includes('*');

  const allManagementNav: NavItem[] = [
  { title: 'Medicines', path: '/dashboard/medicines', icon: MedicinesIcon, owner: 'M2', requiredPermissions: ['catalog:read'] },
  { title: 'Inventory', path: '/dashboard/inventory', icon: InventoryIcon, owner: 'M2', requiredPermissions: ['inventory:read'] },
  { title: 'Purchasing', path: '/dashboard/purchasing', icon: PurchasingIcon, owner: 'M3', requiredPermissions: ['grn:read', 'po:read', 'suppliers:read'] },
  { title: 'Transactions', path: '/dashboard/transactions', icon: TransactionsIcon, owner: 'M4', requiredPermissions: ['sales:read'] },
  { title: 'Returns', path: '/dashboard/returns', icon: TransactionsIcon, owner: 'M4', requiredPermissions: ['returns:read'] },
  { title: 'Sales', path: '/dashboard/sales', icon: TransactionsIcon, owner: 'M4', requiredPermissions: ['sales:create', 'sales:read'] },

  { title: 'Alerts', path: '/dashboard/alerts', icon: AlertsIcon, owner: 'M5', requiredPermissions: ['alerts:read'] },
  { title: 'Expiry & Stock Alerts', path: '/dashboard/expiry-stock-alerts', icon: AlertsIcon, owner: 'M5', requiredPermissions: ['alerts:read'] },

  { title: 'Community Demand', path: '/dashboard/community-demand', icon: CommunityDemandIcon, owner: 'M5/M6', requiredPermissions: ['requests:read'] },
{ title: 'Safety Notices', path: '/dashboard/safety-notices', icon: SafetyNoticesIcon, owner: 'M5', requiredPermissions: [] },  { title: 'Reports', path: '/dashboard/reports', icon: ReportsIcon, owner: 'M5', requiredPermissions: ['reports:read'] },
  { title: 'Settings', path: '/dashboard/settings', icon: SettingsIcon, owner: 'M1', requiredPermissions: ['pharmacy:settings', 'users:read'] }
];
  // Dynamic role-based filtering based on tenant permissions
  const visibleNav = allManagementNav.filter((item) => {
    if (isAdmin) return true;
    return item.requiredPermissions.some((perm) => hasPermission(perm));
  });

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all duration-150 ${
      isActive
        ? 'bg-[#156e50] text-white font-medium shadow-sm border border-emerald-500/25'
        : 'text-emerald-100/75 hover:text-white hover:bg-emerald-900/40 font-normal'
    }`;

  const currentRole = currentPharmacy?.role || user.role;

  return (
    <aside className="w-72 bg-[#094732] flex flex-col h-full min-h-screen text-white select-none border-r border-emerald-950/40">
      
      {/* Top Header Section */}
      <div className="p-4 pt-5 pb-4 border-b border-emerald-800/30 space-y-3">
        <div className="flex items-center justify-between">
          <AidFastLogo
            variant="dark"
            subtitle={pharmacyName}
            size="md"
          />
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800/50"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          )}
        </div>
        {/* Pharmacy Tenant Switcher */}
        <PharmacySwitcher variant="sidebar" />
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
        
        {/* WORKSPACE */}
        <div>
          <h3 className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-emerald-300/60 uppercase">
            WORKSPACE
          </h3>
          <nav className="space-y-1">
            <NavLink
              to="/dashboard"
              end
              onClick={onCloseMobile}
              className={getNavLinkClass}
            >
              <DashboardIcon className="w-5 h-5 shrink-0 opacity-90" />
              <span>Dashboard</span>
            </NavLink>
          </nav>
        </div>

        {/* MANAGEMENT (Role-Filtered) */}
        <div>
          <div className="px-3 mb-2 flex items-center justify-between">
            <h3 className="text-[11px] font-semibold tracking-wider text-emerald-300/60 uppercase">
              MANAGEMENT
            </h3>
            <span className="text-[10px] bg-emerald-900/60 text-emerald-300 px-1.5 py-0.5 rounded font-medium border border-emerald-700/40">
              {visibleNav.length} modules
            </span>
          </div>
          <nav className="space-y-1">
            {visibleNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.title}
                  to={item.path}
                  onClick={onCloseMobile}
                  className={getNavLinkClass}
                >
                  <Icon className="w-5 h-5 shrink-0 opacity-90" />
                  <span className="flex-1 truncate">{item.title}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

      </div>

      {/* Bottom Profile & Sign Out Footer */}
      <div className="p-3 border-t border-emerald-900/60 bg-[#073928]/60 mt-auto">
        <div className="flex items-center justify-between gap-2.5 px-2 py-1.5">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Initials Avatar */}
            <div className="w-9 h-9 rounded-full bg-[#c8f0d8] text-[#064e3b] font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
              {user.initials}
            </div>
            {/* Name & Dynamic Tenant Role */}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate leading-tight">
                {user.name}
              </p>
              <p className="text-[11px] text-emerald-200/70 truncate flex items-center gap-1">
                <span>{currentRole}</span>
              </p>
            </div>
          </div>

          {/* Sign out button */}
          <button
            type="button"
            onClick={onSignOut || (() => window.location.href = '/login')}
            className="shrink-0 px-2.5 py-1 text-xs font-medium text-red-400 border border-red-500/40 rounded-lg hover:bg-red-500/15 hover:text-red-300 hover:border-red-500/60 transition"
          >
            Sign out
          </button>
        </div>
      </div>

    </aside>
  );
};

export default DashboardSidebar;
