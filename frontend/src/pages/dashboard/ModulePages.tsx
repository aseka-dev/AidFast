
import React from 'react';
import { Link } from 'react-router-dom';

const BlankModule: React.FC = () => <div className="p-6" />;

export const MedicinesPage: React.FC = BlankModule;
export const InventoryPage: React.FC = BlankModule;

export const PurchasingPage: React.FC = () => (
  <div className="space-y-6 p-6">
    <h1 className="text-3xl font-bold text-emerald-950">
      Purchasing
    </h1>

    <p className="text-sm text-gray-500">
      Manage medicine distributors and goods received notes.
    </p>

    <div className="flex flex-wrap gap-3">
      <Link
        to="/dashboard/purchasing/distributors"
        className="rounded-lg border bg-white px-5 py-3 text-sm font-medium text-emerald-800"
      >
        Distributors
      </Link>

      <Link
        to="/dashboard/purchasing/new-grn"
        className="rounded-lg bg-emerald-700 px-5 py-3 text-sm font-medium text-white"
      >
        + New GRN
      </Link>
    </div>
  </div>
);

export const TransactionsPage: React.FC = BlankModule;
export const AlertsPage: React.FC = BlankModule;
export const CommunityDemandPage: React.FC = BlankModule;
export const SafetyNoticesPage: React.FC = BlankModule;
export const ReportsPage: React.FC = BlankModule;
