
import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

type Medicine = {
  id: string;
  medicineName: string;
  genericName: string;
  brandTradeName: string;
  category: string;
  strength: string;
  dosageForm: string;
  prescriptionRequired: boolean;
  pharmacyCount: number;
  areas: string[];
  availability: 'AVAILABLE' | 'LOW_AVAILABILITY' | 'OUT_OF_STOCK';
};

const medicines: Medicine[] = [
  {
    id: 'paracetamol-500',
    medicineName: 'Paracetamol 500mg',
    genericName: 'Paracetamol',
    brandTradeName: 'Panadol',
    category: 'Pain Relief',
    strength: '500mg',
    dosageForm: 'Tablet',
    prescriptionRequired: false,
    pharmacyCount: 3,
    areas: ['Kandana', 'Ja-Ela'],
    availability: 'AVAILABLE',
  },
  {
    id: 'amoxicillin-500',
    medicineName: 'Amoxicillin 500mg',
    genericName: 'Amoxicillin',
    brandTradeName: 'Moxypen',
    category: 'Antibiotic',
    strength: '500mg',
    dosageForm: 'Capsule',
    prescriptionRequired: true,
    pharmacyCount: 2,
    areas: ['Kandana', 'Ja-Ela'],
    availability: 'LOW_AVAILABILITY',
  },
  {
    id: 'salbutamol-100',
    medicineName: 'Salbutamol Inhaler 100mcg',
    genericName: 'Salbutamol',
    brandTradeName: 'Ventolin',
    category: 'Respiratory',
    strength: '100mcg',
    dosageForm: 'Inhaler',
    prescriptionRequired: true,
    pharmacyCount: 1,
    areas: ['Kandana'],
    availability: 'AVAILABLE',
  },
];

