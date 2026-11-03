import React from 'react';
import { Outlet } from 'react-router-dom';
import PublicHeader from './PublicHeader';
import PublicFooter from './PublicFooter';

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Community Portal Header */}
      <PublicHeader />

      {/* Blank Page Content Area */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Community Portal Footer */}
      <PublicFooter />
    </div>
  );
};

export default PublicLayout;

