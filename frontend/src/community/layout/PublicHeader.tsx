import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import AidFastLogo from '../../shared/components/AidFastLogo';
import { MenuIcon, CloseIcon } from '../../shared/components/Icons';

export const PublicHeader: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { title: 'Home', path: '/' },
    { title: 'Find Medicines', path: '/find-medicines' },
    { title: 'Pharmacies', path: '/pharmacies' },
    { title: 'How It Works', path: '/how-it-works' },
    { title: 'About Us', path: '/about-us' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <Link to="/" className="flex items-center focus:outline-hidden">
            <AidFastLogo variant="light" size="md" />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <NavLink
                key={link.title}
                to={link.path}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors py-2 relative ${
                    isActive
                      ? 'text-[#065f46] font-semibold after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-[#065f46] after:rounded-full'
                      : 'text-gray-600 hover:text-[#065f46]'
                  }`
                }
              >
                {link.title}
              </NavLink>
            ))}
          </nav>

          {/* Right actions: Request a Medicine */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/request-medicine"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-[#0a5c40] hover:bg-[#084b34] transition-all shadow-sm focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-[#0a5c40]"
            >
              Request a Medicine
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-700 hover:text-emerald-700 hover:bg-gray-100 focus:outline-hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <CloseIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pt-3 pb-5 space-y-2">
          {navLinks.map((link) => (
            <NavLink
              key={link.title}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-base font-medium ${
                  isActive
                    ? 'bg-emerald-50 text-[#065f46] font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              {link.title}
            </NavLink>
          ))}
          <div className="pt-3 flex flex-col gap-2">
            <Link
              to="/request-medicine"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 px-4 rounded-lg text-sm font-medium text-white bg-[#0a5c40] hover:bg-[#084b34]"
            >
              Request a Medicine
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default PublicHeader;