const FindMedicine: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get('q') ?? '';
  const [searchInput, setSearchInput] = useState(query);
  const [area, setArea] = useState('');
  const [availability, setAvailability] = useState('');
  const [category, setCategory] = useState('');
  const [prescription, setPrescription] = useState('');

  const filteredMedicines = medicines.filter((medicine) => {
    const text = query.toLowerCase().trim();

    const matchesSearch =
      !text ||
      medicine.medicineName.toLowerCase().includes(text) ||
      medicine.genericName.toLowerCase().includes(text) ||
      medicine.brandTradeName.toLowerCase().includes(text);

    const matchesArea =
      !area || medicine.areas.includes(area);

    const matchesAvailability =
      !availability || medicine.availability === availability;

    const matchesCategory =
      !category || medicine.category === category;

    const matchesPrescription =
      !prescription ||
      String(medicine.prescriptionRequired) === prescription;

    return (
      matchesSearch &&
      matchesArea &&
      matchesAvailability &&
      matchesCategory &&
      matchesPrescription
    );
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(searchInput.trim() ? { q: searchInput.trim() } : {});
  };

  const clearFilters = () => {
    setArea('');
    setAvailability('');
    setCategory('');
    setPrescription('');
    setSearchInput('');
    setSearchParams({});
  };

  const selectClass =
    'w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500';

  return (
    <div className="bg-white text-[#103f35]">

      {/* Page Heading */}
      <section className="bg-[#f1f8f3] py-16">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-3">
            Medicine Catalogue
          </p>

          <h1 className="text-4xl font-light">
            Find Medicines
          </h1>

          <p className="text-gray-500 mt-4 max-w-lg">
            Search for medicines and check their availability
            across pharmacies participating in AidFast.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-12">

        {/* Medicine Search */}
        <form
          onSubmit={handleSearch}
          className="flex flex-col sm:flex-row gap-3 p-3 bg-white border border-gray-200 rounded-lg shadow-lg"
        >
          <div className="flex-1 flex items-center gap-3 px-3">
            <span className="text-emerald-700" aria-hidden="true">⌕</span>

            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Enter medicine name, generic name, or brand name"
              aria-label="Search medicines"
              className="w-full py-2 text-sm text-gray-700 outline-none"
            />
          </div>

          <button
            type="submit"
            className="bg-[#006747] hover:bg-[#005338] text-white px-6 py-3 rounded-md font-semibold"
          >
            Search
          </button>
        </form>

        {/* Filters */}
        <div className="max-w-4xl mx-auto mt-8">
          <div className="flex justify-end mb-2">
            <button
              type="button"
              onClick={clearFilters}
              className="text-emerald-700 underline text-sm font-semibold"
            >
              Clear Filters
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <div>
              <label htmlFor="area" className="block text-sm font-semibold mb-1">
                Location / Area
              </label>
              <select
                id="area"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className={selectClass}
              >
                <option value="">All locations</option>
                <option value="Kandana">Kandana</option>
                <option value="Ja-Ela">Ja-Ela</option>
              </select>
            </div>

            <div>
              <label htmlFor="availability" className="block text-sm font-semibold mb-1">
                Availability
              </label>
              <select
                id="availability"
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className={selectClass}
              >
                <option value="">All</option>
                <option value="AVAILABLE">Available</option>
                <option value="LOW_AVAILABILITY">Low Availability</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
              </select>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-semibold mb-1">
                Medicine Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={selectClass}
              >
                <option value="">All categories</option>
                <option value="Pain Relief">Pain Relief</option>
                <option value="Antibiotic">Antibiotic</option>
                <option value="Respiratory">Respiratory</option>
              </select>
            </div>

            <div>
              <label htmlFor="prescription" className="block text-sm font-semibold mb-1">
                Prescription
              </label>
              <select
                id="prescription"
                value={prescription}
                onChange={(e) => setPrescription(e.target.value)}
                className={selectClass}
              >
                <option value="">All</option>
                <option value="true">Required</option>
                <option value="false">Not Required</option>
              </select>
            </div>

          </div>
        </div>

        {/* Medicine Results */}
        <div className="mt-16">
          <h2 className="text-2xl font-light">
            Available Medicines
          </h2>

          <p className="text-gray-500 text-sm mt-1">
            {filteredMedicines.length} medicines found
          </p>

          <div className="mt-5 border-t border-emerald-200">

            {filteredMedicines.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-gray-600">
                  No medicines found matching your search.
                </p>

                <Link
                  to="/request-medicine"
                  className="inline-block mt-4 text-emerald-700 font-semibold underline"
                >
                  Request a Medicine
                </Link>
              </div>
            ) : (
              filteredMedicines.map((medicine) => (
                <div
                  key={medicine.id}
                  className="border-b border-emerald-200 py-6"
                >
                  <div className="grid md:grid-cols-3 gap-6">

                    <div className="md:col-span-2">
                      <p className="uppercase text-xs tracking-wider font-bold text-emerald-700">
                        {medicine.category}
                      </p>

                      <h3 className="text-lg mt-1">
                        {medicine.medicineName}
                      </h3>

                      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-xs text-gray-500">
                        <p>
                          <strong>Generic Name:</strong> {medicine.genericName}
                        </p>
                        <p>
                          <strong>Brand / Trade Name:</strong> {medicine.brandTradeName}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="uppercase text-xs font-semibold text-gray-400">
                          Dosage Form
                        </p>
                        <p className="text-sm mt-1 text-gray-700">
                          {medicine.dosageForm}
                        </p>
                      </div>

                      <div>
                        <p className="uppercase text-xs font-semibold text-gray-400">
                          Prescription
                        </p>
                        <p className="text-sm mt-1 text-gray-700">
                          {medicine.prescriptionRequired ? 'Required' : 'Not Required'}
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
                      className="text-center border border-emerald-600 text-emerald-800 rounded px-6 py-2 text-sm font-semibold hover:bg-emerald-50"
                    >
                      View Availability
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Availability Reminder */}
        <div className="mt-8 bg-[#f1f8f3] border-l-2 border-emerald-700 px-5 py-5">
          <p className="font-semibold text-sm">
            Please confirm before visiting.
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Availability is based on information maintained by participating
            pharmacies and may change. Exact stock quantities are not shown.
          </p>
        </div>

      </section>
    </div>
  );
};

export default FindMedicine;
