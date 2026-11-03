import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import DashboardSidebar from './DashboardSidebar';
import DashboardHeader from './DashboardHeader';

export const DashboardLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // User profile matching Figma
  const currentUser = {
    name: 'Samira Ahmed',
    role: 'Pharmacy Manager',
    initials: 'SA'
  };

  const currentPharmacyName = 'Greenway Community Pharmacy';

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('selectedPharmacyId');
    window.location.href = '/';
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
        />

        {/* Page Content Body: Kept blank */}
        <main className="flex-1 overflow-y-auto bg-[#f8fafc]">
          <Outlet />
        </main>
      </div>

    </div>
  );
};

export default DashboardLayout;
