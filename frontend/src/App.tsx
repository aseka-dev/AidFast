
import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

import PublicLayout from './components/layout/PublicLayout';
import DashboardLayout from './components/layout/DashboardLayout';

import LoginPage from './pages/auth/LoginPage';

// Public pages
import PublicHome from './pages/public/PublicHome';
import FindMedicine from './pages/public/FindMedicine';
import Pharmacies from './pages/public/Pharmacies';
import ViewPharmacy from './pages/public/ViewPharmacy';
import RequestMedicine from './pages/public/RequestMedicine';

// Dashboard pages
import DashboardOverview from './pages/dashboard/DashboardOverview';
import SettingsPage from './pages/dashboard/SettingsPage';

// Purchasing pages
import DistributorsPage from './pages/dashboard/DistributorsPage';
import NewGrnPage from './pages/dashboard/NewGrnPage';
import GrnRegisterPage from './pages/dashboard/GrnRegisterPage';
import GrnVerificationPage from './pages/dashboard/GrnVerificationPage';
import GrnDetailsPage from './pages/dashboard/GrnDetailsPage';

// Other members' modules
import {
  MedicinesPage,
  InventoryPage,
  TransactionsPage,
  AlertsPage,
  CommunityDemandPage,
  SafetyNoticesPage,
  ReportsPage
} from './pages/dashboard/ModulePages';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* Public Community Portal */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<PublicHome />} />
            <Route path="/find-medicines" element={<FindMedicine />} />
            <Route path="/pharmacies" element={<Pharmacies />} />
            <Route path="/pharmacies/:id" element={<ViewPharmacy />} />
            <Route path="/how-it-works" element={<PublicHome />} />
            <Route path="/about-us" element={<PublicHome />} />
            <Route path="/request-medicine" element={<RequestMedicine />} />
            <Route path="/track-request" element={<PublicHome />} />
            <Route path="/privacy-policy" element={<PublicHome />} />
            <Route path="/terms-of-use" element={<PublicHome />} />
            <Route path="/contact" element={<PublicHome />} />
          </Route>

          {/* Staff Login */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Staff Dashboard */}
          <Route path="/dashboard"element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<DashboardOverview />} />

            {/* M2 */}
            <Route path="medicines" element={<MedicinesPage />}/>
            <Route path="inventory" element={<InventoryPage />}/>

            {/* M3 - Purchasing */}
            <Route path="purchasing" element={<GrnRegisterPage />}/>
            <Route path="purchasing/distributors" element={<DistributorsPage />}/>
            <Route path="purchasing/verification" element={<GrnVerificationPage />}/>
            <Route path="purchasing/new-grn" element={<NewGrnPage />} />
            <Route path="purchasing/grns/:grnId"element={<GrnDetailsPage />}/>
            <Route path="purchasing/grns/:grnId/edit" element={<NewGrnPage />}/>

            {/* M4 */}
            <Route
              path="transactions"
              element={<TransactionsPage />}
            />

            {/* M5 / M6 */}
            <Route
              path="alerts"
              element={<AlertsPage />}
            />
            <Route
              path="community-demand"
              element={<CommunityDemandPage />}
            />
            <Route
              path="safety-notices"
              element={<SafetyNoticesPage />}
            />
            <Route
              path="reports"
              element={<ReportsPage />}
            />

            {/* M1 */}
            <Route
              path="settings"
              element={<SettingsPage />}
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
