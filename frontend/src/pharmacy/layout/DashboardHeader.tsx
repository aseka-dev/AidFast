import React from 'react';
import { MenuIcon, BellIcon, SearchIcon } from '../../shared/components/Icons';
import PharmacySwitcher from '../components/PharmacySwitcher';

interface DashboardHeaderProps {
  onOpenMobileMenu: () => void;
  userInitials?: string;
  userName?: string;
  userRole?: string;
  onPharmacySwitched?: (pharmacyName: string) => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onOpenMobileMenu,
  userInitials = 'SA',
  userName = 'Samira Ahmed',
  userRole = 'Pharmacy Manager',
  onPharmacySwitched
}) => {
  return (
    <header className="bg-white border-b border-gray-200 h-16 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      
      {/* Left: Mobile Menu Trigger + Search Input Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 -ml-2 rounded-lg text-gray-500 hover:text-emerald-800 hover:bg-gray-100 focus:outline-hidden"
          aria-label="Open sidebar"
        >
          <MenuIcon className="w-5 h-5" />
        </button>

        {/* Search Bar matching Figma screenshot */}
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <SearchIcon className="w-4 h-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by medicine name, batch number, or invoice number"
            className="w-full pl-10 pr-4 py-2 bg-[#f6f9f7] hover:bg-[#f1f6f3] focus:bg-white border border-[#e1ece5] focus:border-emerald-600 rounded-xl text-sm placeholder:text-gray-400 text-gray-800 transition focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
          />
        </div>
      </div>

      {/* Right: Tenant Switcher + Notification Bell + User Avatar */}
      <div className="flex items-center gap-3 sm:gap-4 pl-4">
        {/* Active Pharmacy Switcher (Tenant Selector) */}
        <PharmacySwitcher onSwitched={onPharmacySwitched} variant="header" />

        {/* Notification Bell */}
        <button
          type="button"
          className="relative p-1.5 text-gray-600 hover:text-emerald-800 rounded-lg hover:bg-gray-50 transition focus:outline-hidden"
          aria-label="Notifications"
        >
          <BellIcon className="w-5 h-5" />
          {/* Red indicator badge on top right */}
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>

        {/* User Avatar Circle */}
        <div
          className="w-8 h-8 rounded-full bg-[#0c4e36] text-white font-semibold text-xs flex items-center justify-center shrink-0 shadow-2xs select-none cursor-pointer"
          title={`${userName} (${userRole})`}
        >
          {userInitials}
        </div>
      </div>

    </header>
  );
};

export default DashboardHeader;
