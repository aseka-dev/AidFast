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

// Select portal based on Vercel environment variable
const appMode = import.meta.env.VITE_APP_MODE || "community";

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ========================================================
              COMMUNITY PORTAL (Public & Free - No Login Required)
              ======================================================== */}

          <Route
            path="/"
            element={
              appMode === "pharmacy" ? (
                <Navigate to="/login" replace />
              ) : (
                <PublicLayout />
              )
            }
          >
            <Route index element={<PublicHome />} />
          </Route>

          <Route element={<PublicLayout />}>
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

          {/* ========================================================
              PHARMACY PORTAL (Owners & Staff - Authentication Required)
              ======================================================== */}
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
            <Route path="medicines" element={<MedicinesPage />} />
            <Route path="inventory" element={<InventoryPage />} />

            {/* M3: Purchasing & GRN Workflow */}
            <Route path="purchasing" element={<GrnRegisterPage />} />
            <Route
              path="purchasing/distributors"
              element={<DistributorsPage />}
            />
            <Route
              path="purchasing/verification"
              element={<GrnVerificationPage />}
            />
            <Route path="purchasing/new-grn" element={<NewGrnPage />} />
            <Route path="purchasing/grns/:grnId" element={<GrnDetailsPage />} />
            <Route
              path="purchasing/grns/:grnId/edit"
              element={<NewGrnPage />}
            />

            {/* M4: Sales & Transactions */}
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="sales" element={<SalesPage />} />
            <Route path="returns" element={<ReturnsPage />} />
            {/* M5 / M6: Alerts, Community Demand, Notices & Reports */}
            <Route path="alerts" element={<AlertsPage />} />
            <Route path="community-demand" element={<CommunityDemandPage />} />
            <Route path="safety-notices" element={<SafetyNoticesPage />} />
            <Route path="reports" element={<ReportsPage />} />

            {/* M1: Settings & User Management */}
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
