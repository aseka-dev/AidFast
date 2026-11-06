
import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

type Pharmacy = {
  id: string;
  name: string;
  address: string;
  location: string;
  phone: string;
  hours: string[];
  medicineIds: string[];
};

type Medicine = {
  id: string;
  name: string;
  category: string;
  generic: string;
  brand: string;
  dosage: string;
  prescription: boolean;
  pharmacyCount: number;
};

const pharmacies: Pharmacy[] = [
  {
    id: 'gimshani',
    name: 'Gimshani Pharmacy',
    address: 'No.1, Main Street, Kandana, Gampaha',
    location: 'Kandana, Sri Lanka',
    phone: '+94 11 223 4567',
    hours: ['Mon-Sat, 8:00 AM-9:00 PM', 'Sun, 8:00 AM-2:00 PM'],
    medicineIds: ['paracetamol-500', 'amoxicillin-500', 'salbutamol-100'],
  },
  {
    id: 'ja-ela-community',
    name: 'Ja-Ela Community Pharmacy',
    address: 'No. 45/A, St. Clare Rd, Ja-Ela',
    location: 'Ja-Ela, Sri Lanka',
    phone: '+94 11 223 0000',
    hours: ['Mon-Sat, 8:00 AM-9:00 PM'],
    medicineIds: ['paracetamol-500', 'amoxicillin-500'],
  },
  {
    id: 'ragama-family',
    name: 'Ragama Family Pharmacy',
    address: 'No. 8, Main Street, Ragama',
    location: 'Ragama, Sri Lanka',
    phone: '+94 11 223 1234',
    hours: ['Mon-Sat, 8:00 AM-9:00 PM', 'Sun, 8:00 AM-5:00 PM'],
    medicineIds: ['paracetamol-500'],
  },
];

const medicines: Medicine[] = [
  {
    id: 'paracetamol-500',
    name: 'Paracetamol 500mg',
    category: 'Pain Relief',
    generic: 'Paracetamol',
    brand: 'Panadol',
    dosage: 'Tablet',
    prescription: false,
    pharmacyCount: 3,
  },
  {
    id: 'amoxicillin-500',
    name: 'Amoxicillin 500mg',
    category: 'Antibiotic',
    generic: 'Amoxicillin',
    brand: 'Moxypen',
    dosage: 'Capsule',
    prescription: true,
    pharmacyCount: 2,
  },
  {
    id: 'salbutamol-100',
    name: 'Salbutamol Inhaler 100mcg',
    category: 'Respiratory',
    generic: 'Salbutamol',
    brand: 'Ventolin',
    dosage: 'Inhaler',
    prescription: true,
    pharmacyCount: 1,
  },
];

