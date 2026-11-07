import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../shared/context/useAuth';
import { BuildingIcon, ChevronDownIcon, CheckIcon } from '../../shared/components/Icons';

interface PharmacySwitcherProps {
  onSwitched?: (pharmacyName: string) => void;
  className?: string;
  variant?: 'header' | 'sidebar';
}

export const PharmacySwitcher: React.FC<PharmacySwitcherProps> = ({
  onSwitched,
  className = '',
  variant = 'header'
}) => {
  const { currentPharmacy, availablePharmacies, selectPharmacy } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchingToId, setSwitchingToId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = async (pharmacyId: string, pharmacyName: string) => {
    if (pharmacyId === currentPharmacy?.pharmacyId) {
      setIsOpen(false);
      return;
    }

    setIsSwitching(true);
    setSwitchingToId(pharmacyId);
    setErrorMsg(null);

    try {
      const success = await selectPharmacy(pharmacyId);
      if (success) {
        setIsOpen(false);
        onSwitched?.(pharmacyName);
      } else {
        setErrorMsg('Unable to switch to this pharmacy. Please try again.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Switching failed';
      setErrorMsg(msg);
    } finally {
      setIsSwitching(false);
      setSwitchingToId(null);
    }
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role?.toUpperCase()) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'PHARMACIST':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'VERIFIER':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'STAFF':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const activeName = currentPharmacy?.pharmacyName || 'Select Pharmacy';
  const activeRole = currentPharmacy?.role || 'STAFF';
  const hasMultiple = availablePharmacies && availablePharmacies.length > 1;

  if (variant === 'sidebar') {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          type="button"
          onClick={() => hasMultiple && setIsOpen(!isOpen)}
          disabled={!hasMultiple || isSwitching}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left transition border ${
            hasMultiple
              ? 'bg-[#0f543c] hover:bg-[#146348] border-emerald-700/60 cursor-pointer'
              : 'bg-[#0b4330] border-emerald-800/40 cursor-default'
          }`}
          title={hasMultiple ? 'Click to switch active pharmacy branch' : 'Active Pharmacy'}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {activeName}
              </p>
              <p className="text-[10px] text-emerald-200/80 uppercase font-medium">
                {activeRole} • {availablePharmacies.length} {availablePharmacies.length === 1 ? 'branch' : 'branches'}
              </p>
            </div>
          </div>

          {hasMultiple && (
            <ChevronDownIcon
              className={`w-3.5 h-3.5 text-emerald-300 transition-transform duration-200 shrink-0 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          )}
        </button>

        {/* Sidebar Dropdown Menu */}
        {isOpen && (
          <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 p-2 z-50 text-gray-800 animate-in fade-in duration-150">
            <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
                Switch Branch
              </span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-md font-semibold">
                {availablePharmacies.length} available
              </span>
            </div>

            {errorMsg && (
              <div className="m-2 p-2 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
                {errorMsg}
              </div>
            )}

            <div className="mt-1 space-y-1 max-h-56 overflow-y-auto">
              {availablePharmacies.map((p) => {
                const isSelected = p.pharmacyId === currentPharmacy?.pharmacyId;
                const isCurrentSwitching = isSwitching && switchingToId === p.pharmacyId;

                return (
                  <button
                    key={p.pharmacyId}
                    type="button"
                    onClick={() => handleSelect(p.pharmacyId, p.pharmacyName)}
                    disabled={isSwitching}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/80 text-emerald-950 font-semibold border border-emerald-200/70'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <BuildingIcon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-emerald-700' : 'text-gray-400'}`} />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{p.pharmacyName}</p>
                        <span className={`inline-block text-[10px] px-1.5 py-0.2 rounded border font-medium mt-0.5 ${getRoleBadgeColor(p.role)}`}>
                          {p.role}
                        </span>
                      </div>
                    </div>

                    {isCurrentSwitching ? (
                      <span className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin shrink-0" />
                    ) : isSelected ? (
                      <CheckIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Variant: Header (Default)
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => hasMultiple && setIsOpen(!isOpen)}
        disabled={!hasMultiple || isSwitching}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-xs select-none ${
          hasMultiple
            ? 'bg-[#f4f8f5] hover:bg-[#eaf3ed] border-[#cce3d5] text-[#0a4d36] cursor-pointer shadow-2xs'
            : 'bg-gray-50 border-gray-200 text-gray-700 cursor-default'
        }`}
        title={hasMultiple ? 'Switch Pharmacy Workspace' : 'Active Pharmacy'}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <BuildingIcon className="w-4 h-4 text-emerald-700 shrink-0" />
        <span className="font-semibold max-w-[140px] sm:max-w-[200px] truncate">
          {activeName}
        </span>
        <span className={`hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded-md border font-semibold ${getRoleBadgeColor(activeRole)}`}>
          {activeRole}
        </span>

        {hasMultiple && (
          <ChevronDownIcon
            className={`w-3.5 h-3.5 text-emerald-800 transition-transform duration-200 shrink-0 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        )}
      </button>

      {/* Header Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50 text-gray-800 animate-in fade-in duration-150">
          <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-950 uppercase tracking-wider block">
                Pharmacy Workspaces
              </span>
              <span className="text-[11px] text-gray-500">
                Select branch to switch tenant session
              </span>
            </div>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
              {availablePharmacies.length} branches
            </span>
          </div>

          {errorMsg && (
            <div className="m-2 p-2 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
              {errorMsg}
            </div>
          )}

          <div className="mt-1 space-y-1 max-h-64 overflow-y-auto">
            {availablePharmacies.map((p) => {
              const isSelected = p.pharmacyId === currentPharmacy?.pharmacyId;
              const isCurrentSwitching = isSwitching && switchingToId === p.pharmacyId;

              return (
                <button
                  key={p.pharmacyId}
                  type="button"
                  onClick={() => handleSelect(p.pharmacyId, p.pharmacyName)}
                  disabled={isSwitching}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-950 font-semibold border border-emerald-200'
                      : 'hover:bg-gray-50 text-gray-700 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <BuildingIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900">{p.pharmacyName}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${getRoleBadgeColor(p.role)}`}>
                          {p.role}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] text-emerald-700 font-medium">
                            Active Session
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isCurrentSwitching ? (
                    <span className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin shrink-0" />
                  ) : isSelected ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <CheckIcon className="w-3 h-3" />
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="mt-2 pt-2 border-t border-gray-100 px-3 py-1 flex items-center justify-between text-[10px] text-gray-400">
            <span>Server-validated tenant isolation</span>
            <span className="font-mono text-[9px] text-emerald-800">
              {currentPharmacy?.pharmacyId ? `ID: ${currentPharmacy.pharmacyId.slice(-6)}` : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacySwitcher;

