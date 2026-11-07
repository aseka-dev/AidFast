import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Shared Auth Provider
import { AuthProvider } from "./shared";

// Community Portal Domain (Public / Patient Facing - M6)
import {
  PublicLayout,
  PublicHome,
  FindMedicine,
  Pharmacies,
  ViewPharmacy,
  RequestMedicine,
} from "./community";

// Pharmacy Management Portal Domain (B2B Staff & Admin - M1-M5)
import {
  LoginPage,
  ProtectedRoute,
  DashboardLayout,
  DashboardOverview,
  SettingsPage,
  DistributorsPage,
  NewGrnPage,
  GrnRegisterPage,
  GrnVerificationPage,
  GrnDetailsPage,
  MedicinesPage,
  SalesPage,
  InventoryPage,
  TransactionsPage,
  ReturnsPage,
  AlertsPage,
  CommunityDemandPage,
  SafetyNoticesPage,
  ReportsPage,
} from "./pharmacy";

// Support environment-based deployment (Vercel) while keeping both accessible in dev
const appMode = import.meta.env.VITE_APP_MODE;
const showCommunity = !appMode || appMode === "community" || appMode === "all";
const showPharmacy = !appMode || appMode === "pharmacy" || appMode === "all";

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ========================================================
              COMMUNITY PORTAL (Public & Free - No Login Required)
              ======================================================== */}
          {showCommunity && (
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
          )}

          {/* ========================================================
              PHARMACY PORTAL (Owners & Staff - Authentication Required)
              ======================================================== */}
          {showPharmacy && (
            <>
              {/* When in dedicated pharmacy deployment mode, root path redirects to dashboard */}
              {appMode === "pharmacy" && (
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              )}

              {/* Dedicated Staff Login */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected Management Workspace */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardOverview />} />

                {/* M2: Medicine Catalog & Inventory */}
                <Route
                  path="medicines"
                  element={
                    <ProtectedRoute requiredPermission="catalog:read">
                      <MedicinesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="inventory"
                  element={
                    <ProtectedRoute requiredPermission="inventory:read">
                      <InventoryPage />
                    </ProtectedRoute>
                  }
                />

                {/* M3: Purchasing & GRN Workflow */}
                <Route
                  path="purchasing"
                  element={
                    <ProtectedRoute requiredPermission="grn:read">
                      <GrnRegisterPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="purchasing/distributors"
                  element={
                    <ProtectedRoute requiredPermission="suppliers:read">
                      <DistributorsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="purchasing/verification"
                  element={
                    <ProtectedRoute requiredPermission="grn:verify">
                      <GrnVerificationPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="purchasing/new-grn"
                  element={
                    <ProtectedRoute requiredPermission="grn:create">
                      <NewGrnPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="purchasing/grns/:grnId"
                  element={
                    <ProtectedRoute requiredPermission="grn:read">
                      <GrnDetailsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="purchasing/grns/:grnId/edit"
                  element={
                    <ProtectedRoute requiredPermission="grn:create">
                      <NewGrnPage />
                    </ProtectedRoute>
                  }
                />

                {/* M4: Sales & Transactions */}
                <Route
                  path="transactions"
                  element={
                    <ProtectedRoute requiredPermission="sales:read">
                      <TransactionsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="sales"
                  element={
                    <ProtectedRoute requiredPermission="sales:create">
                      <SalesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="returns"
                  element={
                    <ProtectedRoute requiredPermission="returns:read">
                      <ReturnsPage />
                    </ProtectedRoute>
                  }
                />

                {/* M5 / M6: Alerts, Community Demand, Notices & Reports */}
                <Route
                  path="alerts"
                  element={
                    <ProtectedRoute requiredPermission="alerts:read">
                      <AlertsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="community-demand"
                  element={
                    <ProtectedRoute requiredPermission="requests:read">
                      <CommunityDemandPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="safety-notices"
                  element={
                    <ProtectedRoute requiredPermission="safety:read">
                      <SafetyNoticesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="reports"
                  element={
                    <ProtectedRoute requiredPermission="reports:read">
                      <ReportsPage />
                    </ProtectedRoute>
                  }
                />

                {/* M1: Settings & User Management */}
                <Route
                  path="settings"
                  element={
                    <ProtectedRoute requiredPermission="pharmacy:settings">
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />
              </Route>
            </>
          )}

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
