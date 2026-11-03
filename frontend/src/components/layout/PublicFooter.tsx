import React from 'react';
import { Link } from 'react-router-dom';
import AidFastLogo from '../common/AidFastLogo';

export const PublicFooter: React.FC = () => {
  const quickLinks = [
    { title: 'Home', path: '/' },
    { title: 'Find Medicines', path: '/find-medicines' },
    { title: 'Pharmacies', path: '/pharmacies' },
    { title: 'Request a Medicine', path: '/request-medicine' },
    { title: 'Track Request', path: '/track-request' },
    { title: 'How It Works', path: '/how-it-works' },
  ];

  const infoLinks = [
    { title: 'About Us', path: '/about-us' },
    { title: 'Privacy Policy', path: '/privacy-policy' },
    { title: 'Terms of Use', path: '/terms-of-use' },
    { title: 'Contact Information', path: '/contact' },
  ];

  return (
    <footer className="bg-[#083624] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        
        {/* Main Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10">
          
          {/* Col 1: Logo & Mission Statement (Takes 2 columns on desktop) */}
          <div className="md:col-span-2 space-y-4">
            <AidFastLogo variant="dark" size="md" />
            <p className="text-sm text-emerald-100/70 max-w-sm leading-relaxed">
              Connecting communities with medicine availability information.
            </p>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white tracking-wide mb-3">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs">
              {quickLinks.map((link) => (
                <li key={link.title}>
                  <Link
                    to={link.path}
                    className="text-emerald-100/70 hover:text-white transition-colors"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Information */}
          <div>
            <h4 className="text-sm font-semibold text-white tracking-wide mb-3">
              Information
            </h4>
            <ul className="space-y-2 text-xs">
              {infoLinks.map((link) => (
                <li key={link.title}>
                  <Link
                    to={link.path}
                    className="text-emerald-100/70 hover:text-white transition-colors"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Divider */}
        <div className="border-t border-[#0e4832] pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-emerald-200/60">
            {/* Copyright */}
            <p className="shrink-0">
              © 2026 AidFast. All Rights Reserved.
            </p>

            {/* Disclaimer */}
            <p className="text-center md:text-right leading-relaxed">
              Medicine availability information is provided by participating pharmacies and may change. AidFast does not provide medical advice or guarantee medicine availability.
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default PublicFooter;