const ViewPharmacy: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [search, setSearch] = useState('');

  const pharmacy = pharmacies.find((item) => item.id === id);

  if (!pharmacy) {
    return (
      <section className="max-w-5xl mx-auto px-6 py-24 text-center">
        <h1 className="text-3xl text-[#103f35]">Pharmacy Not Found</h1>
        <p className="text-gray-500 mt-4">
          The pharmacy you are looking for could not be found.
        </p>
        <Link to="/pharmacies" className="inline-block mt-6 text-emerald-700 underline">
          Back to Pharmacies
        </Link>
      </section>
    );
  }

  const filteredMedicines = medicines.filter((medicine) => {
    const matchesPharmacy = pharmacy.medicineIds.includes(medicine.id);
    const text = search.toLowerCase().trim();

    const matchesSearch =
      medicine.name.toLowerCase().includes(text) ||
      medicine.generic.toLowerCase().includes(text) ||
      medicine.brand.toLowerCase().includes(text);

    return matchesPharmacy && matchesSearch;
  });

  return (
    <div className="bg-white text-[#103f35]">

      {/* Pharmacy Information */}
      <section className="bg-[#f1f8f3] py-12">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12">

          <div>
            <p className="uppercase tracking-widest text-sm font-bold text-emerald-700 mb-4">
              Participating Pharmacy
            </p>

            <h1 className="text-4xl font-light">
              {pharmacy.name}
            </h1>

            <p className="text-gray-500 text-sm mt-4">
              ⌖ {pharmacy.address}
            </p>

            <div className="flex flex-wrap gap-3 mt-7">
              <a
                href={`tel:${pharmacy.phone.replace(/\s/g, '')}`}
                className="bg-[#006747] hover:bg-[#005338] text-white px-6 py-3 rounded-md text-sm font-semibold"
              >
                Contact Pharmacy
              </a>

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pharmacy.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-emerald-600 text-emerald-800 px-6 py-3 rounded-md text-sm font-semibold hover:bg-emerald-50"
              >
                Get Directions
              </a>
            </div>
          </div>

          <div className="max-w-sm w-full md:ml-auto">
            <div className="border-b border-emerald-200 py-3">
              <p className="text-xs uppercase text-gray-500 font-semibold">Contact</p>
              <p className="text-gray-800 mt-1">{pharmacy.phone}</p>
            </div>

            <div className="border-b border-emerald-200 py-3">
              <p className="text-xs uppercase text-gray-500 font-semibold">
                Opening Hours
              </p>
              {pharmacy.hours.map((hour) => (
                <p key={hour} className="text-gray-800 mt-1">{hour}</p>
              ))}
            </div>

            <div className="border-b border-emerald-200 py-3">
              <p className="text-xs uppercase text-gray-500 font-semibold">
                Location
              </p>
              <p className="text-gray-800 mt-1">{pharmacy.location}</p>
            </div>
          </div>

        </div>
      </section>

      {/* Medicine Catalogue */}
      <section className="max-w-6xl mx-auto px-6 py-14">
        <p className="uppercase tracking-widest text-xs font-bold text-emerald-700">
          Public Catalogue
        </p>

        <div className="flex flex-col md:flex-row justify-between md:items-end gap-5 mt-2">
          <div>
            <h2 className="text-3xl font-light">
              Available Medicines
            </h2>
            <p className="text-gray-500 mt-2">
              Search medicines currently listed as available or low availability
              at this pharmacy.
            </p>
          </div>

          <Link
            to="/find-medicines"
            className="text-emerald-800 font-semibold text-sm"
          >
            Browse all medicines ›
          </Link>
        </div>

        {/* Search */}
        <div className="max-w-4xl mx-auto mt-12 border border-gray-200 rounded-md px-5 py-3 flex items-center gap-4">
          <span className="text-emerald-700" aria-hidden="true">⌕</span>

          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search medicines at ${pharmacy.name}`}
            aria-label="Search pharmacy medicines"
            className="w-full outline-none text-sm text-gray-700"
          />
        </div>

        {/* Medicine Results */}
        <div className="max-w-5xl mx-auto mt-16 border-t border-emerald-200">
          {filteredMedicines.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No matching medicines found at this pharmacy.
            </div>
          ) : (
            filteredMedicines.map((medicine) => (
              <div
                key={medicine.id}
                className="border-b border-emerald-200 py-6"
              >
                <div className="grid md:grid-cols-3 gap-6">

                  <div className="md:col-span-2">
                    <p className="uppercase tracking-wider text-xs font-bold text-emerald-700">
                      {medicine.category}
                    </p>

                    <h3 className="text-lg mt-1">
                      {medicine.name}
                    </h3>

                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500 mt-2">
                      <p>
                        <strong>Generic Name:</strong> {medicine.generic}
                      </p>
                      <p>
                        <strong>Brand / Trade Name:</strong> {medicine.brand}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="uppercase text-xs font-semibold text-gray-400">
                        Dosage Form
                      </p>
                      <p className="text-sm mt-1 text-gray-700">
                        {medicine.dosage}
                      </p>
                    </div>

                    <div>
                      <p className="uppercase text-xs font-semibold text-gray-400">
                        Prescription
                      </p>
                      <p className="text-sm mt-1 text-gray-700">
                        {medicine.prescription ? 'Required' : 'Not Required'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mt-5">
                  <p className="text-gray-500 text-xs">
                    {medicine.pharmacyCount} participating{' '}
                    {medicine.pharmacyCount === 1 ? 'pharmacy' : 'pharmacies'}
                  </p>

                  <Link
                    to={`/medicines/${medicine.id}/availability`}
                    className="text-center border border-emerald-600 text-emerald-800 rounded px-6 py-2 text-xs font-semibold hover:bg-emerald-50"
                  >
                    View Availability
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        <p className="max-w-5xl mx-auto text-xs text-gray-500 mt-6">
          Demo catalogue only. Medicine availability must be confirmed
          directly with the pharmacy before visiting.
        </p>
      </section>

    </div>
  );
};

export default ViewPharmacy;
