import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import DashboardSidebar from './DashboardSidebar';
import DashboardHeader from './DashboardHeader';
import { useAuth } from '../../shared/context/useAuth';

export const DashboardLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { user, currentPharmacy, logout } = useAuth();
  const navigate = useNavigate();

  const getInitials = (name?: string) => {
    if (!name) return 'SA';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const currentUser = {
    name: user?.fullName || 'Samira Ahmed',
    role: currentPharmacy?.role || user?.role || 'Pharmacy Manager',
    initials: getInitials(user?.fullName)
  };

  const currentPharmacyName = currentPharmacy?.pharmacyName || 'Greenway Community Pharmacy';

  const handleSignOut = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
      
      {/* Desktop Sidebar (Fixed) */}
      <div className="hidden lg:flex lg:shrink-0">
        <DashboardSidebar
          user={currentUser}
          pharmacyName={currentPharmacyName}
          onSignOut={handleSignOut}
        />
      </div>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />

          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#094732] z-10 shadow-2xl">
            <DashboardSidebar
              onCloseMobile={() => setMobileSidebarOpen(false)}
              user={currentUser}
              pharmacyName={currentPharmacyName}
              onSignOut={handleSignOut}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header matching Figma screenshot */}
        <DashboardHeader
          onOpenMobileMenu={() => setMobileSidebarOpen(true)}
          userInitials={currentUser.initials}
          userName={currentUser.name}
          userRole={currentUser.role}
        />

        {/* Page Content Body */}
        <main className="flex-1 overflow-y-auto bg-[#f8fafc]">
          <Outlet />
        </main>
      </div>

    </div>
  );
};

export default DashboardLayout;
